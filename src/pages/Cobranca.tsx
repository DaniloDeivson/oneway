import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { useContracts } from '../hooks/useContracts';
import { useCustomers } from '../hooks/useCustomers';
import { useCustomerCharges } from '../hooks/useCustomerCharges';
import { useVehicles } from '../hooks/useVehicles';
import { useEmployees } from '../hooks/useEmployees';
import { useAuth } from '../hooks/useAuth';
import { ChargesList } from '../components/Costs/ChargesList';
import { 
  Plus, 
  Car, 
  User, 
  Loader2, 
  CheckCircle, 
  Clock, 
  Receipt,
  RefreshCw,
  Zap,
  DollarSign,
  Calendar,
  FileText,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Database } from '../types/database';

type CustomerCharge = Database['public']['Tables']['customer_charges']['Row'] & {
  customers?: { name: string };
  contracts?: { 
    vehicles?: { plate: string; model: string }; 
  };
  vehicles?: { plate: string; model: string };
};

type CustomerChargeInsert = Omit<Database['public']['Tables']['customer_charges']['Insert'], 'tenant_id'>;
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Employee = Database['public']['Tables']['employees']['Row'];

interface Customer {
  id: string;
  name: string;
}

interface Contract {
  id: string;
  customer_id: string;
  vehicle_id: string;
  vehicles?: {
    plate: string;
    model: string;
  };
}

// Modal para visualizar detalhes da cobrança
const ViewChargeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  charge: CustomerCharge | null;
}> = ({ isOpen, onClose, charge }) => {
  if (!isOpen || !charge) return null;

  const isOverdue = () => {
    if (charge.status === 'Pago') return false;
    const today = new Date();
    const dueDate = new Date(charge.due_date);
    return dueDate < today;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h2 className="text-lg lg:text-xl font-semibold text-secondary-900">Detalhes da Cobrança</h2>
          <button 
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600 p-2"
          >
            ×
          </button>
        </div>

        {/* Alert for overdue charges */}
        {isOverdue() && (
          <div className="mb-4 lg:mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-error-600 mr-2" />
              <div>
                <p className="text-error-800 font-medium text-sm">
                  Cobrança Vencida
                </p>
                <p className="text-error-700 text-xs mt-1">
                  Esta cobrança está vencida desde {new Date(charge.due_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alert for automatic charges */}
        {charge.generated_from === 'Automatic' && (
          <div className="mb-4 lg:mb-6 p-4 bg-info-50 border border-info-200 rounded-lg">
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-info-600 mr-2" />
              <div>
                <p className="text-info-800 font-medium text-sm">
                  Cobrança Gerada Automaticamente
                </p>
                <p className="text-info-700 text-xs mt-1">
                  Esta cobrança foi criada automaticamente com base em custos do sistema
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Cliente</label>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-secondary-400" />
                <span className="text-lg font-semibold text-secondary-900">{charge.customers?.name}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Veículo</label>
              <div className="flex items-center space-x-2">
                <Car className="h-4 w-4 text-secondary-400" />
                <span className="text-lg font-semibold text-secondary-900">
                  {charge.vehicles?.plate || charge.contracts?.vehicles?.plate} - {charge.vehicles?.model || charge.contracts?.vehicles?.model}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Tipo de Cobrança</label>
              <div className="flex items-center space-x-2">
                <Badge variant={
                  charge.charge_type === 'Dano' ? 'error' :
                  charge.charge_type === 'Excesso KM' ? 'warning' :
                  charge.charge_type === 'Combustível' ? 'info' : 'secondary'
                }>
                  {charge.charge_type}
                </Badge>
                {charge.generated_from === 'Automatic' && (
                  <Badge variant="info" className="text-xs">Automática</Badge>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Status</label>
              <Badge variant={
                charge.status === 'Pendente' ? 'warning' :
                charge.status === 'Pago' ? 'success' :
                charge.status === 'Autorizado' ? 'info' : 'error'
              }>
                {charge.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Valor</label>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-6 w-6 text-secondary-400" />
                <span className="text-2xl font-bold text-secondary-900">
                  R$ {charge.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Vencimento</label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-secondary-400" />
                <span className={`text-lg ${isOverdue() ? 'text-error-600 font-medium' : 'text-secondary-900'}`}>
                  {new Date(charge.due_date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Data da Cobrança</label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-secondary-400" />
                <span className="text-secondary-900">
                  {new Date(charge.charge_date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Contrato</label>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-secondary-400" />
                <span className="text-secondary-900">
                  #{charge.contract_id.substring(0, 8)}
                </span>
              </div>
            </div>
          </div>

          {charge.description && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Descrição</label>
              <div className="flex items-start space-x-2">
                <FileText className="h-4 w-4 text-secondary-400 mt-1 flex-shrink-0" />
                <p className="text-secondary-900">{charge.description}</p>
              </div>
            </div>
          )}

          {charge.source_cost_ids && charge.source_cost_ids.length > 0 && (
            <div className="bg-secondary-50 rounded-lg p-4">
              <h3 className="font-medium text-secondary-900 mb-2">Informações Adicionais</h3>
              <div className="text-sm">
                <span className="text-secondary-600">Custos Relacionados:</span>
                <span className="ml-2 text-secondary-900">
                  {charge.source_cost_ids.length} custo(s) associado(s)
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};

// Modal para nova cobrança
const NewChargeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  contracts: Contract[];
  vehicles: Vehicle[];
  employees: Employee[];
  onSave: (data: CustomerChargeInsert) => Promise<void>;
}> = ({ isOpen, onClose, customers, contracts, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    contract_id: '',
    vehicle_id: '',
    charge_type: 'Dano' as const,
    description: '',
    amount: 0,
    due_date: '',
    status: 'Pendente' as const,
    generated_from: 'Manual' as const
  });

  if (!isOpen) return null;

  // Buscar contratos do cliente selecionado
  const filteredContracts = contracts.filter(c => c.customer_id === formData.customer_id);
  // Buscar veículos do contrato selecionado
  const selectedContract = contracts.find(c => c.id === formData.contract_id);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData: CustomerChargeInsert = {
        ...formData,
        charge_date: new Date().toISOString().split('T')[0],
        description: formData.description === '' ? null : formData.description,
        source_cost_ids: null
      };
      await onSave(submitData);
      onClose();
      // Reset form
      setFormData({
        customer_id: '',
        contract_id: '',
        vehicle_id: '',
        charge_type: 'Dano' as const,
        description: '',
        amount: 0,
        due_date: '',
        status: 'Pendente' as const,
        generated_from: 'Manual' as const
      });
    } catch (error) {
      console.error('Error saving charge:', error);
      toast.error('Erro ao salvar cobrança: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h2 className="text-lg lg:text-xl font-semibold text-secondary-900">Nova Cobrança</h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 p-2">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Cliente *
              </label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Selecione um cliente</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Contrato *
              </label>
              <select
                name="contract_id"
                value={formData.contract_id}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={!formData.customer_id}
              >
                <option value="">Selecione um contrato</option>
                {filteredContracts.map(contract => (
                  <option key={contract.id} value={contract.id}>
                    {contract.vehicles?.plate} - {contract.vehicles?.model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Veículo *
              </label>
              <select
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={!formData.contract_id}
              >
                <option value="">Selecione um veículo</option>
                {selectedContract && (
                  <option value={selectedContract.vehicle_id}>
                    {selectedContract.vehicles?.plate} - {selectedContract.vehicles?.model}
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Tipo de Cobrança *
              </label>
              <select
                name="charge_type"
                value={formData.charge_type}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="Dano">Dano</option>
                <option value="Excesso KM">Excesso KM</option>
                <option value="Combustível">Combustível</option>
                <option value="Diária Extra">Diária Extra</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Valor *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Data de Vencimento *
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Descrição
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Descreva os detalhes da cobrança..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Cobrança'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Cobranca = () => {
  const { user } = useAuth();
  const { charges, loading, error, refetch, createCharge, generateChargesFromCosts, getChargeStatistics, markAsPaid, markAsAuthorized } = useCustomerCharges();
  const { customers, loading: customersLoading } = useCustomers();
  const { contracts, loading: contractsLoading } = useContracts();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { employees, loading: employeesLoading } = useEmployees();

  const [showNewChargeModal, setShowNewChargeModal] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<CustomerCharge | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [stats, setStats] = useState({
    total_charges: 0,
    pending_charges: 0,
    paid_charges: 0,
    total_amount: 0,
    pending_amount: 0,
    paid_amount: 0
  });

  useEffect(() => {
    refetch();
    const fetchStats = async () => {
      const statistics = await getChargeStatistics();
      setStats(statistics);
    };
    fetchStats();
  }, []);

  const handleNewCharge = () => {
    setShowNewChargeModal(true);
  };

  const handleGenerateCharges = async () => {
    try {
      const result = await generateChargesFromCosts();
      toast.success(`${result.charges_generated} cobrança(s) gerada(s) com sucesso!`);
      await refetch();
      const statistics = await getChargeStatistics();
      setStats(statistics);
    } catch (error) {
      toast.error('Erro ao gerar cobranças: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleViewCharge = (charge: CustomerCharge) => {
    setSelectedCharge(charge);
    setShowViewModal(true);
  };

  const handleSave = async (data: CustomerChargeInsert) => {
    await createCharge(data);
    toast.success('Cobrança criada com sucesso!');
    await refetch();
    const statistics = await getChargeStatistics();
    setStats(statistics);
  };

  const handleMarkAsPaid = async (charge: CustomerCharge) => {
    try {
      await markAsPaid(charge.id);
      toast.success('Cobrança marcada como paga!');
      await refetch();
      const statistics = await getChargeStatistics();
      setStats(statistics);
    } catch (error) {
      toast.error('Erro ao marcar cobrança como paga: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleMarkAsAuthorized = async (charge: CustomerCharge) => {
    try {
      await markAsAuthorized(charge.id);
      toast.success('Cobrança autorizada!');
      await refetch();
      const statistics = await getChargeStatistics();
      setStats(statistics);
    } catch (error) {
      toast.error('Erro ao autorizar cobrança: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const canEdit = user?.role === 'Admin' || user?.role === 'Manager';
  const canMarkAsPaid = user?.role === 'Admin' || user?.role === 'Manager';
  const canMarkAsAuthorized = user?.role === 'Admin' || user?.role === 'Manager';

  if (loading || customersLoading || contractsLoading || vehiclesLoading || employeesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-secondary-600">Carregando cobranças...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-error-600 mx-auto mb-4" />
          <p className="text-error-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Cobrança de Clientes</h1>
          <p className="text-secondary-600">Gerencie as cobranças aos clientes</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleGenerateCharges}
            variant="secondary"
            className="flex items-center"
          >
            <Zap className="h-4 w-4 mr-2" />
            Gerar Cobranças
          </Button>
          <Button
            onClick={handleNewCharge}
            variant="primary"
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Cobrança
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total de Cobranças</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.total_charges}</p>
              </div>
              <Receipt className="h-8 w-8 text-secondary-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Pendentes</p>
                <p className="text-2xl font-bold text-warning-600">{stats.pending_charges}</p>
                <p className="text-sm text-secondary-500">
                  R$ {stats.pending_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Pagas</p>
                <p className="text-2xl font-bold text-success-600">{stats.paid_charges}</p>
                <p className="text-sm text-secondary-500">
                  R$ {stats.paid_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charges List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-semibold text-secondary-900">Lista de Cobranças</h2>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => refetch()}
                variant="secondary"
                size="sm"
                className="flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {charges.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-600">Nenhuma cobrança encontrada</p>
            </div>
          ) : (
            <ChargesList
              charges={charges}
              onView={handleViewCharge}
              onMarkAsPaid={handleMarkAsPaid}
              onMarkAsAuthorized={handleMarkAsAuthorized}
              canEdit={canEdit}
              canMarkAsPaid={canMarkAsPaid}
              canMarkAsAuthorized={canMarkAsAuthorized}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <NewChargeModal
        isOpen={showNewChargeModal}
        onClose={() => setShowNewChargeModal(false)}
        customers={customers}
        contracts={contracts}
        vehicles={vehicles}
        employees={employees}
        onSave={handleSave}
      />

      <ViewChargeModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        charge={selectedCharge}
      />
    </div>
  );
};

export default Cobranca; 