import { useState, useEffect } from 'react';
import { supabase, DEFAULT_TENANT_ID } from '../lib/supabase';
import { Database } from '../types/database';
import toast from 'react-hot-toast';

type Contract = Database['public']['Tables']['contracts']['Row'] & {
  customers?: { name: string; document: string; phone: string | null };
  vehicles?: { plate: string; model: string; year: number; type: string };
};

type ContractInsert = Database['public']['Tables']['contracts']['Insert'];
type ContractUpdate = Database['public']['Tables']['contracts']['Update'];

interface ContractStatistics {
  total_contracts: number;
  active_contracts: number;
  completed_contracts: number;
  cancelled_contracts: number;
  total_revenue: number;
  monthly_revenue: number;
  average_daily_rate: number;
  most_rented_vehicle: any;
}

interface AvailableVehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  type: string;
  status: string;
}

interface ConflictCheck {
  has_conflict: boolean;
  conflicting_contracts: any[];
}

export const useContracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [statistics, setStatistics] = useState<ContractStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          customers (
            name,
            document,
            phone
          ),
          vehicles (
            plate,
            model,
            year,
            type
          )
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase
        .rpc('fn_contract_statistics', { p_tenant_id: DEFAULT_TENANT_ID });

      if (error) throw error;
      if (data && data.length > 0) {
        setStatistics(data[0]);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const getAvailableVehicles = async (startDate: string, endDate: string, excludeContractId?: string): Promise<AvailableVehicle[]> => {
    try {
      const { data, error } = await supabase
        .rpc('fn_available_vehicles', {
          p_start_date: startDate,
          p_end_date: endDate,
          p_tenant_id: DEFAULT_TENANT_ID,
          p_exclude_contract_id: excludeContractId || null
        });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching available vehicles:', err);
      return [];
    }
  };

  const checkContractConflicts = async (
    vehicleId: string,
    startDate: string,
    endDate: string,
    contractId?: string
  ): Promise<ConflictCheck> => {
    try {
      const { data, error } = await supabase
        .rpc('fn_check_contract_conflicts', {
          p_vehicle_id: vehicleId,
          p_start_date: startDate,
          p_end_date: endDate,
          p_contract_id: contractId || null,
          p_tenant_id: DEFAULT_TENANT_ID
        });

      if (error) throw error;
      return data?.[0] || { has_conflict: false, conflicting_contracts: [] };
    } catch (err) {
      console.error('Error checking conflicts:', err);
      return { has_conflict: false, conflicting_contracts: [] };
    }
  };

  const createContract = async (contractData: Omit<ContractInsert, 'tenant_id'>) => {
    try {
      // Verificar conflitos antes de criar
      const conflicts = await checkContractConflicts(
        contractData.vehicle_id!,
        contractData.start_date,
        contractData.end_date
      );

      if (conflicts.has_conflict) {
        throw new Error('Veículo não disponível no período selecionado. Há conflitos com outros contratos.');
      }

      const { data, error } = await supabase
        .from('contracts')
        .insert([{ ...contractData, tenant_id: DEFAULT_TENANT_ID }])
        .select(`
          *,
          customers (
            name,
            document,
            phone
          ),
          vehicles (
            plate,
            model,
            year,
            type
          )
        `)
        .single();

      if (error) throw error;
      setContracts(prev => [data, ...prev]);
      await fetchStatistics(); // Atualizar estatísticas
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create contract');
    }
  };

  const updateContract = async (id: string, updates: ContractUpdate) => {
    try {
      // Se está atualizando datas ou veículo, verificar conflitos
      if (updates.start_date || updates.end_date || updates.vehicle_id) {
        const currentContract = contracts.find(c => c.id === id);
        if (currentContract) {
          const conflicts = await checkContractConflicts(
            updates.vehicle_id || currentContract.vehicle_id,
            updates.start_date || currentContract.start_date,
            updates.end_date || currentContract.end_date,
            id
          );

          if (conflicts.has_conflict) {
            throw new Error('Não é possível atualizar: há conflitos com outros contratos no período selecionado.');
          }
        }
      }

      const { data, error } = await supabase
        .from('contracts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          customers (
            name,
            document,
            phone
          ),
          vehicles (
            plate,
            model,
            year,
            type
          )
        `)
        .single();

      if (error) throw error;
      setContracts(prev => prev.map(c => c.id === id ? data : c));
      await fetchStatistics(); // Atualizar estatísticas
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update contract');
    }
  };

  const deleteContract = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setContracts(prev => prev.filter(c => c.id !== id));
      await fetchStatistics(); // Atualizar estatísticas
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete contract');
    }
  };

  const finalizeExpiredContracts = async () => {
    try {
      const { data, error } = await supabase
        .rpc('fn_auto_finalize_contracts');

      if (error) throw error;
      
      if (data > 0) {
        await fetchContracts(); // Recarregar contratos
        await fetchStatistics(); // Atualizar estatísticas
      }
      
      return data; // Retorna número de contratos finalizados
    } catch (err) {
      console.error('Error finalizing contracts:', err);
      return 0;
    }
  };

  const updateContractPaymentStatus = async (contractId: string) => {
    try {
      const { error } = await supabase
        .rpc('fn_update_contract_payment_status', { p_contract_id: contractId });

      if (error) throw error;
      
      await fetchContracts(); // Recarregar contratos
      return true;
    } catch (err) {
      console.error('Error updating contract payment status:', err);
      return false;
    }
  };

  const calculateContractTotal = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('fn_calculate_contract_total', { p_contract_id: contractId });

      if (error) throw error;
      return data || 0;
    } catch (err) {
      console.error('Error calculating contract total:', err);
      return 0;
    }
  };

  const calculateContractPaid = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('fn_calculate_contract_paid', { p_contract_id: contractId });

      if (error) throw error;
      return data || 0;
    } catch (err) {
      console.error('Error calculating contract paid amount:', err);
      return 0;
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchStatistics();
  }, []);

  return {
    contracts,
    statistics,
    loading,
    error,
    createContract,
    updateContract,
    deleteContract,
    getAvailableVehicles,
    checkContractConflicts,
    finalizeExpiredContracts,
    updateContractPaymentStatus,
    calculateContractTotal,
    calculateContractPaid,
    refetch: fetchContracts,
    refetchStatistics: fetchStatistics
  };
};