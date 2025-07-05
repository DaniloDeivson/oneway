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
  AlertTriangle,
  Info
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

interface ChargeableCost {
  cost_id: string;
  category: string;
  description: string;
  amount: number;
  status: string;
  customer_name: string;
  vehicle_plate: string;
  contract_id: string;
  charge_type: string;
  charge_date: string;
  selected_customer_id?: string;
  selected_contract_id?: string;
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
  const { charges, loading, error, refetch, createCharge, getChargeStatistics, getChargeableCosts, markAsPaid, deleteCharge } = useCustomerCharges();
  const { customers, loading: customersLoading } = useCustomers();
  const { contracts, loading: contractsLoading } = useContracts();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { employees, loading: employeesLoading } = useEmployees();

  const [showNewChargeModal, setShowNewChargeModal] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<CustomerCharge | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showChargeableCosts, setShowChargeableCosts] = useState(false);
  const [chargeableCosts, setChargeableCosts] = useState<ChargeableCost[]>([]);
  const [loadingChargeableCosts, setLoadingChargeableCosts] = useState(false);
  const [stats, setStats] = useState({
    total_charges: 0,
    pending_charges: 0,
    paid_charges: 0,
    total_amount: 0,
    pending_amount: 0,
    paid_amount: 0
  });

  // Filtro de busca para custos disponíveis
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleViewChargeableCosts = async () => {
    setLoadingChargeableCosts(true);
    try {
      const costs = await getChargeableCosts();
      setChargeableCosts(costs);
      setShowChargeableCosts(true);
    } catch (error) {
      toast.error('Erro ao carregar custos: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoadingChargeableCosts(false);
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

  const handleDeleteCharge = async (charge: CustomerCharge) => {
    if (confirm('Tem certeza que deseja excluir esta cobrança?')) {
      try {
        await deleteCharge(charge.id);
        toast.success('Cobrança excluída com sucesso!');
        await refetch();
        const statistics = await getChargeStatistics();
        setStats(statistics);
      } catch (error) {
        toast.error('Erro ao excluir cobrança: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      }
    }
  };

  // Função para filtrar custos disponíveis
  const filteredChargeableCosts = chargeableCosts.filter((cost) => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase().trim();
    return (
      (cost.contract_id && cost.contract_id.toLowerCase().includes(term)) ||
      (cost.vehicle_plate && cost.vehicle_plate.toLowerCase().includes(term)) ||
      (cost.customer_name && cost.customer_name.toLowerCase().includes(term)) ||
      (cost.category && cost.category.toLowerCase().includes(term)) ||
      (cost.description && cost.description.toLowerCase().includes(term)) ||
      (cost.charge_type && cost.charge_type.toLowerCase().includes(term)) ||
      (cost.status && cost.status.toLowerCase().includes(term)) ||
      (cost.amount && cost.amount.toString().includes(term)) ||
      (cost.charge_date && cost.charge_date.toLowerCase().includes(term))
    );
  });

  const handleAssignCustomer = (costId: string, customerId: string) => {
    setChargeableCosts(prev => prev.map(cost =>
      cost.cost_id === costId ? { ...cost, selected_customer_id: customerId } : cost
    ));
  };

  const handleAssignContract = (costId: string, contractId: string) => {
    setChargeableCosts(prev => prev.map(cost =>
      cost.cost_id === costId ? { ...cost, selected_contract_id: contractId } : cost
    ));
  };

  const handleGenerateCharges = async () => {
    // Permitir gerar cobrança mesmo sem contrato
    const completeCosts = chargeableCosts.filter(cost => 
      (cost.customer_name || cost.selected_customer_id)
    );

    if (completeCosts.length === 0) {
      alert('Nenhum custo selecionado para gerar cobrança.');
      return;
    }

    try {
      for (const cost of completeCosts) {
        const customerId = cost.customer_name ? 
          customers.find(c => c.name === cost.customer_name)?.id : 
          cost.selected_customer_id;
        const contractId = cost.contract_id || cost.selected_contract_id || null;
        await createCharge({
          customer_id: customerId || '',
          contract_id: contractId || '',
          vehicle_id: contracts.find(c => c.id === contractId)?.vehicle_id || '',
          charge_type: String(cost.charge_type || ''),
          amount: cost.amount,
          description: cost.description,
          charge_date: cost.charge_date || new Date().toISOString(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Pendente'
        });
      }
      alert(`✅ ${completeCosts.length} cobranças geradas com sucesso!`);
      setShowChargeableCosts(false);
      refetch();
    } catch (error) {
      console.error('Erro ao gerar cobranças:', error);
      alert('❌ Erro ao gerar cobranças. Tente novamente.');
    }
  };

  const canEdit = user?.role === 'Admin';
  const canMarkAsPaid = user?.role === 'Admin';
  const canDelete = user?.role === 'Admin';

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
            onClick={handleViewChargeableCosts}
            variant="secondary"
            className="flex items-center"
            disabled={loadingChargeableCosts}
          >
            {loadingChargeableCosts ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Ver Custos Disponíveis
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
              onDelete={handleDeleteCharge}
              canEdit={canEdit}
              canMarkAsPaid={canMarkAsPaid}
              canDelete={canDelete}
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

      {/* Modal para mostrar custos disponíveis */}
      {showChargeableCosts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-secondary-900">
                Custos Disponíveis para Cobrança ({chargeableCosts.length})
              </h2>
              <button 
                onClick={() => setShowChargeableCosts(false)}
                className="text-secondary-400 hover:text-secondary-600 p-2"
              >
                ×
              </button>
            </div>

            {/* Filtro de busca */}
            <div className="mb-4 flex items-center gap-2">
              <input
                type="text"
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Buscar por contrato, veículo, cliente, categoria, descrição, valor..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-3 py-2 text-sm text-secondary-500 hover:text-secondary-700"
                >
                  Limpar
                </button>
              )}
              {searchTerm && (
                <span className="text-sm text-secondary-500 whitespace-nowrap">
                  {filteredChargeableCosts.length} de {chargeableCosts.length} resultados
                </span>
              )}
            </div>

            <div className="mb-4 p-4 bg-info-50 border border-info-200 rounded-lg">
              <div className="flex items-center">
                <Info className="h-5 w-5 text-info-600 mr-2" />
                <div>
                  <p className="text-info-800 font-medium text-sm">
                    Custos que podem ser convertidos em cobranças
                  </p>
                  <p className="text-info-700 text-xs mt-1">
                    Estes custos serão incluídos quando você clicar em "Gerar Cobranças". 
                    Custos sem cliente/contrato atribuído precisarão ser associados manualmente.
                  </p>
                </div>
              </div>
            </div>

            {filteredChargeableCosts.length === 0 ? (
              <div className="text-center py-8">
                {loadingChargeableCosts ? (
                  <>
                    <Loader2 className="h-12 w-12 text-secondary-300 mx-auto mb-4 animate-spin" />
                    <p className="text-secondary-600">Carregando custos disponíveis...</p>
                  </>
                ) : (
                  <>
                    <FileText className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
                    <p className="text-secondary-600">
                      {searchTerm ? 'Nenhum custo encontrado com os filtros aplicados' : 'Nenhum custo disponível para cobrança'}
                    </p>
                    <p className="text-sm text-secondary-500 mt-2">
                      Verifique se existem custos com as categorias: Multa, Funilaria, Combustível, etc.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Categoria</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Descrição</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Cliente</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Veículo</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Contrato</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Valor</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Status</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Tipo de Cobrança</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-200">
                    {filteredChargeableCosts.map((cost) => (
                      <tr key={cost.cost_id} className="hover:bg-secondary-50">
                        <td className="py-4 px-6">
                          <Badge variant={
                            cost.category === 'Multa' ? 'error' :
                            cost.category === 'Funilaria' ? 'warning' :
                            cost.category === 'Combustível' ? 'success' : 'secondary'
                          }>
                            {cost.category}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-sm text-secondary-600 max-w-xs">
                          <div className="truncate" title={cost.description}>
                            {cost.description}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-secondary-600">
                          {cost.customer_name ? (
                            cost.customer_name
                          ) : (
                            <select
                              className="border border-warning-300 rounded px-2 py-1 text-warning-700"
                              value={cost.selected_customer_id || ''}
                              onChange={e => handleAssignCustomer(cost.cost_id, e.target.value)}
                            >
                              <option value="">Selecione o cliente</option>
                              {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm text-secondary-600">
                          {cost.vehicle_plate || (
                            <span className="text-warning-600 italic">Não atribuído</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm text-secondary-600">
                          {cost.contract_id ? (
                            <span className="text-secondary-900">#{cost.contract_id.substring(0, 8)}</span>
                          ) : (
                            <select
                              className="border border-warning-300 rounded px-2 py-1 text-warning-700"
                              value={cost.selected_contract_id || ''}
                              onChange={e => handleAssignContract(cost.cost_id, e.target.value)}
                            >
                              <option value="">Selecione o contrato</option>
                              {contracts.map(c => (
                                <option key={c.id} value={c.id}>#{c.id.substring(0, 8)}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-secondary-900">
                          R$ {cost.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant={
                            cost.status === 'Pendente' ? 'warning' :
                            cost.status === 'Autorizado' ? 'info' :
                            cost.status === 'Pago' ? 'success' : 'secondary'
                          }>
                            {cost.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant={
                            cost.charge_type === 'Dano' ? 'error' :
                            cost.charge_type === 'Excesso KM' ? 'warning' :
                            cost.charge_type === 'Combustível' ? 'success' : 'secondary'
                          }>
                            {cost.charge_type}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-sm text-secondary-600">
                          {cost.charge_date ? new Date(cost.charge_date).toLocaleDateString('pt-BR') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end mt-6 gap-2">
              <Button 
                variant="primary" 
                onClick={handleGenerateCharges}
                disabled={filteredChargeableCosts.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                Gerar Cobranças ({filteredChargeableCosts.length})
              </Button>
              <Button variant="secondary" onClick={() => setShowChargeableCosts(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cobranca; 