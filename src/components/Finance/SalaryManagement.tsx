import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { Search, Filter, UserCheck, DollarSign, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { Salary } from '../../hooks/useFinance';

interface SalaryManagementProps {
  salaries: Salary[];
  onMarkAsPaid: (id: string) => Promise<void>;
  onGenerateSalaries: (month: Date) => Promise<void>;
  loading: boolean;
}

export const SalaryManagement: React.FC<SalaryManagementProps> = ({
  salaries,
  onMarkAsPaid,
  onGenerateSalaries,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter salaries
  const filteredSalaries = salaries.filter(salary => {
    const matchesSearch = 
      salary.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salary.reference_month_formatted.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || salary.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    if (status === 'Pago') {
      return <Badge variant="success">Pago</Badge>;
    } else if (status === 'Autorizado') {
      return <Badge variant="info">Autorizado</Badge>;
    } else {
      return <Badge variant="warning">Pendente</Badge>;
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Handle generate salaries for current month
  const handleGenerateSalaries = async () => {
    setIsGenerating(true);
    try {
      await onGenerateSalaries(new Date());
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-semibold text-secondary-900">Folha de Pagamento</h3>
          <Button 
            onClick={handleGenerateSalaries}
            disabled={isGenerating}
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <DollarSign className="h-4 w-4 mr-2" />
            )}
            Gerar Folha do Mês
          </Button>
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
                placeholder="Buscar por funcionário ou mês..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos os Status</option>
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago</option>
              <option value="Autorizado">Autorizado</option>
            </select>
            <Button variant="secondary" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Salaries List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Funcionário
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Mês de Referência
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Data de Pagamento
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
              {filteredSalaries.map((salary) => (
                <tr key={salary.id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <UserCheck className="h-4 w-4 text-primary-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-secondary-900">{salary.employee_name}</div>
                        <div className="text-xs text-secondary-500">{salary.employee_role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                    {salary.reference_month_formatted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-secondary-400" />
                      {new Date(salary.payment_date).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                    {formatCurrency(salary.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(salary.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {salary.status === 'Pendente' && (
                      <Button 
                        onClick={() => onMarkAsPaid(salary.id)}
                        disabled={loading}
                        size="sm"
                        variant="success"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Pagar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSalaries.length === 0 && (
          <div className="text-center py-12">
            <UserCheck className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
            <p className="text-secondary-600 text-lg">Nenhum salário encontrado</p>
            <p className="text-secondary-500 text-sm mt-2">Tente ajustar os filtros ou gerar a folha de pagamento</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalaryManagement;