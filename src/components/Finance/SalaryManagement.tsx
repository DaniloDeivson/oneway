import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { Search, Filter, UserCheck, DollarSign, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { Salary } from '../../hooks/useFinance';
import { useEmployees } from '../../hooks/useEmployees';

interface SalaryManagementProps {
  salaries: Salary[];
  onMarkAsPaid: (id: string) => Promise<void>;
  onGenerateSalaries: (month: Date) => Promise<void>;
  loading: boolean;
}

interface EditSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  salary: Salary | null;
  onSave: (id: string, updates: Partial<Salary>) => Promise<void>;
  loading: boolean;
}

interface NewSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { employee_id: string; amount: number; payment_date: string; status: string; reference_month: string }) => Promise<void>;
  loading: boolean;
}

const EditSalaryModal: React.FC<EditSalaryModalProps> = ({ isOpen, onClose, salary, onSave, loading }) => {
  const [amount, setAmount] = useState(salary?.amount || 0);

  React.useEffect(() => {
    setAmount(salary?.amount || 0);
  }, [salary]);

  if (!isOpen || !salary) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(salary.id, { amount });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Editar Salário</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Valor do Salário (R$)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2"
              min={0}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={loading}>Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const NewSalaryModal: React.FC<NewSalaryModalProps> = ({ isOpen, onClose, onSave, loading }) => {
  const [employee_id, setEmployeeId] = useState('');
  const [amount, setAmount] = useState(0);
  const [payment_date, setPaymentDate] = useState('');
  const [status, setStatus] = useState('Pendente');
  const [reference_month, setReferenceMonth] = useState('');
  const { employees, loading: loadingEmployees } = useEmployees();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee_id || !amount || !payment_date || !reference_month) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }
    // Converte YYYY-MM para YYYY-MM-01 (date)
    const refMonthDate = reference_month.length === 7 ? `${reference_month}-01` : reference_month;
    await onSave({ employee_id, amount, payment_date, status, reference_month: refMonthDate });
    onClose();
    setEmployeeId(''); setAmount(0); setPaymentDate(''); setStatus('Pendente'); setReferenceMonth('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Adicionar Salário</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Funcionário</label>
            <select
              value={employee_id}
              onChange={e => setEmployeeId(e.target.value)}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2"
              required
              disabled={loadingEmployees}
            >
              <option value="">Selecione o funcionário</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor do Salário (R$)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2"
              min={0}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data de Pagamento</label>
            <input
              type="date"
              value={payment_date}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2"
              required
            >
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago</option>
              <option value="Autorizado">Autorizado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mês de Referência (MM-YYYY)</label>
            <input
              type="month"
              value={reference_month}
              onChange={e => setReferenceMonth(e.target.value)}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={loading}>Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SalaryManagement: React.FC<SalaryManagementProps & {
  onEditSalary: (id: string, updates: Partial<Salary>) => Promise<void>;
  onDeleteSalary: (id: string) => Promise<void>;
  onCreateSalary: (data: { employee_id: string; amount: number; payment_date: string; status: string; reference_month: string }) => Promise<void>;
}> = ({
  salaries,
  onMarkAsPaid,
  onGenerateSalaries,
  loading,
  onEditSalary,
  onDeleteSalary,
  onCreateSalary
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [salaryToEdit, setSalaryToEdit] = useState<Salary | null>(null);
  const [newModalOpen, setNewModalOpen] = useState(false);

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
          <div className="flex gap-2">
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
            <Button
              onClick={() => setNewModalOpen(true)}
              size="sm"
              variant="primary"
            >
              + Adicionar Salário
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
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
                    <Button
                      onClick={() => { setSalaryToEdit(salary); setEditModalOpen(true); }}
                      size="sm"
                      variant="secondary"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => onDeleteSalary(salary.id)}
                      size="sm"
                      variant="error"
                    >
                      Remover
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <EditSalaryModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          salary={salaryToEdit}
          onSave={onEditSalary}
          loading={loading}
        />

        <NewSalaryModal
          isOpen={newModalOpen}
          onClose={() => setNewModalOpen(false)}
          onSave={onCreateSalary}
          loading={loading}
        />

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