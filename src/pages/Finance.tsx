import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { Loader2 } from 'lucide-react';
import FinancialSummary from '../components/Finance/FinancialSummary';
import AccountsPayableList from '../components/Finance/AccountsPayableList';
import SalaryManagement from '../components/Finance/SalaryManagement';
import RecurringExpenses from '../components/Finance/RecurringExpenses';
import NewExpenseForm from '../components/Finance/NewExpenseForm';
import toast from 'react-hot-toast';

export const Finance: React.FC = () => {
  const {
    accountsPayable,
    salaries,
    recurringExpenses,
    summary,
    loading,
    markAsPaid,
    createAccountPayable,
    generateRecurringExpenses,
    generateSalaries,
    refetch
  } = useFinance();
  
  const [processingAction, setProcessingAction] = useState(false);

  // Mark account as paid
  const handleMarkAsPaid = async (id: string) => {
    setProcessingAction(true);
    try {
      await markAsPaid(id);
      await refetch();
      toast.success('Conta marcada como paga com sucesso!');
    } catch (error) {
      toast.error('Erro ao marcar conta como paga');
    } finally {
      setProcessingAction(false);
    }
  };

  // Create new expense
  const handleCreateExpense = async (data: any) => {
    setProcessingAction(true);
    try {
      await createAccountPayable(data);
      await refetch();
      return true;
    } catch (error) {
      toast.error('Erro ao criar despesa');
      return false;
    } finally {
      setProcessingAction(false);
    }
  };

  // Generate recurring expenses
  const handleGenerateRecurringExpenses = async (month: Date) => {
    setProcessingAction(true);
    try {
      const count = await generateRecurringExpenses(month);
      await refetch();
      toast.success(`${count} despesas recorrentes geradas com sucesso!`);
    } catch (error) {
      toast.error('Erro ao gerar despesas recorrentes');
    } finally {
      setProcessingAction(false);
    }
  };

  // Generate salaries
  const handleGenerateSalaries = async (month: Date) => {
    setProcessingAction(true);
    try {
      const count = await generateSalaries(month);
      await refetch();
      toast.success(`${count} salários gerados com sucesso!`);
    } catch (error) {
      toast.error('Erro ao gerar salários');
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading && !accountsPayable.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900">Financeiro</h1>
        <p className="text-secondary-600 mt-1 lg:mt-2">Gerencie contas a pagar, salários e despesas recorrentes</p>
      </div>

      {/* Financial Summary */}
      <FinancialSummary summary={summary} />

      {/* New Expense Form */}
      <NewExpenseForm 
        onCreateExpense={handleCreateExpense}
        loading={processingAction}
      />

      {/* Accounts Payable List */}
      <AccountsPayableList 
        accountsPayable={accountsPayable}
        onMarkAsPaid={handleMarkAsPaid}
        loading={processingAction}
      />

      {/* Salary Management */}
      <SalaryManagement 
        salaries={salaries}
        onMarkAsPaid={handleMarkAsPaid}
        onGenerateSalaries={handleGenerateSalaries}
        loading={processingAction}
      />

      {/* Recurring Expenses */}
      <RecurringExpenses 
        recurringExpenses={recurringExpenses}
        onGenerateExpenses={handleGenerateRecurringExpenses}
        loading={processingAction}
      />
    </div>
  );
};

export default Finance;