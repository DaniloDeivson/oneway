import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { Plus, Search, Filter, Calendar, DollarSign, Repeat, Edit, Trash2, Loader2 } from 'lucide-react';
import { RecurringExpense } from '../../hooks/useFinance';
import toast from 'react-hot-toast';

interface RecurringExpensesProps {
  recurringExpenses: RecurringExpense[];
  onGenerateExpenses: (month: Date) => Promise<void>;
  loading: boolean;
}

export const RecurringExpenses: React.FC<RecurringExpensesProps> = ({
  recurringExpenses,
  onGenerateExpenses,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Get unique categories for filter
  const categories = [...new Set(recurringExpenses.map(item => item.category))];

  // Filter recurring expenses
  const filteredExpenses = recurringExpenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === '' || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Handle generate expenses for current month
  const handleGenerateExpenses = async () => {
    setIsGenerating(true);
    try {
      await onGenerateExpenses(new Date());
      toast.success('Despesas recorrentes geradas com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar despesas recorrentes');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-semibold text-secondary-900">Despesas Recorrentes</h3>
          <div className="flex space-x-2">
            <Button 
              onClick={handleGenerateExpenses}
              disabled={isGenerating}
              variant="secondary"
              size="sm"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Gerar Despesas do Mês
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 lg:p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas as Categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <Button variant="secondary" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Recurring Expenses List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Dia de Vencimento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Valor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-secondary-900">{expense.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                    {expense.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-secondary-400" />
                      Dia {expense.due_day}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={expense.is_active ? "success" : "error"}>
                      {expense.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toast.success('Funcionalidade em desenvolvimento')}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toast.success('Funcionalidade em desenvolvimento')}
                      className="text-error-600 hover:text-error-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <Repeat className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
            <p className="text-secondary-600 text-lg">Nenhuma despesa recorrente encontrada</p>
            <p className="text-secondary-500 text-sm mt-2">Tente ajustar os filtros ou criar uma nova despesa</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecurringExpenses;