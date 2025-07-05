import { useState, useEffect } from 'react';
import { supabase, DEFAULT_TENANT_ID } from '../lib/supabase';
import { Database } from '../types/database';

export type Cost = Database['public']['Tables']['costs']['Row'] & {
  vehicles?: { plate: string; model: string };
  created_by_name?: string;
  created_by_role?: string;
  created_by_code?: string;
  origin_description?: string;
  is_amount_to_define?: boolean;
  contracts?: { id: string; contract_number: string };
  customers?: { id: string; name: string };
  // Campos para custos reais (multas, danos, combustível)
  is_real_cost?: boolean;
  source_type?: 'fine' | 'damage' | 'fuel';
  source_id?: string;
  // Campos opcionais para compatibilidade
  document_ref?: string | null;
  observations?: string | null;
  created_by_employee_id?: string | null;
  source_reference_id?: string | null;
  source_reference_type?: string | null;
  department?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  contract_id?: string | null;
  vehicle_plate?: string;
  vehicle_model?: string;
};
type CostInsert = Database['public']['Tables']['costs']['Insert'];
type CostUpdate = Database['public']['Tables']['costs']['Update'];

export const useCosts = () => {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCosts = async () => {
    try {
      setLoading(true);
      
      // First try the view, fallback to direct table query if view doesn't exist
      const { data, error } = await supabase
        .from('vw_costs_detailed')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('created_at', { ascending: false });

      // If view doesn't exist or fails, query the table directly
      let fallbackData = data;
      const fallbackError = error;
      if (fallbackError || !fallbackData) {
        const { data: directData, error: directError } = await supabase
          .from('costs')
          .select(`
            *,
            vehicles (
              plate,
              model
            ),
            contracts (
              id,
              contract_number
            ),
            customers (
              id,
              name
            )
          `)
          .eq('tenant_id', DEFAULT_TENANT_ID)
          .order('created_at', { ascending: false });

        if (directError) throw directError;
        fallbackData = directData?.map(cost => ({
          ...cost,
          vehicle_plate: cost.vehicles?.plate,
          vehicle_model: cost.vehicles?.model,
          customer_name: cost.customers?.name,
          created_by_name: 'Sistema', // Default for direct query
          created_by_role: 'Sistema',
          origin_description: cost.origin === 'Patio' ? 'Controle de Pátio' : 
                             cost.origin === 'Manutencao' ? 'Manutenção' :
                             cost.origin === 'Manual' ? 'Lançamento Manual' : 
                             cost.origin === 'Compras' ? 'Compras' : 'Sistema',
          is_amount_to_define: cost.amount === 0 && cost.status === 'Pendente'
        })) || [];
      }

      setCosts(fallbackData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createCost = async (costData: Omit<CostInsert, 'tenant_id'>) => {
    try {
      // Step 1: Try with ONLY the absolutely minimal required fields
      const minimalData = {
        tenant_id: DEFAULT_TENANT_ID,
        category: costData.category,
        vehicle_id: costData.vehicle_id,
        description: costData.description,
        amount: costData.amount,
        cost_date: costData.cost_date
      };

      const { data, error } = await supabase
        .from('costs')
        .insert([minimalData])
        .select('*')
        .single();

      if (error) {
        // If even minimal data fails, it's a schema/constraint issue
        if (error.message.includes('check constraint') || error.message.includes('violates')) {
          throw new Error(`Schema error - Execute SQL migration! Error: ${error.message}`);
        }
        
        throw error;
      }
      
      // Step 2: If minimal works, try adding optional fields one by one
      if (data) {
        // Test with status and origin
        const withBasicOptional = {
          ...minimalData,
          status: costData.status || 'Pendente',
          origin: costData.origin || 'Manual'
        };
        
        // Delete the test record first
        await supabase.from('costs').delete().eq('id', data.id);
        
        const { data: data2, error: error2 } = await supabase
          .from('costs')
          .insert([withBasicOptional])
          .select('*')
          .single();
          
        if (error2) {
          throw new Error(`Status/Origin error: ${error2.message}`);
        }
        
        // Clean up and proceed with full data
        await supabase.from('costs').delete().eq('id', data2.id);
      }
      
      // Step 3: Try with full data if basics work
      const fullData = {
        ...costData,
        tenant_id: DEFAULT_TENANT_ID
      };
      

      
      const { data: finalData, error: finalError } = await supabase
        .from('costs')
        .insert([fullData])
        .select(`
          *,
          vehicles (
            plate,
            model
          )
        `)
        .single();

      if (finalError) {
        throw finalError;
      }
      
      // Refresh the list to get the updated view data
      await fetchCosts();
      return finalData;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create cost');
    }
  };

  const updateCost = async (id: string, updates: CostUpdate) => {
    try {
      // Only allow status updates for non-admin users
      const { data, error } = await supabase
        .from('costs')
        .update({ status: updates.status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          vehicles (
            plate
          )
        `)
        .single();

      if (error) throw error;
      
      // Refresh the list to get the updated view data
      await fetchCosts();
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update cost');
    }
  };

  const deleteCost = async (id: string) => {
    try {
      // This will be blocked by the trigger for non-admin users
      const { error } = await supabase
        .from('costs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCosts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete cost');
    }
  };

  const getCostStatistics = async () => {
    try {
      const { data, error } = await supabase
        .rpc('fn_cost_statistics_by_origin', { p_tenant_id: DEFAULT_TENANT_ID });

      if (error) throw error;
      return data?.[0] || null;
    } catch (err) {
      return null;
    }
  };

  const debugAutomaticCosts = async () => {
    try {
      const { data, error } = await supabase
        .rpc('fn_debug_automatic_costs', { p_tenant_id: DEFAULT_TENANT_ID });

      if (error) throw error;
      return data || [];
    } catch (err) {
      return [];
    }
  };

  const reprocessInspectionCosts = async () => {
    try {
      const { data, error } = await supabase
        .rpc('fn_reprocess_inspection_costs', { p_tenant_id: DEFAULT_TENANT_ID });

      if (error) throw error;
      
      await fetchCosts(); // Refresh after reprocessing
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to reprocess costs');
    }
  };

  const authorizePurchase = async (id: string) => {
    return updateCost(id, { 
      status: 'Autorizado',
      updated_at: new Date().toISOString()
    });
  };

  // Get costs for billing (with contract and customer info)
  const getBillingCosts = async () => {
    try {
      // Try to use the new billing view first
      let data, error;
      ({ data, error } = await supabase
        .from('vw_billing_detailed')
        .select('*')
        .order('created_at', { ascending: false }));

      // Fallback to direct query if view doesn't exist
      if (error || !data) {
        const { data: directData, error: directError } = await supabase
          .from('costs')
          .select(`
            *,
            vehicles (
              plate,
              model
            ),
            contracts (
              id,
              contract_number
            ),
            customers (
              id,
              name
            )
          `)
          .eq('tenant_id', DEFAULT_TENANT_ID)
          .in('status', ['Autorizado', 'Pago'])
          .neq('origin', 'Manual')
          .order('created_at', { ascending: false });

        if (directError) throw directError;
        data = directData;
      }

      return data || [];
    } catch {
      return [];
    }
  };

  // Generate billing costs automatically
  const generateBillingCosts = async (contractId?: string) => {
    try {
      const { data, error } = await supabase
        .rpc('fn_generate_billing_costs', {
          p_contract_id: contractId || null,
          p_tenant_id: DEFAULT_TENANT_ID
        });

      if (error) throw error;
      
      // Refresh costs after generation
      await fetchCosts();
      
      return data?.[0] || { generated_count: 0, total_amount: 0 };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to generate billing costs');
    }
  };

  // Get billing statistics
  const getBillingStatistics = async () => {
    try {
      const { data, error } = await supabase
        .rpc('fn_billing_statistics', { p_tenant_id: DEFAULT_TENANT_ID });

      if (error) throw error;
      return data?.[0] || null;
    } catch (err) {
      return null;
    }
  };

  // Mark cost as paid
  const markAsPaid = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('costs')
        .update({ 
          status: 'Pago',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh costs after update
      await fetchCosts();
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to mark cost as paid');
    }
  };

  // Função para buscar multas, batidas e combustível do banco de dados
  const fetchRealCosts = async () => {
    try {
      setLoading(true);
      
      // Buscar multas
      const { data: fines, error: finesError } = await supabase
        .from('fines')
        .select(`
          *,
          vehicles (
            plate,
            model
          ),
          contracts (
            id,
            contract_number,
            customers (
              id,
              name
            )
          )
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('created_at', { ascending: false });

      if (finesError) throw finesError;

      // Buscar danos de inspeções
      const { data: damages, error: damagesError } = await supabase
        .from('inspection_damages')
        .select(`
          *,
          inspections (
            vehicles (
              plate,
              model
            ),
            contracts (
              id,
              contract_number,
              customers (
                id,
                name
              )
            )
          )
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('created_at', { ascending: false });

      if (damagesError) throw damagesError;

      // Buscar combustível de manutenções
      const { data: fuelCosts, error: fuelError } = await supabase
        .from('maintenance_checkins')
        .select(`
          *,
          vehicles (
            plate,
            model
          ),
          contracts (
            id,
            contract_number,
            customers (
              id,
              name
            )
          )
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .not('fuel_cost', 'is', null)
        .order('created_at', { ascending: false });

      if (fuelError) throw fuelError;

      // Converter multas para formato de custos
      const finesAsCosts = fines?.map(fine => ({
        id: `fine_${fine.id}`,
        category: 'Multa' as const,
        vehicle_id: fine.vehicle_id,
        description: `Multa: ${fine.description || 'Infração de trânsito'}`,
        amount: fine.amount || 0,
        cost_date: fine.fine_date || fine.created_at,
        status: fine.paid ? 'Pago' as const : 'Pendente' as const,
        origin: 'Sistema' as const,
        created_at: fine.created_at,
        updated_at: fine.updated_at,
        tenant_id: fine.tenant_id,
        vehicles: fine.vehicles,
        contracts: fine.contracts,
        customers: fine.contracts?.customers,
        customer_name: fine.contracts?.customers?.name,
        vehicle_plate: fine.vehicles?.plate,
        vehicle_model: fine.vehicles?.model,
        created_by_name: 'Sistema',
        created_by_role: 'Sistema',
        origin_description: 'Sistema',
        is_amount_to_define: (fine.amount || 0) === 0 && !fine.paid,
        is_real_cost: true,
        source_type: 'fine' as const,
        source_id: fine.id
      })) || [];

      // Converter danos para formato de custos
      const damagesAsCosts = damages?.map(damage => ({
        id: `damage_${damage.id}`,
        category: 'Funilaria' as const,
        vehicle_id: damage.inspections?.vehicles?.id,
        description: `Dano: ${damage.description || 'Avaria identificada'}`,
        amount: damage.estimated_cost || 0,
        cost_date: damage.created_at,
        status: damage.repaired ? 'Pago' as const : 'Pendente' as const,
        origin: 'Sistema' as const,
        created_at: damage.created_at,
        updated_at: damage.updated_at,
        tenant_id: damage.tenant_id,
        vehicles: damage.inspections?.vehicles,
        contracts: damage.inspections?.contracts,
        customers: damage.inspections?.contracts?.customers,
        customer_name: damage.inspections?.contracts?.customers?.name,
        vehicle_plate: damage.inspections?.vehicles?.plate,
        vehicle_model: damage.inspections?.vehicles?.model,
        created_by_name: 'Sistema',
        created_by_role: 'Sistema',
        origin_description: 'Sistema',
        is_amount_to_define: (damage.estimated_cost || 0) === 0 && !damage.repaired,
        is_real_cost: true,
        source_type: 'damage' as const,
        source_id: damage.id
      })) || [];

      // Converter combustível para formato de custos
      const fuelAsCosts = fuelCosts?.map(fuel => ({
        id: `fuel_${fuel.id}`,
        category: 'Combustível' as const,
        vehicle_id: fuel.vehicle_id,
        description: `Combustível: ${fuel.fuel_type || 'Gasolina'} - ${fuel.fuel_liters || 0}L`,
        amount: fuel.fuel_cost || 0,
        cost_date: fuel.checkin_date || fuel.created_at,
        status: fuel.fuel_paid ? 'Pago' as const : 'Pendente' as const,
        origin: 'Sistema' as const,
        created_at: fuel.created_at,
        updated_at: fuel.updated_at,
        tenant_id: fuel.tenant_id,
        vehicles: fuel.vehicles,
        contracts: fuel.contracts,
        customers: fuel.contracts?.customers,
        customer_name: fuel.contracts?.customers?.name,
        vehicle_plate: fuel.vehicles?.plate,
        vehicle_model: fuel.vehicles?.model,
        created_by_name: 'Sistema',
        created_by_role: 'Sistema',
        origin_description: 'Sistema',
        is_amount_to_define: (fuel.fuel_cost || 0) === 0 && !fuel.fuel_paid,
        is_real_cost: true,
        source_type: 'fuel' as const,
        source_id: fuel.id
      })) || [];

      // Combinar custos normais com custos reais
      const allCosts = [
        ...costs,
        ...finesAsCosts,
        ...damagesAsCosts,
        ...fuelAsCosts
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as Cost[];

      setCosts(allCosts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar orçamento de custos "à definir"
  const updateCostEstimate = async (id: string, amount: number, observations?: string) => {
    try {
      const cost = costs.find(c => c.id === id);
      if (!cost) throw new Error('Custo não encontrado');

      // Se for um custo real (multa, dano, combustível), atualizar na tabela original
      if (cost.is_real_cost) {
        switch (cost.source_type) {
          case 'fine': {
            const { error: fineError } = await supabase
              .from('fines')
              .update({ 
                amount: amount,
                observations: observations,
                updated_at: new Date().toISOString()
              })
              .eq('id', cost.source_id);
            if (fineError) throw fineError;
            break;
          }

          case 'damage': {
            const { error: damageError } = await supabase
              .from('inspection_damages')
              .update({ 
                estimated_cost: amount,
                observations: observations,
                updated_at: new Date().toISOString()
              })
              .eq('id', cost.source_id);
            if (damageError) throw damageError;
            break;
          }

          case 'fuel': {
            const { error: fuelError } = await supabase
              .from('maintenance_checkins')
              .update({ 
                fuel_cost: amount,
                observations: observations,
                updated_at: new Date().toISOString()
              })
              .eq('id', cost.source_id);
            if (fuelError) throw fuelError;
            break;
          }
        }
      } else {
        // Se for um custo normal, atualizar na tabela costs
        const { error } = await supabase
          .from('costs')
          .update({ 
            amount: amount,
            observations: observations,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
        if (error) throw error;
      }

      // Recarregar os custos
      await fetchRealCosts();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update cost estimate');
    }
  };

  useEffect(() => {
    fetchCosts();
  }, []);

  return {
    costs,
    loading,
    error,
    createCost,
    updateCost,
    deleteCost,
    updateCostEstimate,
    fetchRealCosts,
    getCostStatistics,
    debugAutomaticCosts,
    reprocessInspectionCosts,
    authorizePurchase,
    getBillingCosts,
    generateBillingCosts,
    getBillingStatistics,
    markAsPaid,
    refetch: fetchCosts
  };
};