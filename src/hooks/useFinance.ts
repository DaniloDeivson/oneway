import { useState, useEffect } from 'react';
import { supabase, DEFAULT_TENANT_ID } from '../lib/supabase';

export interface AccountPayable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  category: string;
  status: 'Pendente' | 'Pago' | 'Autorizado';
  supplier_id?: string;
  supplier_name?: string;
  document_ref?: string;
  payment_method?: string;
  is_overdue: boolean;
  days_overdue: number;
  source_type: 'Salário' | 'Despesa Recorrente' | 'Custo' | 'Manual';
  created_at: string;
}

export interface Salary {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_role: string;
  employee_code?: string;
  amount: number;
  payment_date: string;
  status: 'Pendente' | 'Pago' | 'Autorizado';
  reference_month: string;
  reference_month_formatted: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  due_day: number;
  category: string;
  is_active: boolean;
  last_generated_date?: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  total_pending: number;
  total_paid: number;
  total_overdue: number;
  overdue_count: number;
  upcoming_payments: number;
  upcoming_count: number;
  salary_total: number;
  recurring_total: number;
}

export const useFinance = () => {
  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountsPayable = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vw_upcoming_payments')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setAccountsPayable(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaries = async () => {
    try {
      const { data, error } = await supabase
        .from('vw_employee_salaries')
        .select('*')
        .order('reference_month', { ascending: false });

      if (error) throw error;
      setSalaries(data || []);
    } catch (err) {
      console.error('Error fetching salaries:', err);
    }
  };

  const fetchRecurringExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('due_day', { ascending: true });

      if (error) throw error;
      setRecurringExpenses(data || []);
    } catch (err) {
      console.error('Error fetching recurring expenses:', err);
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      // Get accounts payable summary
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('fn_financial_summary', { p_tenant_id: DEFAULT_TENANT_ID });

      if (summaryError) throw summaryError;
      
      if (summaryData && summaryData.length > 0) {
        setSummary(summaryData[0]);
      }
    } catch (err) {
      console.error('Error fetching financial summary:', err);
    }
  };

  const markAsPaid = async (id: string) => {
    try {
      const { error } = await supabase
        .rpc('fn_mark_account_payable_paid', { p_account_id: id });

      if (error) throw error;
      
      // Refresh data
      await fetchAccountsPayable();
      await fetchSalaries();
      await fetchFinancialSummary();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to mark as paid');
    }
  };

  const createSalary = async (salaryData: Omit<Salary, 'id' | 'created_at' | 'updated_at' | 'employee_name' | 'employee_role' | 'employee_code' | 'reference_month_formatted'>) => {
    try {
      const { data, error } = await supabase
        .from('salaries')
        .insert([{ ...salaryData, tenant_id: DEFAULT_TENANT_ID }])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh data
      await fetchSalaries();
      await fetchAccountsPayable();
      await fetchFinancialSummary();
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create salary');
    }
  };

  const createRecurringExpense = async (expenseData: Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert([{ ...expenseData, tenant_id: DEFAULT_TENANT_ID }])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh data
      await fetchRecurringExpenses();
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create recurring expense');
    }
  };

  const createAccountPayable = async (accountData: Omit<AccountPayable, 'id' | 'created_at' | 'is_overdue' | 'days_overdue' | 'source_type'>) => {
    try {
      const { data, error } = await supabase
        .from('accounts_payable')
        .insert([{ ...accountData, tenant_id: DEFAULT_TENANT_ID }])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh data
      await fetchAccountsPayable();
      await fetchFinancialSummary();
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create account payable');
    }
  };

  const generateRecurringExpenses = async (month: Date) => {
    try {
      const { data, error } = await supabase
        .rpc('fn_generate_recurring_expenses', { 
          p_tenant_id: DEFAULT_TENANT_ID,
          p_month: month.toISOString()
        });

      if (error) throw error;
      
      // Refresh data
      await fetchAccountsPayable();
      await fetchRecurringExpenses();
      await fetchFinancialSummary();
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to generate recurring expenses');
    }
  };

  const generateSalaries = async (month: Date) => {
    try {
      const { data, error } = await supabase
        .rpc('fn_generate_salary_payments', { 
          p_tenant_id: DEFAULT_TENANT_ID,
          p_month: month.toISOString()
        });

      if (error) throw error;
      
      // Refresh data
      await fetchAccountsPayable();
      await fetchSalaries();
      await fetchFinancialSummary();
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to generate salaries');
    }
  };

  const syncCostsToAccountsPayable = async () => {
    try {
      const { data, error } = await supabase
        .rpc('fn_sync_costs_to_accounts_payable', { 
          p_tenant_id: DEFAULT_TENANT_ID
        });

      if (error) throw error;
      
      // Refresh data
      await fetchAccountsPayable();
      await fetchFinancialSummary();
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to sync costs');
    }
  };

  const deleteRecurringExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id)
        .eq('tenant_id', DEFAULT_TENANT_ID);
      if (error) throw error;
      await fetchRecurringExpenses();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete recurring expense');
    }
  };

  useEffect(() => {
    fetchAccountsPayable();
    fetchSalaries();
    fetchRecurringExpenses();
    fetchFinancialSummary();
  }, []);

  return {
    accountsPayable,
    salaries,
    recurringExpenses,
    summary,
    loading,
    error,
    markAsPaid,
    createSalary,
    createRecurringExpense,
    createAccountPayable,
    generateRecurringExpenses,
    generateSalaries,
    syncCostsToAccountsPayable,
    deleteRecurringExpense,
    refetch: async () => {
      await fetchAccountsPayable();
      await fetchSalaries();
      await fetchRecurringExpenses();
      await fetchFinancialSummary();
    }
  };
};