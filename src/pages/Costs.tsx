import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { useCosts } from '../hooks/useCosts';
import { useVehicles } from '../hooks/useVehicles';
import { useEmployees } from '../hooks/useEmployees';
import { useAuth } from '../hooks/useAuth';
import { CostsList } from '../components/Costs/CostsList';
import { Plus, Search, Filter, Calendar, DollarSign, Loader2, AlertTriangle, User, MapPin, Wrench, ClipboardCheck, Edit2, RefreshCw, Bug, ShoppingBag, Check, FileText } from 'lucide-react';

const CostModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  cost?: any;
  vehicles: any[];
  employees: any[];
  onSave: (data: any) => Promise<void>;
  isReadOnly?: boolean;
}> = ({ isOpen, onClose, cost, vehicles, employees, onSave, isReadOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: cost?.category || 'Avulsa',
    vehicle_id: cost?.vehicle_id || '',
    description: cost?.description || '',
    amount: cost?.amount || 0,
    cost_date: cost?.cost_date || new Date().toISOString().split('T')[0],
    status: cost?.status || 'Pendente',
    document_ref: cost?.document_ref || '',
    observations: cost?.observations || '',
    origin: cost?.origin || 'Manual',
    created_by_employee_id: cost?.created_by_employee_id || '',
    source_reference_type: cost?.source_reference_type || 'manual',
    department: cost?.department || '',
    customer_id: cost?.customer_id || '',
    customer_name: cost?.customer_name || '',
    contract_id: cost?.contract_id || ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        created_by_employee_id: formData.created_by_employee_id === '' ? null : formData.created_by_employee_id,
        document_ref: formData.document_ref === '' ? null : formData.document_ref,
        observations: formData.observations === '' ? null : formData.observations,
        department: formData.department === '' ? null : formData.department,
        customer_id: formData.customer_id === '' ? null : formData.customer_id,
        customer_name: formData.customer_name === '' ? null : formData.customer_name,
        contract_id: formData.contract_id === '' ? null : formData.contract_id
      };
      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error('Error saving cost:', error);
      alert('Erro ao salvar custo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) || 0 : value
    }));
  };

  const isAutomaticCost = cost?.origin && cost.origin !== 'Manual';
  const isViewOnly = isReadOnly || isAutomaticCost || cost?.id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h2 className="text-lg lg:text-xl font-semibold text-secondary-900">
            {cost ? (isViewOnly ? 'Visualizar Custo' : 'Editar Custo') : 'Novo Lançamento de Custo'}
          </h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 p-2">
            ×
          </button>
        </div>

        {/* Alert for automatic costs */}
        {isAutomaticCost && (
          <div className="mb-4 lg:mb-6 p-4 bg-info-50 border border-info-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-info-600 mr-2" />
              <div>
                <p className="text-info-800 font-medium text-sm">
                  Custo Gerado Automaticamente
                </p>
                <p className="text-info-700 text-xs mt-1">
                  Este custo foi criado automaticamente pelo sistema. Origem: {
                    cost.origin === 'Patio' ? 'Controle de Pátio' :
                    cost.origin === 'Manutencao' ? 'Manutenção' :
                    cost.origin === 'Sistema' ? 'Sistema' :
                    cost.origin === 'Compras' ? 'Compras' :
                    cost.origin
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alert for immutable costs */}
        {cost?.id && (
          <div className="mb-4 lg:mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-warning-600 mr-2" />
              <div>
                <p className="text-warning-800 font-medium text-sm">
                  Lançamento Imutável
                </p>
                <p className="text-warning-700 text-xs mt-1">
                  Lançamentos de custos não podem ser alterados após criados. Apenas o status pode ser atualizado para "Pago" ou "Autorizado".
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Categoria *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={isViewOnly}
              >
                <option value="Multa">Multa</option>
                <option value="Funilaria">Funilaria</option>
                <option value="Seguro">Seguro</option>
                <option value="Avulsa">Avulsa</option>
                <option value="Compra">Compra</option>
                <option value="Excesso Km">Excesso Km</option>
                <option value="Diária Extra">Diária Extra</option>
                <option value="Combustível">Combustível</option>
                <option value="Avaria">Avaria</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Origem *
              </label>
              <select
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={isViewOnly}
              >
                <option value="Manual">Lançamento Manual</option>
                <option value="Patio">Controle de Pátio</option>
                <option value="Manutencao">Manutenção</option>
                <option value="Sistema">Sistema</option>
                <option value="Compras">Compras</option>
              </select>
            </div>
          </div>

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
              disabled={isViewOnly}
            >
              <option value="">Selecione um veículo</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate} - {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          {/* Department field */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Departamento
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isViewOnly}
            >
              <option value="">Selecione um departamento (opcional)</option>
              <option value="Cobrança">Cobrança</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Administrativo">Administrativo</option>
              <option value="Financeiro">Financeiro</option>
            </select>
          </div>

          {/* Customer and contract fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Cliente
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nome do cliente (opcional)"
                disabled={isViewOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ID do Contrato
              </label>
              <input
                type="text"
                name="contract_id"
                value={formData.contract_id}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="ID do contrato (opcional)"
                disabled={isViewOnly}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Responsável pelo Lançamento
            </label>
            <select
              name="created_by_employee_id"
              value={formData.created_by_employee_id}
              onChange={handleChange}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isViewOnly}
            >
              <option value="">Sistema (automático)</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} - {employee.role} {employee.employee_code && `(${employee.employee_code})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Descrição *
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Descreva o custo..."
              required
              disabled={isViewOnly}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Valor (R$) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                step="0.01"
                min="0"
                required
                disabled={isViewOnly}
              />
              {formData.amount === 0 && (
                <p className="text-xs text-warning-600 mt-1">
                  Valor zerado - será exibido como "A Definir"
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Data *
              </label>
              <input
                type="date"
                name="cost_date"
                value={formData.cost_date}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={isViewOnly}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={isViewOnly && cost?.status !== 'Pendente'}
            >
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago</option>
              <option value="Autorizado">Autorizado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Referência do Documento
            </label>
            <input
              type="text"
              name="document_ref"
              value={formData.document_ref}
              onChange={handleChange}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="NF, número da multa, etc."
              disabled={isViewOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Observações
            </label>
            <textarea
              name="observations"
              value={formData.observations}
              onChange={handleChange}
              rows={3}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Observações adicionais..."
              disabled={isViewOnly}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 lg:pt-6 border-t">
            <Button variant="secondary" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
              {isViewOnly ? 'Fechar' : 'Cancelar'}
            </Button>
            {!isViewOnly && (
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {cost ? 'Salvar Alterações' : 'Lançar Custo'}
              </Button>
            )}
            {isViewOnly && cost?.status === 'Pendente' && (
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full sm:w-auto"
                onClick={(e) => {
                  e.preventDefault();
                  setFormData(prev => ({ ...prev, status: 'Pago' }));
                  handleSubmit(e);
                }}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Marcar como Pago
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export const Costs: React.FC = () => {
  const { costs, loading, createCost, updateCost, deleteCost, debugAutomaticCosts, reprocessInspectionCosts, authorizePurchase, refetch } = useCosts();
  const { vehicles } = useVehicles();
  const { employees } = useEmployees();
  const { isAdmin, isManager } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<any>(undefined);
  const [reprocessing, setReprocessing] = useState(false);

  // Debug automatic costs on component mount
  useEffect(() => {
    const debugCosts = async () => {
      try {
        await debugAutomaticCosts();
      } catch (error) {
        console.error('Debug failed:', error);
      }
    };
    
    if (!loading) {
      debugCosts();
    }
  }, [loading, debugAutomaticCosts]);

  const filteredCosts = costs.filter(cost => {
    const matchesSearch = 
      cost.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cost.vehicle_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cost.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOrigin = originFilter === '' || cost.origin === originFilter;
    const matchesDepartment = departmentFilter === '' || 
                             (departmentFilter === 'null' && !cost.department) || 
                             cost.department === departmentFilter;
    
    return matchesSearch && matchesOrigin && matchesDepartment;
  });

  const getOriginBadge = (origin: string) => {
    const variants = {
      'Manual': 'secondary',
      'Patio': 'info',
      'Manutencao': 'warning',
      'Sistema': 'primary',
      'Compras': 'success'
    } as const;

    const labels = {
      'Manual': 'Manual',
      'Patio': 'Pátio',
      'Manutencao': 'Manutenção',
      'Sistema': 'Sistema',
      'Compras': 'Compras'
    } as const;

    const icons = {
      'Manual': Edit2,
      'Patio': ClipboardCheck,
      'Manutencao': Wrench,
      'Sistema': FileText,
      'Compras': ShoppingBag
    } as const;

    const Icon = icons[origin as keyof typeof icons] || Edit2;

    return (
      <Badge variant={variants[origin as keyof typeof variants] || 'secondary'} className="flex items-center">
        <Icon className="h-3 w-3 mr-1" />
        {labels[origin as keyof typeof labels] || origin}
      </Badge>
    );
  };

  // Get unique departments for filter
  const departments = ['Cobrança', 'Manutenção', 'Administrativo', 'Financeiro'];
  const uniqueDepartments = [...new Set(costs.map(cost => cost.department).filter(Boolean))];
  const allDepartments = [...new Set([...departments, ...uniqueDepartments])];

  const handleView = (cost: any) => {
    setSelectedCost(cost);
    setIsViewModalOpen(true);
  };

  const handleEdit = (cost: any) => {
    setSelectedCost(cost);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    // Only Admin and Manager can create new costs
    if (!isAdmin && !isManager) {
      alert('Apenas administradores e gerentes podem criar novos lançamentos de custos.');
      return;
    }
    
    setSelectedCost(undefined);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    if (selectedCost) {
      await updateCost(selectedCost.id, data);
    } else {
      await createCost(data);
    }
  };

  const handleAuthorizePurchase = async (cost: any) => {
    // Only Admin and Manager can authorize purchases
    if (!isAdmin && !isManager) {
      alert('Apenas administradores e gerentes podem autorizar compras.');
      return;
    }
    
    if (confirm('Confirmar autorização de compra?')) {
      try {
        await authorizePurchase(cost.id);
      } catch (error) {
        console.error('Error authorizing purchase:', error);
        alert('Erro ao autorizar compra');
      }
    }
  };

  const handleReprocessCosts = async () => {
    // Only Admin can reprocess costs
    if (!isAdmin) {
      alert('Apenas administradores podem reprocessar custos.');
      return;
    }
    
    setReprocessing(true);
    try {
      const processed = await reprocessInspectionCosts();
      alert(`Reprocessados ${processed} custos de inspeções. A lista será atualizada.`);
    } catch (error) {
      alert('Erro ao reprocessar custos: ' + error);
    } finally {
      setReprocessing(false);
    }
  };

  const totalCosts = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const pendingCosts = filteredCosts.filter(cost => cost.status === 'Pendente').length;
  const costsToDefine = filteredCosts.filter(cost => cost.amount === 0 && cost.status === 'Pendente').length;
  const automaticCosts = filteredCosts.filter(cost => cost.origin !== 'Manual').length;
  const collectionCosts = filteredCosts.filter(cost => cost.department === 'Cobrança').length;

  // Check if user can edit costs (only Admin can)
  const canEditCosts = isAdmin;
  
  // Check if user can mark costs as paid (Admin and Manager can)
  const canMarkAsPaid = isAdmin || isManager;

  if (loading) {
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
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900">Custos</h1>
          <p className="text-secondary-600 mt-1 lg:mt-2">Controle todos os custos da operação com rastreabilidade completa</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          {isAdmin && (
            <Button 
              variant="secondary" 
              onClick={handleReprocessCosts}
              disabled={reprocessing}
              size="sm" 
              className="w-full sm:w-auto"
            >
              {reprocessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Reprocessar Custos
            </Button>
          )}
          {(isAdmin || isManager) && (
            <Button onClick={handleNew} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Lançamento
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Total de Custos</p>
                <p className="text-xl lg:text-2xl font-bold text-secondary-900">
                  R$ {totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Valores A Definir</p>
                <p className="text-xl lg:text-2xl font-bold text-warning-600">{costsToDefine}</p>
                <p className="text-xs text-warning-600 mt-1">Aguardando orçamento</p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 lg:h-6 lg:w-6 text-warning-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Custos Pendentes</p>
                <p className="text-xl lg:text-2xl font-bold text-secondary-900">{pendingCosts}</p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 lg:h-6 lg:w-6 text-warning-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Custos Automáticos</p>
                <p className="text-xl lg:text-2xl font-bold text-secondary-900">{automaticCosts}</p>
                <p className="text-xs text-secondary-600 mt-1">Gerados pelo sistema</p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-info-100 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="h-4 w-4 lg:h-6 lg:w-6 text-info-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Cobrança</p>
                <p className="text-xl lg:text-2xl font-bold text-secondary-900">{collectionCosts}</p>
                <p className="text-xs text-secondary-600 mt-1">Departamento de cobrança</p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 lg:h-6 lg:w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for costs to define */}
      {costsToDefine > 0 && (
        <Card className="border-warning-200 bg-warning-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0" />
              <div>
                <p className="text-warning-800 font-medium">
                  {costsToDefine} custo{costsToDefine > 1 ? 's' : ''} com valor a definir
                </p>
                <p className="text-warning-700 text-sm mt-1">
                  Estes custos foram gerados automaticamente pelo sistema. 
                  Clique em "Visualizar" para definir o valor após receber o orçamento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Buscar por descrição, veículo ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
                className="border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todas as Origens</option>
                <option value="Manual">Manual</option>
                <option value="Patio">Pátio</option>
                <option value="Manutencao">Manutenção</option>
                <option value="Sistema">Sistema</option>
                <option value="Compras">Compras</option>
              </select>
              
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os Departamentos</option>
                <option value="null">Sem Departamento</option>
                {allDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Costs List */}
      <Card>
        <CardHeader className="p-4 lg:p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-secondary-900">
              Lançamentos de Custos ({filteredCosts.length})
            </h3>
            <Button variant="secondary" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile view omitted for brevity */}

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <CostsList 
              costs={filteredCosts}
              onView={handleView}
              onEdit={handleEdit}
              onAuthorize={handleAuthorizePurchase}
              canEdit={canEditCosts}
              canAuthorize={canMarkAsPaid}
            />
          </div>

          {filteredCosts.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">Nenhum custo encontrado</p>
              <p className="text-sm text-secondary-500 mt-2">
                Os custos de danos do pátio são criados automaticamente quando inspeções de Check-Out detectam danos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <CostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cost={selectedCost}
        vehicles={vehicles}
        employees={employees}
        onSave={handleSave}
        isReadOnly={!canEditCosts && selectedCost?.id}
      />

      {/* View Modal */}
      <CostModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        cost={selectedCost}
        vehicles={vehicles}
        employees={employees}
        onSave={handleSave}
        isReadOnly={true}
      />
    </div>
  );
};

export default Costs;