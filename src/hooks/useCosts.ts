import { useState, useEffect } from 'react';
import { supabase, DEFAULT_TENANT_ID } from '../lib/supabase';
import { Database } from '../types/database';

type Cost = Database['public']['Tables']['costs']['Row'] & {
  vehicles?: { plate: string; model: string };
  created_by_name?: string;
  created_by_role?: string;
  created_by_code?: string;
  origin_description?: string;
  is_amount_to_define?: boolean;
  contracts?: { id: string; contract_number: string };
  customers?: { id: string; name: string };
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
      let { data, error } = await supabase
        .from('vw_costs_detailed')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('created_at', { ascending: false });

      // If view doesn't exist or fails, query the table directly
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
          .order('created_at', { ascending: false });

        if (directError) throw directError;
        
        // Transform data to match view structure
        data = directData?.map(cost => ({
          ...cost,
          vehicle_plate: cost.vehicles?.plate,
          vehicle_model: cost.vehicles?.model,
          created_by_name: 'Sistema', // Default for direct query
          created_by_role: 'Sistema',
          origin_description: cost.origin === 'Patio' ? 'Controle de Pátio' : 
                             cost.origin === 'Manutencao' ? 'Manutenção' :
                             cost.origin === 'Manual' ? 'Lançamento Manual' : 
                             cost.origin === 'Compras' ? 'Compras' : 'Sistema',
          is_amount_to_define: cost.amount === 0 && cost.status === 'Pendente'
        })) || [];
      }

      setCosts(data || []);
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

      let { data, error } = await supabase
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
      let { data, error } = await supabase
        .from('vw_billing_detailed')
        .select('*')
        .order('created_at', { ascending: false });

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
    } catch (err) {
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