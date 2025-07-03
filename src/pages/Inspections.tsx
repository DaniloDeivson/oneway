import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { useInspections } from '../hooks/useInspections';
import { useVehicles } from '../hooks/useVehicles';
import { useEmployees } from '../hooks/useEmployees';
import DamageCartModal from '../components/Inspections/DamageCartModal';
import { VehicleSearchModal } from '../components/Inspections/VehicleSearchModal';
import { InspectionForm } from '../components/Inspections/InspectionForm';
import { Plus, Search, Filter, ClipboardCheck, AlertTriangle, Camera, FileText, Loader2, Edit, Eye, Trash2, Car, CheckCircle, Clock, DollarSign, ShoppingCart, Mail, Fuel, Gauge } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

interface DamageItem {
  id: string;
  location: string;
  description: string;
  damage_type: 'Arranhão' | 'Amassado' | 'Quebrado' | 'Desgaste' | 'Outro';
  severity: 'Baixa' | 'Média' | 'Alta';
  photo_url?: string;
  requires_repair: boolean;
}

const InspectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  inspection?: any;
  selectedVehicle?: any;
  employees: any[];
  onSave: (data: any, damages?: Omit<DamageItem, 'id'>[]) => Promise<void>;
  onUploadSignature: (blob: Blob) => Promise<string>;
}> = ({ isOpen, onClose, inspection, selectedVehicle, employees, onSave, onUploadSignature }) => {
  // Move hooks to the top, before any conditional returns
  const { uploadPhoto } = useInspections();
  const [loading, setLoading] = useState(false);
  const [damageCart, setDamageCart] = useState<DamageItem[]>([]);
  const [isDamageCartOpen, setIsDamageCartOpen] = useState(false);

  // Add useEffect to synchronize form data when props change
  useEffect(() => {
    if (isOpen) {
      // Reset damage cart for new inspections, load existing items for edit
      if (!inspection) {
        setDamageCart([]);
      } else if (inspection.inspection_items) {
        // Convert existing inspection items to damage cart format
        const existingDamages = inspection.inspection_items.map((item: any) => ({
          id: item.id,
          location: item.location,
          description: item.description,
          damage_type: item.damage_type,
          severity: item.severity,
          photo_url: item.photo_url,
          requires_repair: item.requires_repair
        }));
        setDamageCart(existingDamages);
      }
    }
  }, [isOpen, inspection, selectedVehicle]);

  if (!isOpen) return null;

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      // Para nova inspeção, passar também os danos do carrinho
      const damagesWithoutId = damageCart.map(({ id, ...damage }) => damage);
      await onSave(formData, !inspection ? damagesWithoutId : undefined);
      
      // Clear damage cart and close modal
      setDamageCart([]);
      toast.success('Inspeção salva com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error saving inspection:', error);
      toast.error('Erro ao salvar inspeção. Verifique se todos os campos obrigatórios estão preenchidos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDamageCart = async (damages: Omit<DamageItem, 'id'>[]) => {
    console.log('handleSaveDamageCart called with:', damages);
    
    if (inspection) {
      // Para inspeção existente, salvar danos diretamente
      try {
        for (const damage of damages) {
          await addInspectionItem(inspection.id, damage);
        }
        toast.success(`${damages.length} danos adicionados à inspeção!`);
      } catch (error) {
        console.error('Error adding damages to existing inspection:', error);
        toast.error('Erro ao adicionar danos à inspeção');
      }
    } else {
      // Para nova inspeção, adicionar ao carrinho local
      const damagesWithId = damages.map(damage => ({
        ...damage,
        id: Date.now().toString() + Math.random().toString()
      }));
      
      console.log('Adding to cart:', damagesWithId);
      
      // Atualizar o carrinho com novos danos
      setDamageCart(prev => {
        const updated = [...prev, ...damagesWithId];
        console.log('Updated damage cart:', updated);
        return updated;
      });
      
      toast.success(`${damagesWithId.length} danos adicionados ao carrinho!`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h2 className="text-lg lg:text-xl font-semibold text-secondary-900">
            {inspection ? 'Editar Inspeção' : 'Nova Inspeção'}
          </h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 p-2">
            ×
          </button>
        </div>

        <InspectionForm
          onSubmit={handleSubmit}
          onCancel={onClose}
          inspection={inspection}
          selectedVehicle={selectedVehicle}
          employees={employees}
          onOpenDamageCart={() => setIsDamageCartOpen(true)}
          damageCount={damageCart.length}
          damageCart={damageCart}
        />

        <DamageCartModal
          isOpen={isDamageCartOpen}
          onClose={() => setIsDamageCartOpen(false)}
          damageCart={damageCart}
          onUpdateCart={setDamageCart}
          onSaveCart={handleSaveDamageCart}
          onUploadPhoto={uploadPhoto}
        />
      </div>
    </div>
  );
};

export const Inspections: React.FC = () => {
  const { inspections, statistics, loading, createInspection, updateInspection, deleteInspection, addInspectionItem, uploadPhoto, uploadSignature, processDamageNotifications } = useInspections();
  const { vehicles } = useVehicles();
  const { employees } = useEmployees();
  const { isAdmin, isManager, hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVehicleSearchOpen, setIsVehicleSearchOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<any>(undefined);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(undefined);
  const [processingNotifications, setProcessingNotifications] = useState(false);
  const [damageItems, setDamageItems] = useState<DamageItem[]>([]);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedViewInspection, setSelectedViewInspection] = useState<any>(null);

  const canManageInspections = isAdmin || isManager || hasPermission('inspections');

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = 
      inspection.vehicles?.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.vehicles?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.inspected_by?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === '' || inspection.inspection_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    const variants = {
      'CheckIn': 'success',
      'CheckOut': 'warning'
    } as const;

    const labels = {
      'CheckIn': 'Check-In',
      'CheckOut': 'Check-Out'
    } as const;

    return <Badge variant={variants[type as keyof typeof variants] || 'secondary'}>
      {labels[type as keyof typeof labels] || type}
    </Badge>;
  };

  const handleEdit = (inspection: any) => {
    setSelectedInspection(inspection);
    setSelectedVehicle(null);
    setIsModalOpen(true);
  };

  const handleNewInspection = () => {
    setSelectedInspection(undefined);
    setSelectedVehicle(null);
    setIsVehicleSearchOpen(true);
  };

  const handleVehicleSelected = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsVehicleSearchOpen(false);
    setIsModalOpen(true);
  };

  const handleDelete = (inspection: any) => {
    setSelectedInspection(inspection);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedInspection) return;
    
    try {
      await deleteInspection(selectedInspection.id);
      setIsConfirmDeleteOpen(false);
      toast.success('Inspeção excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting inspection:', error);
      toast.error('Erro ao excluir inspeção: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleSave = async (data: any, damages?: any[]) => {
    try {
      if (selectedInspection) {
        await updateInspection(selectedInspection.id, data);
        toast.success('Inspeção atualizada com sucesso!');
      } else {
        // Criar nova inspeção
        const newInspection = await createInspection(data);
        
        // Se há danos, adicionar após criar a inspeção
        if (damages && damages.length > 0 && newInspection) {
          for (const damage of damages) {
            await addInspectionItem(newInspection.id, damage);
          }
          
          // Criar automaticamente custos e cobranças para os danos
          await createDamageCostsAndCharges(newInspection, damages, data);
          
          toast.success(`Inspeção criada com ${damages.length} danos registrados!`);
        } else {
          toast.success('Inspeção criada com sucesso!');
        }
      }
    } catch (error) {
      console.error('Error saving inspection:', error);
      toast.error('Erro ao salvar inspeção');
      throw error;
    }
  };

  // Função para criar automaticamente custos e cobranças para danos
  const createDamageCostsAndCharges = async (inspection: any, damages: any[], inspectionData: any) => {
    try {
      const { createCost } = await import('../hooks/useCosts');
      
      for (const damage of damages) {
        // Criar custo para cada dano
        const costData = {
          description: `Dano detectado - ${damage.location}: ${damage.description}`,
          amount: 0, // Valor a definir
          category: 'Avulsa',
          origin: 'Inspeção',
          vehicle_id: inspection.vehicle_id,
          responsible: inspection.inspected_by,
          status: 'Pendente',
          notes: `Severidade: ${damage.severity} | Tipo: ${damage.damage_type} | Requer reparo: ${damage.requires_repair ? 'Sim' : 'Não'}`
        };
        
        await createCost(costData);
        
        // Se há contrato ativo, criar cobrança para o cliente
        if (inspectionData.contract_id) {
          // Aqui você pode implementar a criação de cobrança
          console.log('Criando cobrança para cliente do contrato:', inspectionData.contract_id);
          // Implementar lógica de cobrança quando necessário
        }
      }
      
      console.log(`Criados ${damages.length} custos automáticos para danos detectados`);
    } catch (error) {
      console.error('Erro ao criar custos automáticos:', error);
      toast.error('Erro ao criar custos automáticos para danos');
    }
  };

  const handleProcessNotifications = async () => {
    setProcessingNotifications(true);
    try {
      const result = await processDamageNotifications();
      toast.success(`Processadas ${result.processed} notificações de danos`);
    } catch (error) {
      toast.error('Erro ao processar notificações');
    } finally {
      setProcessingNotifications(false);
    }
  };

  // Get inspector name from employee ID
  const getInspectorName = (employeeId: string, inspection?: any) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : inspection?.inspected_by || 'Não atribuído';
  };

  // Get contract info if available
  const getContractInfo = (inspection: any) => {
    if (!inspection.contract_id) return null;
    
    return (
      <div className="flex items-center">
        <FileText className="h-4 w-4 mr-1 text-primary-500" />
        <span className="text-primary-600 text-sm font-medium">Contrato vinculado</span>
      </div>
    );
  };

  // Adicionar função para visualizar inspeção
  const handleView = (inspection: any) => {
    setSelectedViewInspection(inspection);
    setIsViewModalOpen(true);
  };

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
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900">Controle de Pátio</h1>
          <p className="text-secondary-600 mt-1 lg:mt-2">Check-In/Check-Out e gestão de danos</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <Button 
            variant="secondary" 
            onClick={handleProcessNotifications}
            disabled={processingNotifications}
            size="sm" 
            className="w-full sm:w-auto"
          >
            {processingNotifications ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Processar Notificações
          </Button>
          {canManageInspections && (
            <Button onClick={handleNewInspection} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Inspeção
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-600 text-xs lg:text-sm font-medium">Total Inspeções</p>
                  <p className="text-xl lg:text-2xl font-bold text-secondary-900">{statistics.total_inspections}</p>
                </div>
                <div className="h-8 w-8 lg:h-12 lg:w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <ClipboardCheck className="h-4 w-4 lg:h-6 lg:w-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-600 text-xs lg:text-sm font-medium">Danos Detectados</p>
                  <p className="text-xl lg:text-2xl font-bold text-secondary-900">{statistics.total_damages}</p>
                </div>
                <div className="h-8 w-8 lg:h-12 lg:w-12 bg-error-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 lg:h-6 lg:w-6 text-error-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-600 text-xs lg:text-sm font-medium">Custo Estimado</p>
                  <p className="text-xl lg:text-2xl font-bold text-secondary-900">
                    R$ {statistics.total_estimated_costs.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="h-8 w-8 lg:h-12 lg:w-12 bg-warning-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 lg:h-6 lg:w-6 text-warning-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-600 text-xs lg:text-sm font-medium">Em Manutenção</p>
                  <p className="text-xl lg:text-2xl font-bold text-secondary-900">{statistics.vehicles_in_maintenance}</p>
                </div>
                <div className="h-8 w-8 lg:h-12 lg:w-12 bg-warning-100 rounded-lg flex items-center justify-center">
                  <Car className="h-4 w-4 lg:h-6 lg:w-6 text-warning-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
                  placeholder="Buscar por veículo ou responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os Tipos</option>
                <option value="CheckIn">Check-In</option>
                <option value="CheckOut">Check-Out</option>
              </select>
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspections List */}
      <Card>
        <CardHeader className="p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-secondary-900">
            Inspeções ({filteredInspections.length})
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3 p-4">
            {filteredInspections.map((inspection) => {
              const inspectorName = getInspectorName(inspection.employee_id, inspection);
              const contractInfo = getContractInfo(inspection);
              const damageCount = inspection.inspection_items?.length || 0;
              
              return (
                <div key={inspection.id} className="border border-secondary-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-secondary-900">{inspection.vehicles?.plate || '-'}</p>
                      <p className="text-sm text-secondary-600">{inspection.vehicles?.model}</p>
                      {contractInfo}
                    </div>
                    {getTypeBadge(inspection.inspection_type)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 my-2">
                    {inspection.mileage && (
                      <div className="flex items-center text-sm text-secondary-600">
                        <Gauge className="h-3 w-3 mr-1" />
                        <span>{inspection.mileage} km</span>
                      </div>
                    )}
                    {inspection.fuel_level && (
                      <div className="flex items-center text-sm text-secondary-600">
                        <Fuel className="h-3 w-3 mr-1" />
                        <span>{Math.round(inspection.fuel_level * 100)}%</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-secondary-500">
                      {new Date(inspection.inspected_at).toLocaleDateString('pt-BR')}
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="text-secondary-600 mr-2">Inspetor: {inspectorName}</span>
                      {damageCount > 0 && (
                        <Badge variant="warning" className="text-xs">
                          {damageCount} danos
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end mt-3 space-x-2">
                    <button 
                      onClick={() => handleView(inspection)}
                      className="p-2 text-secondary-400 hover:text-secondary-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {canManageInspections && (
                      <>
                        <button 
                          onClick={() => handleEdit(inspection)}
                          className="p-2 text-secondary-400 hover:text-secondary-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(inspection)}
                          className="p-2 text-secondary-400 hover:text-error-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Data/Hora</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Veículo</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Tipo</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Responsável</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Métricas</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Danos</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Contrato</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {filteredInspections.map((inspection) => {
                  const inspectorName = getInspectorName(inspection.employee_id, inspection);
                  const damageCount = inspection.inspection_items?.length || 0;
                  
                  return (
                    <tr key={inspection.id} className="hover:bg-secondary-50">
                      <td className="py-4 px-6 text-sm text-secondary-600">
                        <div>
                          <p>{new Date(inspection.inspected_at).toLocaleDateString('pt-BR')}</p>
                          <p className="text-xs">{new Date(inspection.inspected_at).toLocaleTimeString('pt-BR')}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-medium text-secondary-900">{inspection.vehicles?.plate}</p>
                          <p className="text-xs text-secondary-600">{inspection.vehicles?.model} ({inspection.vehicles?.year})</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getTypeBadge(inspection.inspection_type)}
                      </td>
                      <td className="py-4 px-6 text-sm text-secondary-600">
                        {inspectorName}
                      </td>
                      <td className="py-4 px-6 text-sm text-secondary-600">
                        <div className="space-y-1">
                          {inspection.mileage && (
                            <div className="flex items-center">
                              <Gauge className="h-3 w-3 mr-1 text-secondary-400" />
                              <span>{inspection.mileage} km</span>
                            </div>
                          )}
                          {inspection.fuel_level && (
                            <div className="flex items-center">
                              <Fuel className="h-3 w-3 mr-1 text-secondary-400" />
                              <span>{Math.round(inspection.fuel_level * 100)}% combustível</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {damageCount > 0 ? (
                          <Badge variant="warning">
                            {damageCount} danos
                          </Badge>
                        ) : (
                          <Badge variant="success">Sem danos</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-secondary-600">
                        {inspection.contract_id ? (
                          <Badge variant="primary">Contrato #{inspection.contract_id.substring(0, 8)}</Badge>
                        ) : (
                          <span className="text-secondary-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleView(inspection)}
                            className="p-1 text-secondary-400 hover:text-secondary-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canManageInspections && (
                            <>
                              <button 
                                onClick={() => handleEdit(inspection)}
                                className="p-1 text-secondary-400 hover:text-secondary-600"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(inspection)}
                                className="p-1 text-secondary-400 hover:text-error-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredInspections.length === 0 && (
            <div className="text-center py-8">
              <ClipboardCheck className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">Nenhuma inspeção encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Delete */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Confirmar Exclusão</h3>
            <p className="text-secondary-600 mb-6">
              Tem certeza que deseja excluir esta inspeção? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-4">
              <Button 
                variant="secondary" 
                onClick={() => setIsConfirmDeleteOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="error" 
                onClick={confirmDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      <VehicleSearchModal
        isOpen={isVehicleSearchOpen}
        onClose={() => setIsVehicleSearchOpen(false)}
        vehicles={vehicles}
        onSelectVehicle={handleVehicleSelected}
        loading={loading}
      />

      <InspectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inspection={selectedInspection}
        selectedVehicle={selectedVehicle}
        employees={employees}
        onSave={handleSave}
        onUploadSignature={uploadSignature}
      />

      {/* View Inspection Modal */}
      {isViewModalOpen && selectedViewInspection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-secondary-900">
                Detalhes da Inspeção
              </h3>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-secondary-400 hover:text-secondary-600 p-2"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informações Gerais */}
              <div className="space-y-4">
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-secondary-900 mb-3">Informações Gerais</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Data/Hora:</span>
                      <span className="font-medium">
                        {new Date(selectedViewInspection.inspected_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Tipo:</span>
                      <span className="font-medium">{selectedViewInspection.inspection_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Inspetor:</span>
                      <span className="font-medium">
                        {getInspectorName(selectedViewInspection.employee_id, selectedViewInspection)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informações do Veículo */}
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-secondary-900 mb-3">Veículo</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Placa:</span>
                      <span className="font-medium">{selectedViewInspection.vehicles?.plate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Modelo:</span>
                      <span className="font-medium">
                        {selectedViewInspection.vehicles?.model} ({selectedViewInspection.vehicles?.year})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Métricas */}
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-secondary-900 mb-3">Métricas</h4>
                  <div className="space-y-2">
                    {selectedViewInspection.mileage && (
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Quilometragem:</span>
                        <span className="font-medium">{selectedViewInspection.mileage} km</span>
                      </div>
                    )}
                    {selectedViewInspection.fuel_level && (
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Combustível:</span>
                        <span className="font-medium">{Math.round(selectedViewInspection.fuel_level * 100)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Danos e Observações */}
              <div className="space-y-4">
                {/* Danos */}
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-secondary-900 mb-3">
                    Danos Identificados ({selectedViewInspection.inspection_items?.length || 0})
                  </h4>
                  {selectedViewInspection.inspection_items?.length > 0 ? (
                    <div className="space-y-3">
                      {selectedViewInspection.inspection_items.map((item: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded border-l-4 border-warning-500">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-secondary-900">{item.location}</span>
                            <Badge variant="warning" className="text-xs">
                              {item.damage_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-secondary-600 mb-2">{item.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-secondary-500">
                              Severidade: {item.severity}
                            </span>
                            {item.requires_repair && (
                              <Badge variant="error" className="text-xs">
                                Requer Reparo
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary-600 text-center py-4">
                      Nenhum dano identificado nesta inspeção
                    </p>
                  )}
                </div>

                {/* Observações */}
                {selectedViewInspection.observations && (
                  <div className="bg-secondary-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-secondary-900 mb-3">Observações</h4>
                    <p className="text-secondary-700 whitespace-pre-wrap">
                      {selectedViewInspection.observations}
                    </p>
                  </div>
                )}

                {/* Contrato */}
                {selectedViewInspection.contract_id && (
                  <div className="bg-secondary-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-secondary-900 mb-3">Contrato</h4>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">ID do Contrato:</span>
                      <Badge variant="primary">
                        #{selectedViewInspection.contract_id.substring(0, 8)}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end mt-6 space-x-4">
              <Button 
                variant="secondary" 
                onClick={() => setIsViewModalOpen(false)}
              >
                Fechar
              </Button>
              {canManageInspections && (
                <Button 
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleEdit(selectedViewInspection);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inspections;