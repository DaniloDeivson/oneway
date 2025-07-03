import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { useContracts } from '../hooks/useContracts';
import { useCustomers } from '../hooks/useCustomers';
import { useCustomerCharges } from '../hooks/useCustomerCharges';
import { useAuth } from '../hooks/useAuth';
import { 
  Plus, 
  Search, 
  Car, 
  User, 
  Loader2, 
  CheckCircle, 
  Clock, 
  Receipt,
  Eye,
  RefreshCw,
  Zap,
  DollarSign,
  X,
  Calendar,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

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
  charge: any | null;
}> = ({ isOpen, onClose, charge }) => {
  if (!isOpen || !charge) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-secondary-900">Detalhes da Cobrança</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-600 mb-1">Cliente</label>
              <p className="text-lg font-semibold text-secondary-900">{charge.customers?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-600 mb-1">Veículo</label>
              <p className="text-lg font-semibold text-secondary-900">
                {charge.vehicles?.plate || charge.contracts?.vehicles?.plate} - {charge.vehicles?.model || charge.contracts?.vehicles?.model}
              </p>
            </div>
          </div>

          {/* Tipo e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-600 mb-1">Tipo de Cobrança</label>
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
              <label className="block text-sm font-medium text-secondary-600 mb-1">Status</label>
              <Badge variant={
                charge.status === 'Pendente' ? 'warning' :
                charge.status === 'Pago' ? 'success' :
                charge.status === 'Autorizado' ? 'info' : 'error'
              }>
                {charge.status}
              </Badge>
            </div>
          </div>

          {/* Valores e Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-600 mb-1">Valor</label>
              <p className="text-2xl font-bold text-secondary-900">
                R$ {charge.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-600 mb-1">Vencimento</label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-secondary-400" />
                <p className="text-lg text-secondary-900">
                  {new Date(charge.due_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Descrição */}
          {charge.description && (
            <div>
              <label className="block text-sm font-medium text-secondary-600 mb-1">Descrição</label>
              <div className="flex items-start space-x-2">
                <FileText className="h-4 w-4 text-secondary-400 mt-1 flex-shrink-0" />
                <p className="text-secondary-900">{charge.description}</p>
              </div>
            </div>
          )}

          {/* Informações Adicionais */}
          <div className="bg-secondary-50 rounded-lg p-4">
            <h3 className="font-medium text-secondary-900 mb-2">Informações Adicionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-secondary-600">Data de Criação:</span>
                <span className="ml-2 text-secondary-900">
                  {new Date(charge.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div>
                <span className="text-secondary-600">Origem:</span>
                <span className="ml-2 text-secondary-900">
                  {charge.generated_from === 'Automatic' ? 'Gerada Automaticamente' : 'Criada Manualmente'}
                </span>
              </div>
              {charge.source_cost_ids && charge.source_cost_ids.length > 0 && (
                <div className="md:col-span-2">
                  <span className="text-secondary-600">Custos Relacionados:</span>
                  <span className="ml-2 text-secondary-900">
                    {charge.source_cost_ids.length} custo(s) associado(s)
                  </span>
                </div>
              )}
            </div>
          </div>
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

// Adicionar componente de modal para nova cobrança
const NewChargeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  contracts: Contract[];
  onChargeCreated: () => void;
}> = ({ isOpen, onClose, customers, contracts, onChargeCreated }) => {
  const { createCharge } = useCustomerCharges();
  const [formData, setFormData] = useState({
    customer_id: '',
    contract_id: '',
    vehicle_id: '',
    charge_type: '',
    description: '',
    amount: '',
    due_date: '',
    status: 'Pendente',
  });
  const [loading, setLoading] = useState(false);

  // Buscar contratos do cliente selecionado
  const filteredContracts = contracts.filter(c => c.customer_id === formData.customer_id);
  // Buscar veículos do contrato selecionado
  const selectedContract = contracts.find(c => c.id === formData.contract_id);
  const vehicleOptions = selectedContract ? [{ id: selectedContract.vehicle_id, plate: selectedContract.vehicles?.plate, model: selectedContract.vehicles?.model }] : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validação básica
      if (!formData.customer_id || !formData.contract_id || !formData.vehicle_id || !formData.charge_type || !formData.amount || !formData.due_date) {
        toast.error('Preencha todos os campos obrigatórios.');
        setLoading(false);
        return;
      }
      
      // Criar cobrança usando o hook
      await createCharge({
        customer_id: formData.customer_id,
        contract_id: formData.contract_id,
        vehicle_id: formData.vehicle_id,
        charge_type: formData.charge_type as 'Dano' | 'Excesso KM' | 'Combustível' | 'Diária Extra',
        description: formData.description,
        amount: Number(formData.amount),
        due_date: formData.due_date,
        status: formData.status as 'Pendente' | 'Pago' | 'Autorizado' | 'Contestado',
        generated_from: 'Manual'
      });
      
      toast.success('Cobrança criada com sucesso!');
      setFormData({
        customer_id: '',
        contract_id: '',
        vehicle_id: '',
        charge_type: '',
        description: '',
        amount: '',
        due_date: '',
        status: 'Pendente',
      });
      onChargeCreated();
      onClose();
    } catch (err) {
      toast.error('Erro ao criar cobrança: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Nova Cobrança</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cliente *</label>
            <select name="customer_id" value={formData.customer_id} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
              <option value="">Selecione o cliente</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contrato *</label>
            <select name="contract_id" value={formData.contract_id} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
              <option value="">Selecione o contrato</option>
              {filteredContracts.map(c => (
                <option key={c.id} value={c.id}>{c.vehicles?.plate} - {c.vehicles?.model}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Veículo *</label>
            <select name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
              <option value="">Selecione o veículo</option>
              {vehicleOptions.map(v => (
                <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Cobrança *</label>
            <select name="charge_type" value={formData.charge_type} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
              <option value="">Selecione o tipo</option>
              <option value="Dano">Dano</option>
              <option value="Excesso KM">Excesso KM</option>
              <option value="Combustível">Combustível</option>
              <option value="Diária Extra">Diária Extra</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor (R$) *</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full border rounded px-3 py-2" min="0" step="0.01" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Vencimento *</label>
            <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div className="flex justify-end mt-6">
            <Button variant="secondary" onClick={onClose} type="button" disabled={loading}>Cancelar</Button>
            <Button type="submit" className="ml-2" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente principal
export const Cobranca = () => {
  const { contracts, loading: contractsLoading } = useContracts();
  const { customers } = useCustomers();
  const { charges, loading, generateChargesFromCosts, getChargeStatistics, markAsPaid, refetch } = useCustomerCharges();
  const { isAdmin, isManager } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [chargeTypeFilter, setChargeTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [isNewChargeModalOpen, setIsNewChargeModalOpen] = useState(false);
  const [isViewChargeModalOpen, setIsViewChargeModalOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<any | null>(null);
  const [statistics, setStatistics] = useState({
    total_charges: 0,
    pending_charges: 0,
    paid_charges: 0,
    total_amount: 0,
    pending_amount: 0,
    paid_amount: 0
  });
  const [generatingCharges, setGeneratingCharges] = useState(false);

  // Buscar estatísticas
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getChargeStatistics();
        setStatistics(stats);
      } catch {
        // Silently fail if the function doesn't exist yet
        console.log('Statistics function not available yet');
      }
    };
    fetchStats();
  }, [charges]);

  // Função para abrir modal de nova cobrança
  const handleNewCharge = () => {
    setIsNewChargeModalOpen(true);
  };

  // Função para gerar cobranças automaticamente
  const handleGenerateCharges = async () => {
    if (!isAdmin && !isManager) {
      toast.error('Apenas administradores e gerentes podem gerar cobranças automaticamente.');
      return;
    }

    setGeneratingCharges(true);
    try {
      const result = await generateChargesFromCosts();
      if (result.charges_generated > 0) {
        toast.success(`${result.charges_generated} cobrança(s) gerada(s) totalizando R$ ${result.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      } else {
        toast.success('Nenhuma nova cobrança foi gerada. Todos os custos já possuem cobranças correspondentes.');
      }
    } catch (error) {
      toast.error('Erro ao gerar cobranças: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setGeneratingCharges(false);
    }
  };

  // Aplicar filtros
  const filteredCharges = charges.filter(charge => {
    const matchesSearch = 
      charge.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      charge.vehicles?.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      charge.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesChargeType = chargeTypeFilter === '' || charge.charge_type === chargeTypeFilter;
    const matchesStatus = statusFilter === '' || charge.status === statusFilter;
    const matchesCustomer = customerFilter === '' || charge.customer_id === customerFilter;
    
    return matchesSearch && matchesChargeType && matchesStatus && matchesCustomer;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'Pendente': 'warning',
      'Pago': 'success',
      'Autorizado': 'info',
      'Contestado': 'error'
    } as const;

    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const getChargeTypeBadge = (chargeType: string) => {
    const variants = {
      'Dano': 'error',
      'Excesso KM': 'warning',
      'Combustível': 'info',
      'Diária Extra': 'secondary'
    } as const;

    return <Badge variant={variants[chargeType as keyof typeof variants] || 'secondary'}>{chargeType}</Badge>;
  };

  // Atualizar lista após criar cobrança
  const handleChargeCreated = async () => {
    await refetch();
  };

  // Função para visualizar cobrança
  const handleViewCharge = (charge: any) => {
    setSelectedCharge(charge);
    setIsViewChargeModalOpen(true);
  };

  // Função melhorada para marcar como pago
  const handleMarkAsPaid = async (chargeId: string) => {
    try {
      await markAsPaid(chargeId);
      toast.success('Cobrança marcada como paga com sucesso!');
      // Atualizar estatísticas após marcar como pago
      const fetchStats = async () => {
        try {
          const stats = await getChargeStatistics();
          setStatistics(stats);
        } catch {
          console.log('Erro ao atualizar estatísticas');
        }
      };
      fetchStats();
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
      toast.error('Erro ao marcar como paga: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  if (loading || contractsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Modal de Nova Cobrança */}
      <NewChargeModal 
        isOpen={isNewChargeModalOpen} 
        onClose={() => setIsNewChargeModalOpen(false)} 
        customers={customers} 
        contracts={contracts} 
        onChargeCreated={handleChargeCreated}
      />
      
      {/* Modal de Visualização de Cobrança */}
      <ViewChargeModal 
        isOpen={isViewChargeModalOpen} 
        onClose={() => setIsViewChargeModalOpen(false)} 
        charge={selectedCharge}
      />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900">Cobrança de Clientes</h1>
          <p className="text-secondary-600 mt-1 lg:mt-2">Gerencie cobranças automáticas baseadas nos custos: danos, excesso de KM, combustível e diárias extras</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          {(isAdmin || isManager) && (
            <Button 
              variant="success" 
              size="sm" 
              className="w-full sm:w-auto"
              onClick={handleGenerateCharges}
              disabled={generatingCharges}
            >
              {generatingCharges ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Gerar Cobranças
            </Button>
          )}
          <Button 
            variant="primary" 
            size="sm" 
            className="w-full sm:w-auto"
            onClick={handleNewCharge}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Cobrança
          </Button>
          <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Total de Cobranças</p>
                <p className="text-xl lg:text-2xl font-bold text-secondary-900">{statistics.total_charges}</p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Receipt className="h-4 w-4 lg:h-6 lg:w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Pendentes</p>
                <p className="text-xl lg:text-2xl font-bold text-secondary-900">{statistics.pending_charges}</p>
                <p className="text-xs text-warning-600 mt-1">Aguardando</p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 lg:h-6 lg:w-6 text-warning-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Pagas</p>
                <p className="text-xl lg:text-2xl font-bold text-secondary-900">{statistics.paid_charges}</p>
                <p className="text-xs text-success-600 mt-1">Quitadas</p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-success-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 lg:h-6 lg:w-6 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Total a Cobrar</p>
                <p className="text-lg lg:text-xl font-bold text-secondary-900">
                  R$ {statistics.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-error-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 lg:h-6 lg:w-6 text-error-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Pendente</p>
                <p className="text-lg lg:text-xl font-bold text-warning-600">
                  R$ {statistics.pending_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 lg:h-6 lg:w-6 text-warning-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Recebido</p>
                <p className="text-lg lg:text-xl font-bold text-success-600">
                  R$ {statistics.paid_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-success-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 lg:h-6 lg:w-6 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert de instrução para gerar cobranças */}
      {charges.length === 0 && (
        <Card className="border-info-200 bg-info-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-info-600 flex-shrink-0" />
              <div>
                <p className="text-info-800 font-medium">
                  Nenhuma cobrança encontrada
                </p>
                <p className="text-info-700 text-sm mt-1">
                  Clique em "Gerar Cobranças" para criar cobranças automaticamente baseadas nos custos autorizados dos contratos (danos, excesso de KM, combustível e diárias extras).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, veículo ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={chargeTypeFilter}
                onChange={(e) => setChargeTypeFilter(e.target.value)}
                className="border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os Tipos</option>
                <option value="Dano">Dano</option>
                <option value="Excesso KM">Excesso KM</option>
                <option value="Combustível">Combustível</option>
                <option value="Diária Extra">Diária Extra</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os Status</option>
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
                <option value="Autorizado">Autorizado</option>
                <option value="Contestado">Contestado</option>
              </select>
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os Clientes</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charges List */}
      <Card>
        <CardHeader className="p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-secondary-900">
            Cobranças de Clientes ({filteredCharges.length})
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3 p-4">
            {filteredCharges.map((charge) => (
              <div key={charge.id} className="border border-secondary-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-secondary-900">{charge.customers?.name}</p>
                    <p className="text-sm text-secondary-600">{charge.vehicles?.plate || charge.contracts?.vehicles?.plate} - {charge.vehicles?.model || charge.contracts?.vehicles?.model}</p>
                  </div>
                  <div className="flex flex-col space-y-1">
                    {getChargeTypeBadge(charge.charge_type)}
                    {getStatusBadge(charge.status)}
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-secondary-700">{charge.description}</p>
                  {charge.generated_from === 'Automatic' && (
                    <Badge variant="info" className="text-xs mt-1">Automática</Badge>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-secondary-900">
                      R$ {charge.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-secondary-500">
                      Vencimento: {new Date(charge.due_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {charge.status === 'Pendente' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleMarkAsPaid(charge.id)}
                        className="text-xs"
                      >
                        Marcar Pago
                      </Button>
                    )}
                    <button 
                      className="p-2 text-secondary-400 hover:text-secondary-600"
                      onClick={() => handleViewCharge(charge)}
                      title="Ver detalhes da cobrança"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Cliente</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Veículo</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Tipo</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Descrição</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Valor</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Vencimento</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Status</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {filteredCharges.map((charge) => (
                  <tr key={charge.id} className="hover:bg-secondary-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-secondary-900">{charge.customers?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Car className="h-4 w-4 text-secondary-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-secondary-900">{charge.vehicles?.plate || charge.contracts?.vehicles?.plate}</p>
                          <p className="text-xs text-secondary-500">{charge.vehicles?.model || charge.contracts?.vehicles?.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col space-y-1">
                        {getChargeTypeBadge(charge.charge_type)}
                        {charge.generated_from === 'Automatic' && (
                          <Badge variant="info" className="text-xs">Automática</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-secondary-700 max-w-xs truncate" title={charge.description || ''}>
                        {charge.description}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-medium text-secondary-900">
                        R$ {charge.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-secondary-700">
                        {new Date(charge.due_date).toLocaleDateString('pt-BR')}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(charge.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {charge.status === 'Pendente' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleMarkAsPaid(charge.id)}
                            className="text-xs"
                          >
                            Marcar Pago
                          </Button>
                        )}
                        <button 
                          className="p-2 text-secondary-400 hover:text-secondary-600"
                          onClick={() => handleViewCharge(charge)}
                          title="Ver detalhes da cobrança"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCharges.length === 0 && charges.length > 0 && (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">Nenhuma cobrança encontrada com os filtros aplicados</p>
            </div>
          )}
        </CardContent>
      </Card>

      
    </div>
  );
};

export default Cobranca; 