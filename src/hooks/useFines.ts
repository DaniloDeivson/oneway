import { useState, useEffect } from 'react';
import { supabase, DEFAULT_TENANT_ID } from '../lib/supabase';
import { Database } from '../types/database';
import toast from 'react-hot-toast';

type Fine = Database['public']['Tables']['fines']['Row'] & {
  vehicles?: { plate: string; model: string; year: number };
  drivers?: { name: string; cpf: string | null };
  employees?: { name: string; role: string };
  contract_id?: string;
  customer_id?: string;
  customer_name?: string;
  contracts?: { id: string; contract_number: string };
  customers?: { id: string; name: string };
};

type FineInsert = Database['public']['Tables']['fines']['Insert'];
type FineUpdate = Database['public']['Tables']['fines']['Update'];

interface FineStatistics {
  total_fines: number;
  pending_fines: number;
  paid_fines: number;
  contested_fines: number;
  total_amount: number;
  pending_amount: number;
  notified_count: number;
  not_notified_count: number;
  avg_fine_amount: number;
  most_common_infraction: string;
  most_fined_vehicle: string;
}

export const useFines = () => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [statistics, setStatistics] = useState<FineStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFines = async () => {
    try {
      setLoading(true);
      
      // Try to use the detailed view first, fallback to direct query
      let { data, error } = await supabase
        .from('vw_fines_detailed')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('created_at', { ascending: false });

      // If view doesn't exist, query directly
      if (error || !data) {
        const { data: directData, error: directError } = await supabase
          .from('fines')
          .select(`
            *,
            vehicles (
              plate,
              model,
              year
            ),
            drivers (
              name,
              cpf
            ),
            employees (
              name,
              role
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
        data = directData;
      }

      // Associate fines with contracts based on date
      const enhancedFines = await associateFinesWithContracts(data || []);
      setFines(enhancedFines);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Erro ao carregar multas');
    } finally {
      setLoading(false);
    }
  };

  // Function to associate fines with contracts based on date
  const associateFinesWithContracts = async (finesData: Fine[]) => {
    try {
      // Get all active contracts
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          id,
          customer_id,
          vehicle_id,
          start_date,
          end_date,
          customers (
            id,
            name
          )
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID);

      if (error) throw error;

      // Associate each fine with a contract if dates match
      return finesData.map(fine => {
        const matchingContract = contracts?.find(contract => 
          contract.vehicle_id === fine.vehicle_id &&
          new Date(fine.infraction_date) >= new Date(contract.start_date) &&
          new Date(fine.infraction_date) <= new Date(contract.end_date)
        );

        if (matchingContract) {
          return {
            ...fine,
            contract_id: matchingContract.id,
            customer_id: matchingContract.customer_id,
            customer_name: matchingContract.customers?.name
          };
        }
        return fine;
      });
    } catch (err) {
      console.error('Error associating fines with contracts:', err);
      return finesData;
    }
  };

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase
        .rpc('fn_fines_statistics', { p_tenant_id: DEFAULT_TENANT_ID });

      if (error) throw error;
      if (data && data.length > 0) {
        setStatistics(data[0]);
      }
    } catch (err) {
      console.error('Error fetching fines statistics:', err);
    }
  };

  const createFine = async (fineData: Omit<FineInsert, 'tenant_id'>) => {
    try {
      const { data, error } = await supabase
        .from('fines')
        .insert([{ ...fineData, tenant_id: DEFAULT_TENANT_ID }])
        .select(`
          *,
          vehicles (
            plate,
            model,
            year
          ),
          drivers (
            name,
            cpf
          ),
          employees (
            name,
            role
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
        .single();

      if (error) throw error;
      
      // Associate with contract if applicable
      const enhancedFine = await associateFinesWithContracts([data]);
      setFines(prev => [enhancedFine[0], ...prev]);
      await fetchStatistics();
      toast.success('Multa registrada com sucesso!');
      return enhancedFine[0];
    } catch (err) {
      toast.error('Erro ao criar multa: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      throw new Error(err instanceof Error ? err.message : 'Failed to create fine');
    }
  };

  const updateFine = async (id: string, updates: FineUpdate) => {
    try {
      const { data, error } = await supabase
        .from('fines')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          vehicles (
            plate,
            model,
            year
          ),
          drivers (
            name,
            cpf
          ),
          employees (
            name,
            role
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
        .single();

      if (error) throw error;
      
      // Associate with contract if applicable
      const enhancedFine = await associateFinesWithContracts([data]);
      setFines(prev => prev.map(f => f.id === id ? enhancedFine[0] : f));
      await fetchStatistics();
      toast.success('Multa atualizada com sucesso!');
      return enhancedFine[0];
    } catch (err) {
      toast.error('Erro ao atualizar multa: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      throw new Error(err instanceof Error ? err.message : 'Failed to update fine');
    }
  };

  const deleteFine = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fines')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setFines(prev => prev.filter(f => f.id !== id));
      await fetchStatistics();
      toast.success('Multa excluída com sucesso!');
    } catch (err) {
      toast.error('Erro ao excluir multa: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      throw new Error(err instanceof Error ? err.message : 'Failed to delete fine');
    }
  };

  const markAsNotified = async (id: string) => {
    return updateFine(id, { notified: true });
  };

  const markAsNotNotified = async (id: string) => {
    return updateFine(id, { notified: false });
  };

  // Get fines for a specific contract
  const getFinesByContract = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('fines')
        .select(`
          *,
          vehicles (
            plate,
            model,
            year
          ),
          drivers (
            name,
            cpf
          ),
          employees (
            name,
            role
          )
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching fines by contract:', err);
      return [];
    }
  };

  // Get fines for a specific vehicle
  const getFinesByVehicle = async (vehicleId: string) => {
    try {
      const { data, error } = await supabase
        .from('fines')
        .select(`
          *,
          drivers (
            name,
            cpf
          ),
          employees (
            name,
            role
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
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching fines by vehicle:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchFines();
    fetchStatistics();
  }, []);

  return {
    fines,
    statistics,
    loading,
    error,
    createFine,
    updateFine,
    deleteFine,
    markAsNotified,
    markAsNotNotified,
    getFinesByContract,
    getFinesByVehicle,
    refetch: fetchFines
  };
};