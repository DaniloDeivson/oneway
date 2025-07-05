import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
import { useCache } from '../context/CacheContext';

type Contract = Database['public']['Tables']['contracts']['Row'] & {
  customers?: Database['public']['Tables']['customers']['Row'];
  vehicles?: Database['public']['Tables']['vehicles']['Row'];
  employees?: Database['public']['Tables']['employees']['Row'];
  total_amount?: number;
  paid_amount?: number;
  payment_status?: string;
};

interface ContractStatistics {
  total: number;
  active: number;
  expired: number;
  totalRevenue: number;
  averageDailyRate: number;
}

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [statistics, setStatistics] = useState<ContractStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get, set, has } = useCache();

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar cache primeiro
      const cacheKey = 'contracts';
      if (has(cacheKey)) {
        const cachedData = get<Contract[]>(cacheKey);
        if (cachedData) {
          console.log('📦 Usando contratos do cache');
          setContracts(cachedData);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          customers (
            id,
            name,
            contact_info
          ),
          vehicles (
            id,
            plate,
            model,
            brand,
            year
          ),
          employees (
            id,
            name,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Salvar no cache
      set(cacheKey, data, 5 * 60 * 1000); // 5 minutos
      setContracts(data);
    } catch (err) {
      console.error('Erro ao buscar contratos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar contratos');
    } finally {
      setLoading(false);
    }
  }, [get, set, has]);

  const fetchStatistics = useCallback(async (forceRefresh = false) => {
    try {
      const cacheKey = 'contracts_statistics';
      if (!forceRefresh && has(cacheKey)) {
        const cachedData = get<ContractStatistics>(cacheKey);
        if (cachedData) {
          setStatistics(cachedData);
          return;
        }
      }

      const { data, error } = await supabase
        .from('contracts')
        .select('*');

      if (error) throw error;

      const total = data.length;
      const now = new Date();
      const active = data.filter(c => new Date(c.end_date) > now).length;
      const expired = data.filter(c => new Date(c.end_date) <= now).length;
      const totalRevenue = data.reduce((sum, c) => sum + (c.total_amount || 0), 0);
      const averageDailyRate = data.length > 0 ? totalRevenue / data.length : 0;

      const stats = { total, active, expired, totalRevenue, averageDailyRate };
      set(cacheKey, stats, 5 * 60 * 1000);
      setStatistics(stats);
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    }
  }, [get, set, has]);

  const createContract = useCallback(async (contractData: Partial<Contract>) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .insert([contractData])
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista local e invalidar cache
      setContracts(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Erro ao criar contrato:', err);
      throw err;
    }
  }, []);

  const updateContract = useCallback(async (id: string, updates: Partial<Contract>) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista local
      setContracts(prev => prev.map(contract => 
        contract.id === id ? data : contract
      ));
      return data;
    } catch (err) {
      console.error('Erro ao atualizar contrato:', err);
      throw err;
    }
  }, []);

  const deleteContract = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Atualizar lista local
      setContracts(prev => prev.filter(contract => contract.id !== id));
    } catch (err) {
      console.error('Erro ao deletar contrato:', err);
      throw err;
    }
  }, []);

  const finalizeExpiredContracts = async () => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('contracts')
        .update({ status: 'finalized', updated_at: now })
        .lt('end_date', now)
        .eq('status', 'active');

      if (error) throw error;
      await fetchContracts();
    } catch (err) {
      console.error('Erro ao finalizar contratos:', err);
    }
  };

  const updateContractPaymentStatus = async (id: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ payment_status: paymentStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchContracts();
    } catch (err) {
      console.error('Erro ao atualizar status de pagamento:', err);
    }
  };

  const calculateContractTotal = (contract: Contract) => {
    if (!contract.daily_rate || !contract.start_date || !contract.end_date) return 0;
    
    const start = new Date(contract.start_date);
    const end = new Date(contract.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return contract.daily_rate * days;
  };

  const calculateContractPaid = (contract: Contract) => {
    return contract.paid_amount || 0;
  };

  useEffect(() => {
    fetchContracts();
    fetchStatistics();
  }, [fetchContracts, fetchStatistics]);

  return {
    contracts,
    statistics,
    loading,
    error,
    refetch: fetchContracts,
    refetchStatistics: fetchStatistics,
    createContract,
    updateContract,
    deleteContract,
    finalizeExpiredContracts,
    updateContractPaymentStatus,
    calculateContractTotal,
    calculateContractPaid
  };
}