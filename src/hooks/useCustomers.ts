import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
import { useCache } from '../context/CacheContext';

type Customer = Database['public']['Tables']['customers']['Row'];

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get, set, has } = useCache();

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar cache primeiro
      const cacheKey = 'customers';
      if (has(cacheKey)) {
        const cachedData = get<Customer[]>(cacheKey);
        if (cachedData) {
          console.log('📦 Usando clientes do cache');
          setCustomers(cachedData);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      // Salvar no cache
      set(cacheKey, data, 5 * 60 * 1000); // 5 minutos
      setCustomers(data);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar clientes');
    } finally {
      setLoading(false);
    }
  }, [get, set, has]);

  const createCustomer = useCallback(async (customerData: Partial<Customer>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista local
      setCustomers(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Erro ao criar cliente:', err);
      throw err;
    }
  }, []);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista local
      setCustomers(prev => prev.map(customer => 
        customer.id === id ? data : customer
      ));
      return data;
    } catch (err) {
      console.error('Erro ao atualizar cliente:', err);
      throw err;
    }
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Atualizar lista local
      setCustomers(prev => prev.filter(customer => customer.id !== id));
    } catch (err) {
      console.error('Erro ao deletar cliente:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
}