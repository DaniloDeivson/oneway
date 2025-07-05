import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { useCosts } from '../hooks/useCosts';
import { useVehicles } from '../hooks/useVehicles';
import { useEmployees } from '../hooks/useEmployees';
import { useAuth } from '../hooks/useAuth';
import { CostsList } from '../components/Costs/CostsList';
import { Plus, Search, Filter, Calendar, DollarSign, Loader2, AlertTriangle, ClipboardCheck, Edit2, RefreshCw, FileText } from 'lucide-react';
import { Database } from '../types/database';

type Cost = Database['public']['Tables']['costs']['Row'] & {
  vehicles?: { plate: string; model: string };
  created_by_name?: string;
  created_by_role?: string;
  created_by_code?: string;
  origin_description?: string;
  is_amount_to_define?: boolean;
  contracts?: { id: string; contract_number: string };
  customers?: { id: string; name: string };
  vehicle_plate?: string | undefined;
  vehicle_model?: string;
};

type CostInsert = Omit<Database['public']['Tables']['costs']['Insert'], 'tenant_id'>;
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Employee = Database['public']['Tables']['employees']['Row'];

const CostModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  cost?: Cost;
  vehicles: Vehicle[];
  employees: Employee[];
  onSave: (data: CostInsert) => Promise<void>;
  isReadOnly?: boolean;
}> = ({ isOpen, onClose, cost, vehicles, employees, onSave, isReadOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: cost?.category || 'Avulsa' as const,
    vehicle_id: cost?.vehicle_id || '',
    description: cost?.description || '',
    amount: cost?.amount || 0,
    cost_date: cost?.cost_date || new Date().toISOString().split('T')[0],
    status: cost?.status || 'Pendente' as const,
    document_ref: cost?.document_ref || '',
    observations: cost?.observations || '',
    origin: cost?.origin || 'Manual' as const,
    created_by_employee_id: cost?.created_by_employee_id || '',
    source_reference_type: cost?.source_reference_type || 'manual' as const,
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
      const submitData: CostInsert = {
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

  const isAmountToDefine = cost && cost.amount === 0 && cost.status === 'Pendente';
  const isAutomaticCost = cost?.origin && cost.origin !== 'Manual';
  const isViewOnly = isReadOnly || (isAutomaticCost && !isAmountToDefine) || (cost?.id && !isAmountToDefine);

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
                    cost.origin === 'Patio' && cost.description?.toLowerCase().includes('check-out') ? 'Controle de Pátio (Check-Out)' :
                    cost.origin === 'Patio' && cost.description?.toLowerCase().includes('check-in') ? 'Controle de Pátio (Check-In)' :
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
                disabled={!!isViewOnly}
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
                disabled={!!isViewOnly}
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
              disabled={!!isViewOnly}
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
              value={formData.department || ''}
              onChange={handleChange}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={!!isViewOnly}
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
                value={formData.customer_name ?? ''}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nome do cliente (opcional)"
                disabled={!!isViewOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                ID do Contrato
              </label>
              <input
                type="text"
                name="contract_id"
                value={formData.contract_id ?? ''}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="ID do contrato (opcional)"
                disabled={!!isViewOnly}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Responsável pelo Lançamento
            </label>
            <select
              name="created_by_employee_id"
              value={formData.created_by_employee_id || ''}
              onChange={handleChange}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={!!isViewOnly}
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
              disabled={!!isViewOnly}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Valor (R$) *
              </label>
              {isViewOnly && !isAmountToDefine ? (
                <div className="w-full px-3 py-2 rounded-lg bg-secondary-50 border border-secondary-200 text-secondary-800 font-semibold cursor-not-allowed">
                  {formData.amount === 0 ? 'Orçamento' : `R$ ${formData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </div>
              ) : (
                <input
                  type="number"
                  name="amount"
                  value={formData.amount ?? 0}
                  onChange={handleChange}
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  step="0.01"
                  min="0"
                  required
                  disabled={!!isViewOnly && !isAmountToDefine}
                />
              )}
              {formData.amount === 0 && (
                <p className="text-xs text-warning-600 mt-1">
                  Valor zerado - será exibido como "Orçamento"
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
                disabled={!!isViewOnly}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Status *
            </label>
            <select
              name="status"
              value={formData.status || 'Pendente'}
              onChange={handleChange}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={Boolean(isViewOnly && cost?.status !== 'Pendente')}
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
              value={formData.document_ref || ''}
              onChange={handleChange}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="NF, número da multa, etc."
              disabled={!!isViewOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Observações
            </label>
            <textarea
              name="observations"
              value={formData.observations || ''}
              onChange={handleChange}
              rows={3}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Observações adicionais..."
              disabled={!!(isViewOnly && !isAmountToDefine)}
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
                type="button" 
                disabled={Boolean(loading)} 
                className="w-full sm:w-auto"
                onClick={() => {
                  setFormData(prev => ({ ...prev, status: 'Pago' }));
                  handleSubmit({ preventDefault: () => {} } as React.FormEvent);
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
  const { costs, loading, createCost, updateCost, updateCostEstimate, fetchRealCosts, debugAutomaticCosts, reprocessInspectionCosts, authorizePurchase, refetch, markAsPaid } = useCosts();
  const { vehicles } = useVehicles();
  const { employees } = useEmployees();
  const { isAdmin, isManager } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<Cost | undefined>(undefined);
  const [reprocessing, setReprocessing] = useState(false);
  const [loadingRealCosts, setLoadingRealCosts] = useState(false);

  // Debug automatic costs on component mount
  useEffect(() => {
    const debugCosts = async () => {
      try {
        await debugAutomaticCosts();
      } catch {
        // erro ignorado
      }
    };
    
    if (!loading) {
      debugCosts();
    }
  }, [loading, debugAutomaticCosts]);

  const filteredCosts = costs.filter(cost => {
    const matchesSearch = 
      cost.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cost.vehicles?.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cost.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOrigin = originFilter === '' || cost.origin === originFilter;
    const matchesDepartment = departmentFilter === '' || 
                             (departmentFilter === 'null' && !cost.department) || 
                             cost.department === departmentFilter;
    
    return matchesSearch && matchesOrigin && matchesDepartment;
  });

  // Mapeia vehicle_id para plate caso vehicle_plate não esteja presente
  const costsWithVehiclePlate = filteredCosts.map(cost => {
    const c = cost as Cost & { vehicle_plate?: string };
    if (!c.vehicle_plate) {
      const vehicle = vehicles.find(v => v.id === c.vehicle_id);
      return {
        ...c,
        vehicle_plate: vehicle ? vehicle.plate : '-',
      };
    }
    return c;
  });

  // Get unique departments for filter
  const departments = ['Cobrança', 'Manutenção', 'Administrativo', 'Financeiro'];
  const uniqueDepartments = [...new Set(costs.map(cost => cost.department).filter(Boolean))];
  const allDepartments = [...new Set([...departments, ...uniqueDepartments])];

  const handleView = (cost: Cost) => {
    setSelectedCost(cost);
    setIsViewModalOpen(true);
  };

  const handleEdit = (cost: Cost) => {
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

  const handleSave = async (data: CostInsert) => {
    if (selectedCost) {
      await updateCost(selectedCost.id, data);
    } else {
      await createCost(data);
    }
  };

  const handleAuthorizePurchase = async (cost: Cost) => {
    // Only Admin and Manager can authorize purchases
    if (!isAdmin && !isManager) {
      alert('Apenas administradores e gerentes podem autorizar compras.');
      return;
    }
    
    if (confirm('Confirmar autorização de compra?')) {
      try {
        await authorizePurchase(cost.id);
      } catch {
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

  const handleMarkAsPaid = async (cost: Cost) => {
    if (!isAdmin && !isManager) {
      alert('Apenas administradores e gerentes podem marcar como pago.');
      return;
    }
    if (confirm('Confirmar marcação como pago?')) {
      try {
        await markAsPaid(cost.id);
      } catch (error) {
        alert('Erro ao marcar como pago');
      }
    }
  };

  const handleLoadRealCosts = async () => {
    setLoadingRealCosts(true);
    try {
      await fetchRealCosts();
      alert('Custos reais carregados com sucesso!');
    } catch (error) {
      alert('Erro ao carregar custos reais: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoadingRealCosts(false);
    }
  };

  const handleEditEstimate = (cost: Cost) => {
    setSelectedCost(cost);
    setIsEstimateModalOpen(true);
  };

  const handleUpdateEstimate = async (amount: number, observations?: string) => {
    if (!selectedCost) return;
    
    try {
      await updateCostEstimate(selectedCost.id, amount, observations);
      setIsEstimateModalOpen(false);
      setSelectedCost(undefined);
      alert('Orçamento atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar orçamento: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const totalCosts = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const pendingCosts = filteredCosts.filter(cost => cost.status === 'Pendente').length;
  const costsToDefine = filteredCosts.filter(cost => cost.amount === 0 && cost.status === 'Pendente').length;
  const automaticCosts = filteredCosts.filter(cost => cost.origin !== 'Manual').length;
  const collectionCosts = filteredCosts.filter(cost => cost.department === 'Cobrança').length;

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
          <Button 
            variant="secondary" 
            onClick={handleLoadRealCosts}
            disabled={loadingRealCosts}
            size="sm" 
            className="w-full sm:w-auto"
          >
            {loadingRealCosts ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Carregar Custos Reais
          </Button>
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
          {/* Mobile view */}
          <div className="lg:hidden">
            <div className="divide-y divide-secondary-200">
              {filteredCosts.map((cost) => (
                <div key={cost.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {cost.origin_description || cost.origin}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {cost.category}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-secondary-900 mb-1">
                        {cost.description}
                      </p>
                      <div className="flex items-center text-xs text-secondary-600 space-x-4">
                        <span>{new Date(cost.cost_date).toLocaleDateString('pt-BR')}</span>
                        <span>{cost.vehicles?.plate || '-'}</span>
                        {cost.customer_name && <span>{cost.customer_name}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-secondary-900 mb-1">
                        {cost.amount === 0 && cost.status === 'Pendente' ? (
                          <span className="text-warning-600">A Definir</span>
                        ) : (
                          `R$ ${cost.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        )}
                      </div>
                      <Badge variant={cost.status === 'Pago' ? 'success' : cost.status === 'Autorizado' ? 'info' : 'warning'}>
                        {cost.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-secondary-600">
                      {cost.created_by_name || 'Sistema'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        onClick={() => handleView(cost)}
                        variant="secondary"
                        size="sm"
                        className="text-xs"
                      >
                        Visualizar
                      </Button>
                      {isAdmin || isManager && (
                        <Button 
                          onClick={() => handleEdit(cost)}
                          variant="secondary"
                          size="sm"
                          className="text-xs"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <CostsList 
              costs={costsWithVehiclePlate}
              onView={handleView}
              onEdit={isAdmin || isManager ? handleEdit : undefined}
              onEditEstimate={handleEditEstimate}
              onAuthorize={isAdmin || isManager ? handleAuthorizePurchase : undefined}
              onMarkAsPaid={isAdmin || isManager ? handleMarkAsPaid : undefined}
              canEdit={isAdmin || isManager}
              canAuthorize={isAdmin || isManager}
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
        isReadOnly={!isAdmin && !isManager && selectedCost?.id}
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

      {/* Estimate Edit Modal */}
      {isEstimateModalOpen && selectedCost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-secondary-900">
                Editar Orçamento
              </h2>
              <button 
                onClick={() => setIsEstimateModalOpen(false)}
                className="text-secondary-400 hover:text-secondary-600 p-2"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-secondary-600 mb-2">
                <strong>Descrição:</strong> {selectedCost.description}
              </p>
              <p className="text-sm text-secondary-600 mb-2">
                <strong>Categoria:</strong> {selectedCost.category}
              </p>
              <p className="text-sm text-secondary-600 mb-2">
                <strong>Veículo:</strong> {selectedCost.vehicles?.plate || selectedCost.vehicle_plate || '-'}
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const amount = Number(formData.get('amount'));
              const observations = formData.get('observations') as string;
              handleUpdateEstimate(amount, observations);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Valor do Orçamento *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0"
                    required
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0,00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    name="observations"
                    rows={3}
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Observações sobre o orçamento..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEstimateModalOpen(false)}
                  className="px-4 py-2 text-secondary-600 hover:text-secondary-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Salvar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Costs;