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
      console.log('deleteEmployee called with id:', id);
      
      // Validate that we have an ID
      if (!id || id === '') {
        throw new Error('ID do funcionário é obrigatório para exclusão');
      }
      
      // First, check if this is a critical admin user
      console.log('Checking employee data...');
      const { data: employeeData, error: fetchError } = await supabase
        .from('employees')
        .select('role, contact_info, name')
        .eq('id', id)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .single();
      
      if (fetchError) {
        console.error('Error fetching employee data:', fetchError);
        throw new Error('Funcionário não encontrado');
      }
      
      console.log('Employee data:', employeeData);
      
      // Prevent deletion of the last admin user
      if (employeeData?.role === 'Admin') {
        console.log('Employee is admin, checking admin count...');
        const { data: adminCount, error: countError } = await supabase
          .from('employees')
          .select('id', { count: 'exact' })
          .eq('role', 'Admin')
          .eq('active', true)
          .eq('tenant_id', DEFAULT_TENANT_ID);
        
        if (countError) {
          console.error('Error counting admins:', countError);
        }
        
        console.log('Active admin count:', adminCount?.length || 0);
        if ((adminCount?.length || 0) <= 1) {
          throw new Error('Não é possível excluir o último administrador do sistema');
        }
      }
      
      // Check if this is the profitestrategista@gmail.com user
      if (employeeData?.contact_info?.email === 'profitestrategista@gmail.com') {
        throw new Error('Este usuário não pode ser excluído');
      }
      
      // Try to delete the employee
      console.log('Attempting to delete employee...');
      const { error: deleteError } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)
        .eq('tenant_id', DEFAULT_TENANT_ID);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        console.error('Delete error details:', {
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint,
          code: deleteError.code
        });
        
        // If deletion fails due to foreign key constraints, deactivate instead
        if (deleteError.code === '23503') { // Foreign key violation
          console.log('Foreign key violation, deactivating instead...');
          await updateEmployee(id, { active: false });
          toast.success('Funcionário desativado com sucesso (não foi possível excluir devido a referências no sistema)');
          return;
        }
        throw deleteError;
      }
      
      console.log('Employee deleted successfully');
      setEmployees(prev => prev.filter(e => e.id !== id));
      toast.success('Funcionário excluído com sucesso!');
    } catch (err) {
      console.error('Full delete error details:', err);
      
      // More detailed error handling
      if (err && typeof err === 'object' && 'message' in err) {
        const errorMessage = (err as any).message;
        if (errorMessage.includes('foreign key')) {
          toast.error('Erro: Não é possível excluir funcionário que possui dependências no sistema.');
        } else if (errorMessage.includes('permission')) {
          toast.error('Erro: Sem permissão para excluir este funcionário.');
        } else {
          toast.error('Erro ao excluir funcionário: ' + errorMessage);
        }
      } else {
        toast.error('Erro ao excluir funcionário: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      }
      
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