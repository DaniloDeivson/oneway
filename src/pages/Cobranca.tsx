import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { useCosts } from '../hooks/useCosts';
import { useVehicles } from '../hooks/useVehicles';
import { useCustomers } from '../hooks/useCustomers';
import { useContracts } from '../hooks/useContracts';
import { useFines } from '../hooks/useFines';
import { useAuth } from '../hooks/useAuth';
import { 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Car, 
  User, 
  FileText, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Calendar,
  Gauge,
  Fuel,
  Receipt,
  Send,
  Mail,
  Download,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';

// Componente para exibir detalhes de cobrança
const ChargeDetailModal = ({ isOpen, onClose, charge, onMarkAsPaid }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !charge) return null;

  const handleMarkAsPaid = async () => {
    setLoading(true);
    try {
      await onMarkAsPaid(charge.id);
      toast.success('Cobrança marcada como paga com sucesso!');
    } catch (error) {
      toast.error('Erro ao marcar cobrança como paga');
      console.error('Error marking charge as paid:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Pago') {
      return <Badge variant="success">{status}</Badge>;
    } else if (status === 'Autorizado') {
      return <Badge variant="info">{status}</Badge>;
    } else {
      return <Badge variant="warning">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category) => {
    const variants = {
      'Excesso Km': 'error',
      'Diária Extra': 'warning',
      'Combustível': 'info',
      'Avaria': 'error',
      'Multa': 'error'
    };

    return <Badge variant={variants[category] || 'secondary'}>{category}</Badge>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-secondary-900 flex items-center">
            <Receipt className="h-5 w-5 mr-2 text-primary-600" />
            Detalhes da Cobrança
          </h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 p-2">
            ×
          </button>
        </div>

        {/* Cabeçalho da Cobrança */}
        <div className="bg-secondary-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{charge.description}</h3>
              <p className="text-secondary-600">Data: {new Date(charge.cost_date).toLocaleDateString('pt-BR')}</p>
            </div>
            {getStatusBadge(charge.status)}
          </div>
        </div>

        {/* Informações do Cliente e Veículo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-secondary-200 rounded-lg p-4">
            <h4 className="font-medium text-secondary-900 mb-2 flex items-center">
              <User className="h-4 w-4 mr-2 text-secondary-500" />
              Cliente
            </h4>
            <p className="font-medium">{charge.customer_name || 'Não informado'}</p>
            {charge.contract_id && (
              <div className="mt-2">
                <Badge variant="primary">Contrato #{charge.contract_id.substring(0, 8)}</Badge>
              </div>
            )}
          </div>

          <div className="bg-white border border-secondary-200 rounded-lg p-4">
            <h4 className="font-medium text-secondary-900 mb-2 flex items-center">
              <Car className="h-4 w-4 mr-2 text-secondary-500" />
              Veículo
            </h4>
            <p className="font-medium">{charge.vehicle_plate} - {charge.vehicle_model}</p>
          </div>
        </div>

        {/* Detalhes da Cobrança */}
        <div className="mb-6">
          <h4 className="font-medium text-secondary-900 mb-2 flex items-center">
            <FileText className="h-4 w-4 mr-2 text-secondary-500" />
            Detalhes
          </h4>
          <div className="bg-white border border-secondary-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-600">Categoria:</p>
                <div className="mt-1">{getCategoryBadge(charge.category)}</div>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Valor:</p>
                <p className="font-medium text-lg">R$ {charge.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Origem:</p>
                <p className="font-medium">{charge.origin_description}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Departamento:</p>
                <p className="font-medium">{charge.department || 'Não especificado'}</p>
              </div>
            </div>
            {charge.observations && (
              <div className="mt-4 pt-4 border-t border-secondary-200">
                <p className="text-sm text-secondary-600">Observações:</p>
                <p className="mt-1 text-secondary-700">{charge.observations}</p>
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-3 justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="secondary">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="secondary">
            <Mail className="h-4 w-4 mr-2" />
            Enviar por Email
          </Button>
          {charge.status !== 'Pago' && (
            <Button 
              onClick={handleMarkAsPaid} 
              disabled={loading}
              variant="success"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Marcar como Pago
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente principal
export const Cobranca = () => {
  const { 
    costs, 
    loading: costsLoading, 
    updateCost, 
    getBillingCosts, 
    generateBillingCosts, 
    getBillingStatistics,
    markAsPaid 
  } = useCosts();
  const { vehicles } = useVehicles();
  const { customers } = useCustomers();
  const { contracts } = useContracts();
  const { fines } = useFines();
  const { isAdmin, isManager } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState(null);

  // Filtrar apenas custos do departamento de Cobrança
  const collectionCosts = costs.filter(cost => 
    cost.department === 'Cobrança' || 
    (cost.category === 'Multa' && cost.customer_id)
  );

  // Aplicar filtros adicionais
  const filteredCharges = collectionCosts.filter(charge => {
    const matchesSearch = 
      charge.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      charge.vehicle_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      charge.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === '' || charge.category === categoryFilter;
    const matchesStatus = statusFilter === '' || charge.status === statusFilter;
    const matchesCustomer = customerFilter === '' || charge.customer_id === customerFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesCustomer;
  });

  // Estatísticas
  const totalCharges = filteredCharges.length;
  const pendingCharges = filteredCharges.filter(c => c.status === 'Pendente').length;
  const totalAmount = filteredCharges.reduce((sum, c) => sum + c.amount, 0);
  const pendingAmount = filteredCharges.filter(c => c.status === 'Pendente').reduce((sum, c) => sum + c.amount, 0);
  const uniqueCustomers = new Set(filteredCharges.map(c => c.customer_id).filter(Boolean)).size;

  // Categorias únicas para filtro
  const categories = [...new Set(collectionCosts.map(c => c.category))];

  const handleViewDetail = (charge) => {
    setSelectedCharge(charge);
    setIsDetailModalOpen(true);
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await markAsPaid(id);
      setIsDetailModalOpen(false);
      toast.success('Cobrança marcada como paga com sucesso!');
    } catch (error) {
      console.error('Error marking charge as paid:', error);
      toast.error('Erro ao marcar cobrança como paga');
      throw error;
    }
  };

  const handleGenerateBilling = async () => {
    try {
      const result = await generateBillingCosts();
      toast.success(`Geradas ${result.generated_count} cobranças no valor de R$ ${result.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    } catch (error) {
      console.error('Error generating billing:', error);
      toast.error('Erro ao gerar cobranças automáticas');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Pago') {
      return <Badge variant="success">{status}</Badge>;
    } else if (status === 'Autorizado') {
      return <Badge variant="info">{status}</Badge>;
    } else {
      return <Badge variant="warning">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category) => {
    const variants = {
      'Excesso Km': 'error',
      'Diária Extra': 'warning',
      'Combustível': 'info',
      'Avaria': 'error',
      'Multa': 'error'
    };

    return <Badge variant={variants[category] || 'secondary'}>{category}</Badge>;
  };

  if (costsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900">Cobrança</h1>
          <p className="text-secondary-600 mt-1 lg:mt-2">Gerencie cobranças de clientes por danos, multas e adicionais</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <Button 
            variant="primary" 
            size="sm" 
            className="w-full sm:w-auto"
            onClick={handleGenerateBilling}
          >
            <Send className="h-4 w-4 mr-2" />
            Gerar Cobranças
          </Button>
          <Button variant="secondary" size="sm" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Total de Cobranças</p>
                <p className="text-xl lg:text-2xl font-bold text-secondary-900">{totalCharges}</p>
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
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Valor Total</p>
                <p className="text-xl lg:text-2xl font-bold text-secondary-900">
                  R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-success-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 lg:h-6 lg:w-6 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Pendentes</p>
                <p className="text-xl lg:text-2xl font-bold text-warning-600">{pendingCharges}</p>
                <p className="text-xs text-warning-600 mt-1">
                  R$ {pendingAmount.toLocaleString('pt-BR')}
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
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Clientes</p>
                <p className="text-xl lg:text-2xl font-bold text-secondary-900">{uniqueCustomers}</p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-info-100 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 lg:h-6 lg:w-6 text-info-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Avarias</p>
                <p className="text-xl lg:text-2xl font-bold text-secondary-900">
                  {filteredCharges.filter(c => c.category === 'Avaria').length}
                </p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-error-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 lg:h-6 lg:w-6 text-error-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
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
            <div className="flex flex-wrap gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todas as Categorias</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
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
              
              <Button variant="secondary" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charges List */}
      <Card>
        <CardHeader className="p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-secondary-900">
            Cobranças ({filteredCharges.length})
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile view */}
          <div className="lg:hidden space-y-3 p-4">
            {filteredCharges.map((charge) => (
              <div key={charge.id} className="border border-secondary-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-secondary-900">{charge.description}</p>
                    <p className="text-sm text-secondary-600">
                      {charge.customer_name ? (
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {charge.customer_name}
                        </span>
                      ) : 'Cliente não informado'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    {getCategoryBadge(charge.category)}
                    <span className="mt-1">{getStatusBadge(charge.status)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Car className="h-4 w-4 mr-1 text-secondary-400" />
                    <span className="text-sm text-secondary-600">{charge.vehicle_plate || 'N/A'}</span>
                  </div>
                  <p className="text-lg font-bold text-secondary-900">
                    R$ {charge.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-secondary-100">
                  <span className="text-xs text-secondary-500">
                    {new Date(charge.cost_date).toLocaleDateString('pt-BR')}
                  </span>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => handleViewDetail(charge)}
                    >
                      Detalhes
                    </Button>
                    {charge.status === 'Pendente' && (
                      <Button 
                        size="sm" 
                        variant="success"
                        onClick={() => handleMarkAsPaid(charge.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Pago
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Cliente</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Veículo</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Categoria</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Descrição</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Data</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Valor</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Status</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {filteredCharges.map((charge) => (
                  <tr key={charge.id} className="hover:bg-secondary-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-secondary-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-secondary-900">{charge.customer_name || 'Não informado'}</p>
                          {charge.contract_id && (
                            <p className="text-xs text-secondary-500">Contrato #{charge.contract_id.substring(0, 8)}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Car className="h-4 w-4 text-secondary-400 mr-2" />
                        <span className="text-sm text-secondary-900">{charge.vehicle_plate || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getCategoryBadge(charge.category)}
                    </td>
                    <td className="py-4 px-6 text-sm text-secondary-600 max-w-xs truncate" title={charge.description}>
                      {charge.description}
                    </td>
                    <td className="py-4 px-6 text-sm text-secondary-600">
                      {new Date(charge.cost_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-secondary-900">
                      R$ {charge.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(charge.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleViewDetail(charge)}
                        >
                          Detalhes
                        </Button>
                        {charge.status === 'Pendente' && (
                          <Button 
                            size="sm" 
                            variant="success"
                            onClick={() => handleMarkAsPaid(charge.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Pago
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCharges.length === 0 && (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">Nenhuma cobrança encontrada</p>
              <p className="text-sm text-secondary-500 mt-2">
                As cobranças são geradas automaticamente a partir de multas, danos e adicionais de contrato
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <ChargeDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        charge={selectedCharge}
        onMarkAsPaid={handleMarkAsPaid}
      />
    </div>
  );
};

export default Cobranca;