import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
import { useCache } from '../context/CacheContext';

type Employee = Database['public']['Tables']['employees']['Row'];

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get, set, has, delete: deleteCache } = useCache();

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar cache primeiro
      const cacheKey = 'employees';
      if (has(cacheKey)) {
        const cachedData = get<Employee[]>(cacheKey);
        if (cachedData) {
          console.log('📦 Usando funcionários do cache');
          setEmployees(cachedData);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true })
        .order('active', { ascending: false }); // Ativos primeiro

      if (error) throw error;

      // Salvar no cache
      set(cacheKey, data, 5 * 60 * 1000); // 5 minutos
      setEmployees(data);
    } catch (err) {
      console.error('Erro ao buscar funcionários:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar funcionários');
    } finally {
      setLoading(false);
    }
  }, [get, set, has]);

  const createEmployee = useCallback(async (employeeData: Partial<Employee>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();

      if (error) throw error;

      // Limpar cache e atualizar lista local
      deleteCache('employees');
      setEmployees(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Erro ao criar funcionário:', err);
      throw err;
    }
  }, [deleteCache]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    try {
      console.log('Atualizando funcionário:', id, updates);
      
      // Tentar atualização com retorno dos dados
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro do Supabase ao atualizar:', error);
        
        // Se falhou com select, tentar sem select
        const { error: updateError } = await supabase
          .from('employees')
          .update(updates)
          .eq('id', id);

        if (updateError) {
          console.error('Erro ao atualizar sem select:', updateError);
          throw updateError;
        } else {
          console.log('Atualização realizada sem retorno de dados');
        }
      } else {
        console.log('Funcionário atualizado com sucesso:', data);
      }

      // Limpar cache e atualizar lista local
      deleteCache('employees');
      setEmployees(prev => prev.map(employee => 
        employee.id === id ? { ...employee, ...updates } : employee
      ));
      
      return data || { id, ...updates };
    } catch (err) {
      console.error('Erro ao atualizar funcionário:', err);
      throw err;
    }
  }, [deleteCache]);

  const deleteEmployee = useCallback(async (id: string) => {
    try {
      console.log('Excluindo funcionário:', id);
      
      // Primeiro, buscar o funcionário para obter o email
      const { data: employee, error: fetchError } = await supabase
        .from('employees')
        .select('contact_info')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar funcionário:', fetchError);
        throw fetchError;
      }

      console.log('Funcionário encontrado:', employee);

      // Tentar fazer soft delete primeiro (marcar como inativo)
      let softDeleteSuccess = false;
      try {
        const { error: updateError } = await supabase
          .from('employees')
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (updateError) {
          console.warn('Erro ao fazer soft delete:', updateError);
        } else {
          console.log('Soft delete realizado com sucesso');
          softDeleteSuccess = true;
        }
      } catch (softDeleteError) {
        console.warn('Erro ao fazer soft delete:', softDeleteError);
      }

      // Se soft delete falhou, tentar DELETE direto
      if (!softDeleteSuccess) {
        try {
          const { error: deleteError } = await supabase
            .from('employees')
            .delete()
            .eq('id', id);

          if (deleteError) {
            console.error('Erro ao fazer DELETE direto:', deleteError);
            throw deleteError;
          } else {
            console.log('DELETE direto realizado com sucesso');
          }
        } catch (deleteError) {
          console.error('Erro ao fazer DELETE direto:', deleteError);
          throw deleteError;
        }
      }

      // Tentar excluir do auth se tiver email (apenas se tivermos permissões de admin)
      if (employee?.contact_info?.email) {
        try {
          // Buscar o usuário no auth pelo email
          const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
          
          if (!authError && authUsers?.users) {
            const authUser = authUsers.users.find(user => 
              user.email === employee.contact_info.email
            );
            
            if (authUser) {
              const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authUser.id);
              if (deleteAuthError) {
                console.warn('Erro ao excluir usuário do auth:', deleteAuthError);
              } else {
                console.log('Usuário excluído do auth com sucesso');
              }
            }
          }
        } catch (authDeleteError) {
          console.warn('Erro ao excluir do auth (pode ser falta de permissões):', authDeleteError);
          // Não falhar se não conseguir excluir do auth
        }
      }

      // Limpar cache e atualizar lista local
      deleteCache('employees');
      setEmployees(prev => prev.filter(employee => employee.id !== id));
      
      console.log('Funcionário excluído com sucesso da lista local');
    } catch (err) {
      console.error('Erro ao deletar funcionário:', err);
      throw err;
    }
  }, [deleteCache]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    refetch: fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee
  };
}