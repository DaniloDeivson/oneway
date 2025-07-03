import { useState, useEffect } from 'react';
import { supabase, DEFAULT_TENANT_ID } from '../lib/supabase';
import { Database } from '../types/database';
import toast from 'react-hot-toast';

type Contract = Database['public']['Tables']['contracts']['Row'] & {
  customers?: { name: string; document: string; phone: string | null };
  vehicles?: { plate: string; model: string; year: number; type: string };
  contract_vehicles?: Array<{
    id: string;
    vehicle_id: string;
    daily_rate: number | null;
    vehicles: { plate: string; model: string; year: number; type: string };
  }>;
};

type ContractInsert = Database['public']['Tables']['contracts']['Insert'];
type ContractUpdate = Database['public']['Tables']['contracts']['Update'];
type ContractVehicleInsert = Database['public']['Tables']['contract_vehicles']['Insert'];

interface ContractStatistics {
  total_contracts: number;
  active_contracts: number;
  completed_contracts: number;
  cancelled_contracts: number;
  total_revenue: number;
  monthly_revenue: number;
  average_daily_rate: number;
  most_rented_vehicle: {
    id: string;
    plate: string;
    model: string;
    count: number;
  } | null;
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
  conflicting_contracts: Array<{
    id: string;
    start_date: string;
    end_date: string;
    customer_name: string;
  }>;
}

interface ContractVehicleData {
  vehicle_id: string;
  daily_rate?: number;
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
          ),
          contract_vehicles (
            id,
            vehicle_id,
            daily_rate,
            vehicles (
              plate,
              model,
              year,
              type
            )
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
    vehicleIds: string[],
    startDate: string,
    endDate: string,
    contractId?: string
  ): Promise<ConflictCheck> => {
    try {
      // Check conflicts for all vehicles
      const conflictChecks = await Promise.all(
        vehicleIds.map(vehicleId =>
          supabase.rpc('fn_check_contract_conflicts', {
            p_vehicle_id: vehicleId,
            p_start_date: startDate,
            p_end_date: endDate,
            p_contract_id: contractId || null,
            p_tenant_id: DEFAULT_TENANT_ID
          })
        )
      );

      const hasAnyConflict = conflictChecks.some(check => check.data?.[0]?.has_conflict);
      const allConflictingContracts = conflictChecks
        .flatMap(check => check.data?.[0]?.conflicting_contracts || []);

      return {
        has_conflict: hasAnyConflict,
        conflicting_contracts: allConflictingContracts
      };
    } catch (err) {
      console.error('Error checking conflicts:', err);
      return { has_conflict: false, conflicting_contracts: [] };
    }
  };

  const createContractVehicles = async (contractId: string, vehicleData: ContractVehicleData[]) => {
    try {
      const contractVehicles: ContractVehicleInsert[] = vehicleData.map(vehicle => ({
        tenant_id: DEFAULT_TENANT_ID,
        contract_id: contractId,
        vehicle_id: vehicle.vehicle_id,
        daily_rate: vehicle.daily_rate || null
      }));

      const { error } = await supabase
        .from('contract_vehicles')
        .insert(contractVehicles);

      if (error) throw error;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create contract vehicles');
    }
  };

  const updateContractVehicles = async (contractId: string, vehicleData: ContractVehicleData[]) => {
    try {
      // Delete existing contract vehicles
      await supabase
        .from('contract_vehicles')
        .delete()
        .eq('contract_id', contractId);

      // Insert new contract vehicles
      if (vehicleData.length > 0) {
        await createContractVehicles(contractId, vehicleData);
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update contract vehicles');
    }
  };

  const createContract = async (contractData: Omit<ContractInsert, 'tenant_id'> & {
    vehicles?: ContractVehicleData[];
  }) => {
    try {
      const { vehicles: vehicleData, ...contractInfo } = contractData;
      const isMultipleVehicles = vehicleData && vehicleData.length > 1;
      
      // For single vehicle contracts, use the traditional approach
      if (!isMultipleVehicles && vehicleData && vehicleData.length === 1) {
        // Verificar conflitos antes de criar
        const conflicts = await checkContractConflicts(
          [vehicleData[0].vehicle_id],
          contractInfo.start_date,
          contractInfo.end_date
        );

        if (conflicts.has_conflict) {
          throw new Error('Veículo não disponível no período selecionado. Há conflitos com outros contratos.');
        }

        const { data, error } = await supabase
          .from('contracts')
          .insert([{ 
            ...contractInfo, 
            tenant_id: DEFAULT_TENANT_ID,
            vehicle_id: vehicleData[0].vehicle_id,
            daily_rate: vehicleData[0].daily_rate || contractInfo.daily_rate,
            uses_multiple_vehicles: false
          }])
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
        await fetchStatistics();
        return data;
      }

      // For multiple vehicles, use the new approach
      if (vehicleData && vehicleData.length > 0) {
        const vehicleIds = vehicleData.map(v => v.vehicle_id);
        
        // Verificar conflitos para todos os veículos
        const conflicts = await checkContractConflicts(
          vehicleIds,
          contractInfo.start_date,
          contractInfo.end_date
        );

        if (conflicts.has_conflict) {
          throw new Error('Um ou mais veículos não estão disponíveis no período selecionado.');
        }

        // Create the contract
        const { data: contractResult, error: contractError } = await supabase
          .from('contracts')
          .insert([{ 
            ...contractInfo, 
            tenant_id: DEFAULT_TENANT_ID,
            vehicle_id: vehicleData[0].vehicle_id, // Primary vehicle for compatibility
            uses_multiple_vehicles: vehicleData.length > 1
          }])
          .select('*')
          .single();

        if (contractError) throw contractError;

        // Create contract vehicles relationships
        await createContractVehicles(contractResult.id, vehicleData);

        // Fetch the complete contract data
        const { data: completeContract, error: fetchError } = await supabase
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
            ),
            contract_vehicles (
              id,
              vehicle_id,
              daily_rate,
              vehicles (
                plate,
                model,
                year,
                type
              )
            )
          `)
          .eq('id', contractResult.id)
          .single();

        if (fetchError) throw fetchError;

        setContracts(prev => [completeContract, ...prev]);
        await fetchStatistics();
        return completeContract;
      }

      throw new Error('Pelo menos um veículo deve ser selecionado');
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create contract');
    }
  };

  const updateContract = async (id: string, updates: ContractUpdate & {
    vehicles?: ContractVehicleData[];
  }) => {
    try {
      const { vehicles: vehicleData, ...contractUpdates } = updates;
      
      // Se está atualizando datas ou veículo, verificar conflitos
      if (contractUpdates.start_date || contractUpdates.end_date || contractUpdates.vehicle_id || vehicleData) {
        const currentContract = contracts.find(c => c.id === id);
        if (currentContract) {
          let vehicleIds: string[] = [];
          
          if (vehicleData && vehicleData.length > 0) {
            vehicleIds = vehicleData.map(v => v.vehicle_id);
          } else if (contractUpdates.vehicle_id) {
            vehicleIds = [contractUpdates.vehicle_id];
          } else {
            vehicleIds = [currentContract.vehicle_id];
          }
          
          const conflicts = await checkContractConflicts(
            vehicleIds,
            contractUpdates.start_date || currentContract.start_date,
            contractUpdates.end_date || currentContract.end_date,
            id
          );

          if (conflicts.has_conflict) {
            throw new Error('Não é possível atualizar: há conflitos com outros contratos no período selecionado.');
          }
        }
      }

      // Update contract vehicles if provided
      if (vehicleData) {
        await updateContractVehicles(id, vehicleData);
        
        // Update contract to use multiple vehicles if more than one
        contractUpdates.uses_multiple_vehicles = vehicleData.length > 1;
        
        // Set primary vehicle for compatibility
        if (vehicleData.length > 0) {
          contractUpdates.vehicle_id = vehicleData[0].vehicle_id;
        }
      }

      const { data, error } = await supabase
        .from('contracts')
        .update({ ...contractUpdates, updated_at: new Date().toISOString() })
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
          ),
          contract_vehicles (
            id,
            vehicle_id,
            daily_rate,
            vehicles (
              plate,
              model,
              year,
              type
            )
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