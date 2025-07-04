import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin, DEFAULT_TENANT_ID, isAdminConfigured } from '../lib/supabase';
import { Database } from '../types/database';
import toast from 'react-hot-toast';

type Employee = Database['public']['Tables']['employees']['Row'];
type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fazendo fetch dos funcionários...');
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('name', { ascending: true });

      if (error) throw error;
      
      console.log('📋 Funcionários carregados:', data?.length || 0);
      console.log('📊 Lista atual:', data?.map(e => ({ name: e.name, email: e.contact_info?.email, active: e.active })));
      
      setEmployees(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (employeeData: Omit<EmployeeInsert, 'tenant_id'>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([{ ...employeeData, tenant_id: DEFAULT_TENANT_ID }])
        .select()
        .single();

      if (error) throw error;
      setEmployees(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success('Funcionário cadastrado com sucesso!');
      return data;
    } catch (err) {
      toast.error('Erro ao criar funcionário: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      throw new Error(err instanceof Error ? err.message : 'Failed to create employee');
    }
  };

  const updateEmployee = async (id: string, updates: EmployeeUpdate) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update({ ...updates, permissions: updates.permissions ?? undefined, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setEmployees(prev => prev.map(e => e.id === id ? data : e));
      toast.success('Funcionário atualizado com sucesso!');
      return data;
    } catch (err) {
      toast.error('Erro ao atualizar funcionário: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      throw new Error(err instanceof Error ? err.message : 'Failed to update employee');
    }
  };

  const deleteEmployee = async (id: string): Promise<void> => {
    // 1. Validação inicial
    if (!id?.trim()) {
      throw new Error('ID do usuário é obrigatório');
    }

    // 2. Buscar dados do usuário
    const { data: user, error: fetchError } = await supabase
      .from('employees')
      .select('id, name, role, contact_info, active')
      .eq('id', id)
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .single();

    if (fetchError || !user) {
      throw new Error('Usuário não encontrado');
    }

    // 3. Validações de segurança
    if (user.role === 'Admin') {
      const { data: adminCount } = await supabase
        .from('employees')
        .select('id', { count: 'exact' })
        .eq('role', 'Admin')
        .eq('active', true)
        .eq('tenant_id', DEFAULT_TENANT_ID);

      if ((adminCount?.length || 0) <= 1) {
        throw new Error('Não é possível excluir o último administrador');
      }
    }

    if (user.contact_info?.email === 'profitestrategista@gmail.com') {
      throw new Error('Este usuário não pode ser excluído');
    }

    // 4. Limpar referências em outras tabelas
    const cleanupOperations = [
      supabase.from('service_notes').update({ employee_id: null }).eq('employee_id', id),
      supabase.from('inspections').update({ employee_id: null }).eq('employee_id', id),
      supabase.from('contracts').update({ salesperson_id: null }).eq('salesperson_id', id),
      supabase.from('fines').update({ employee_id: null, driver_id: null }).or(`employee_id.eq.${id},driver_id.eq.${id}`),
      supabase.from('costs').update({ created_by_employee_id: null }).eq('created_by_employee_id', id)
    ];

    await Promise.allSettled(cleanupOperations);

    // 5. Registrar remoção para auditoria
    if (user.contact_info?.email) {
      await supabase
        .from('removed_users')
        .upsert([{
          id: user.id,
          email: user.contact_info.email,
          removed_at: new Date().toISOString()
        }])
        .then(() => {}, () => {}); // Ignora erros de conflito
    }

    // 6. Excluir da tabela employees
    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
      .eq('tenant_id', DEFAULT_TENANT_ID);

    if (deleteError) {
      throw new Error(`Erro ao excluir usuário: ${deleteError.message}`);
    }

    // Verificar se foi realmente excluído
    const { data: checkUser } = await supabase
      .from('employees')
      .select('id')
      .eq('id', id)
      .single();

    if (checkUser) {
      throw new Error('Falha na exclusão: usuário ainda existe no banco de dados');
    }

    // 7. Excluir do sistema de autenticação (opcional)
    if (isAdminConfigured() && supabaseAdmin) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(id);
      } catch (authError) {
        console.warn('Usuário removido da aplicação, mas permanece no sistema de autenticação:', authError);
      }
    }

    // 8. Atualizar estado local e forçar refetch
    setEmployees(prev => {
      const newList = prev.filter(e => e.id !== id);
      console.log(`🗑️ Removendo usuário ${id} da lista local. Antes: ${prev.length}, Depois: ${newList.length}`);
      return newList;
    });
    
    // Forçar múltiplos refetch para garantir sincronização
    setTimeout(() => {
      console.log('🔄 Fazendo refetch após exclusão (1/3)...');
      fetchEmployees();
    }, 100);
    
    setTimeout(() => {
      console.log('🔄 Fazendo refetch após exclusão (2/3)...');
      fetchEmployees();
    }, 500);
    
    setTimeout(() => {
      console.log('🔄 Fazendo refetch após exclusão (3/3)...');
      fetchEmployees();
    }, 1000);
    
    toast.success('Usuário excluído com sucesso!');
  };

  const getEmployeesByRole = (role: string) => {
    return employees.filter(emp => emp.role === role && emp.active);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const forceRefresh = async () => {
    console.log('🔄 FORÇANDO ATUALIZAÇÃO COMPLETA...');
    setEmployees([]); // Limpar lista local
    setLoading(true);
    await fetchEmployees();
    console.log('✅ Atualização forçada concluída!');
  };

  return {
    employees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeesByRole,
    refetch: fetchEmployees,
    forceRefresh
  };
};