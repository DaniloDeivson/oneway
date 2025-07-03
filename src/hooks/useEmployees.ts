import { useState, useEffect } from 'react';
import { supabase, DEFAULT_TENANT_ID } from '../lib/supabase';
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
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('name', { ascending: true });

      if (error) throw error;
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
        .update({ ...updates, updated_at: new Date().toISOString() })
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

  const deleteEmployee = async (id: string) => {
    try {
      // First, check if this is a critical admin user
      const { data: employeeData } = await supabase
        .from('employees')
        .select('role, contact_info')
        .eq('id', id)
        .single();
      
      // Prevent deletion of the last admin user
      if (employeeData?.role === 'Admin') {
        const { data: adminCount } = await supabase
          .from('employees')
          .select('id', { count: 'exact' })
          .eq('role', 'Admin')
          .eq('active', true);
        
        if ((adminCount?.length || 0) <= 1) {
          throw new Error('Não é possível excluir o último administrador do sistema');
        }
      }
      
      // Check if this is the profitestrategista@gmail.com user
      if (employeeData?.contact_info?.email === 'profitestrategista@gmail.com') {
        throw new Error('Este usuário não pode ser excluído');
      }
      
      // Try to delete the employee
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) {
        // If deletion fails due to foreign key constraints, deactivate instead
        if (error.code === '23503') { // Foreign key violation
          await updateEmployee(id, { active: false });
          toast.success('Funcionário desativado com sucesso (não foi possível excluir devido a referências no sistema)');
          setEmployees(prev => prev.map(e => e.id === id ? { ...e, active: false } : e));
          return;
        }
        throw error;
      }
      
      setEmployees(prev => prev.filter(e => e.id !== id));
      toast.success('Funcionário excluído com sucesso!');
    } catch (err) {
      toast.error('Erro ao excluir funcionário: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      throw new Error(err instanceof Error ? err.message : 'Failed to delete employee');
    }
  };

  const getEmployeesByRole = (role: string) => {
    return employees.filter(emp => emp.role === role && emp.active);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    employees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeesByRole,
    refetch: fetchEmployees
  };
};