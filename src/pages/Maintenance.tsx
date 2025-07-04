import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { useServiceNotes } from '../hooks/useServiceNotes';
import { useVehicles } from '../hooks/useVehicles';
import { useMaintenanceTypes } from '../hooks/useMaintenanceTypes';
import { useEmployees } from '../hooks/useEmployees';
import { useParts } from '../hooks/useParts';
import { useServiceOrderParts, PartCartItem } from '../hooks/useServiceOrderParts';
import { useMaintenanceCheckins } from '../hooks/useMaintenanceCheckins';
import { PartsCartModal } from '../components/Maintenance/PartsCartModal';
import { CheckInOutModal } from '../components/Maintenance/CheckInOutModal';
import { CheckInStatusCard } from '../components/Maintenance/CheckInStatusCard';
import { Plus, Search, Filter, Wrench, Clock, CheckCircle, Loader2, Edit, Eye, Package, AlertTriangle, Trash2, LogIn, LogOut, User } from 'lucide-react';
import ServiceNoteForm from '../components/Maintenance/ServiceNoteForm';
import toast from 'react-hot-toast';

const PartsInventoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  parts: any[];
}> = ({ isOpen, onClose, parts }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredParts = parts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (part: any) => {
    if (part.quantity <= 0) {
      return <Badge variant="error">Sem Estoque</Badge>;
    } else if (part.quantity <= part.min_stock) {
      return <Badge variant="warning">Estoque Baixo</Badge>;
    }
    return <Badge variant="success">Disponível</Badge>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h2 className="text-lg lg:text-xl font-semibold text-secondary-900">
            Consulta de Estoque - Peças Disponíveis
          </h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 p-2">
            ×
          </button>
        </div>

        {/* Search */}
        <div className="mb-4 lg:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Buscar peça por nome ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Parts List - Mobile optimized */}
        <div className="space-y-3 lg:space-y-0">
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {filteredParts.map((part) => (
              <div key={part.id} className="p-4 border border-secondary-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-secondary-900">{part.name}</p>
                    <p className="text-sm text-secondary-600">SKU: {part.sku}</p>
                  </div>
                  {getStockStatus(part)}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">SKU</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Nome da Peça</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {filteredParts.map((part) => (
                  <tr key={part.id} className="hover:bg-secondary-50">
                    <td className="py-4 px-4 text-sm font-medium text-secondary-900">
                      {part.sku}
                    </td>
                    <td className="py-4 px-4 text-sm text-secondary-600">
                      {part.name}
                    </td>
                    <td className="py-4 px-4">
                      {getStockStatus(part)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredParts.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">Nenhuma peça encontrada</p>
          </div>
        )}

        <div className="flex justify-end pt-4 lg:pt-6 border-t mt-4 lg:mt-6">
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};

const ServiceNoteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  serviceNote?: any;
  vehicles: any[];
  maintenanceTypes: any[];
  mechanics: any[];
  parts: any[];
  onSave: (data: any, partsCart?: PartCartItem[]) => Promise<void>;
}> = ({ isOpen, onClose, serviceNote, vehicles, maintenanceTypes, mechanics, parts, onSave }) => {
  const [isPartsCartOpen, setIsPartsCartOpen] = useState(false);
  const [localPartsCart, setLocalPartsCart] = useState<PartCartItem[]>([]);
  const { serviceOrderParts, addPartsToServiceOrder } = useServiceOrderParts(serviceNote?.id);

  if (!isOpen) return null;

  const handleSave = async (formData: any) => {
    try {
      // Para nova ordem de serviço, passa o carrinho local
      await onSave(formData, !serviceNote ? localPartsCart : undefined);
      setLocalPartsCart([]);
      onClose();
    } catch (error) {
      console.error('Error saving service note:', error);
      toast.error('Erro ao salvar ordem de serviço: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleSavePartsCart = async (cartItems: PartCartItem[]) => {
    if (serviceNote?.id) {
      // Para ordem existente, salva diretamente no banco
      await addPartsToServiceOrder(serviceNote.id, cartItems);
    } else {
      // Para nova ordem, adiciona ao carrinho local
      setLocalPartsCart(prev => {
        const newCart = [...prev];
        cartItems.forEach(newItem => {
          const existingIndex = newCart.findIndex(item => item.part_id === newItem.part_id);
          if (existingIndex >= 0) {
            newCart[existingIndex] = {
              ...newCart[existingIndex],
              quantity_to_use: newCart[existingIndex].quantity_to_use + newItem.quantity_to_use,
              total_cost: (newCart[existingIndex].quantity_to_use + newItem.quantity_to_use) * newCart[existingIndex].unit_cost
            };
          } else {
            newCart.push(newItem);
          }
        });
        return newCart;
      });
    }
    setIsPartsCartOpen(false);
  };

  const displayPartsCount = serviceNote ? serviceOrderParts.length : localPartsCart.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h2 className="text-lg lg:text-xl font-semibold text-secondary-900">
            {serviceNote ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
          </h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 p-2">
            ×
          </button>
        </div>

        <ServiceNoteForm
          onSubmit={handleSave}
          onCancel={onClose}
          serviceNote={serviceNote}
          vehicles={vehicles}
          maintenanceTypes={maintenanceTypes}
          mechanics={mechanics}
          parts={parts}
          onOpenPartsCart={() => setIsPartsCartOpen(true)}
          partsCount={displayPartsCount}
        />

        <PartsCartModal
          isOpen={isPartsCartOpen}
          onClose={() => setIsPartsCartOpen(false)}
          parts={parts}
          onSaveCart={handleSavePartsCart}
        />
      </div>
    </div>
  );
};

export const Maintenance: React.FC = () => {
  const { serviceNotes, loading, createServiceNote, updateServiceNote, deleteServiceNote } = useServiceNotes();
  const { vehicles } = useVehicles();
  const { maintenanceTypes } = useMaintenanceTypes();
  const { employees } = useEmployees();
  const { parts } = useParts();
  const { addPartsToServiceOrder } = useServiceOrderParts();
  const { 
    statistics: checkinStats, 
    createCheckin, 
    checkOut, 
    uploadSignature,
    getActiveCheckinForServiceNote 
  } = useMaintenanceCheckins();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPartsModalOpen, setIsPartsModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedServiceNote, setSelectedServiceNote] = useState<any>(undefined);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Hook para buscar peças da ordem de serviço selecionada
  const { serviceOrderParts } = useServiceOrderParts(isViewModalOpen && selectedServiceNote ? selectedServiceNote.id : undefined);

  const filteredNotes = serviceNotes.filter(note =>
    note.vehicles?.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.mechanic?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      'Aberta': 'warning',
      'Em Andamento': 'info',
      'Concluída': 'success'
    } as const;

    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      'Baixa': 'secondary',
      'Média': 'warning',
      'Alta': 'error'
    } as const;

    return <Badge variant={variants[priority as keyof typeof variants] || 'secondary'}>{priority}</Badge>;
  };

  const openNotes = filteredNotes.filter(note => note.status !== 'Concluída').length;
  const completedNotes = filteredNotes.filter(note => note.status === 'Concluída').length;
  const lowStockParts = parts.filter(part => part.quantity <= part.min_stock).length;
  const activeCheckins = checkinStats?.active_checkins || 0;

  const handleEdit = (serviceNote: any) => {
    setSelectedServiceNote(serviceNote);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setSelectedServiceNote(undefined);
    setIsModalOpen(true);
  };

  const handleCheckIn = (serviceNote: any) => {
    setSelectedServiceNote(serviceNote);
    setIsCheckInModalOpen(true);
  };

  const handleDelete = (serviceNote: any) => {
    setSelectedServiceNote(serviceNote);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedServiceNote) return;
    
    try {
      await deleteServiceNote(selectedServiceNote.id);
      setIsConfirmDeleteOpen(false);
      toast.success('Ordem de serviço excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting service note:', error);
      toast.error('Erro ao excluir ordem de serviço: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleSave = async (data: any, partsCart?: PartCartItem[]) => {
    try {
      if (selectedServiceNote) {
        await updateServiceNote(selectedServiceNote.id, data);
        toast.success('Ordem de serviço atualizada com sucesso!');
      } else {
        // Criar nova ordem de serviço
        const newServiceNote = await createServiceNote(data);
        
        // Se há peças no carrinho, adicionar após criar a ordem
        if (partsCart && partsCart.length > 0 && newServiceNote) {
          await addPartsToServiceOrder(newServiceNote.id, partsCart);
        }
        
        toast.success('Ordem de serviço criada com sucesso!');
      }
    } catch (error) {
      console.error('Error saving service note:', error);
      toast.error('Erro ao salvar ordem de serviço');
      throw error;
    }
  };

  const handleCreateCheckin = async (data: { mechanic_id: string; notes?: string }) => {
    if (!selectedServiceNote) return;
    
    try {
      await createCheckin({
        service_note_id: selectedServiceNote.id,
        mechanic_id: data.mechanic_id,
        notes: data.notes
      });
      toast.success('Check-in realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao realizar check-in');
      console.error('Error creating checkin:', error);
    }
  };

  const handleCheckOut = async (checkinId: string, notes?: string, signatureUrl?: string) => {
    try {
      await checkOut(checkinId, notes, signatureUrl);
      toast.success('Check-out realizado com sucesso!');
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error('Erro ao realizar check-out: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      throw error;
    }
  };

  // Get mechanic name from employee ID
  const getMechanicName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Não atribuído';
  };

  const handleView = (serviceNote: any) => {
    setSelectedServiceNote(serviceNote);
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
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900">Manutenção</h1>
          <p className="text-secondary-600 mt-1 lg:mt-2">Gerencie as ordens de serviço com sistema de check-in/check-out</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <Button variant="secondary" onClick={() => setIsPartsModalOpen(true)} size="sm" className="w-full sm:w-auto">
            <Package className="h-4 w-4 mr-2" />
            Consultar Estoque
          </Button>
          <Button onClick={handleNew} size="sm" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nova Ordem de Serviço
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Ordens Abertas</p>
                <p className="text-xl lg:text-2xl font-bold text-secondary-900">{openNotes}</p>
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
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Check-ins Ativos</p>
                <p className="text-xl lg:text-2xl font-bold text-secondary-900">{activeCheckins}</p>
                <p className="text-xs text-info-600 mt-1">Em manutenção</p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-info-100 rounded-lg flex items-center justify-center">
                <LogIn className="h-4 w-4 lg:h-6 lg:w-6 text-info-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Concluídas</p>
                <p className="text-xl lg:text-2xl font-bold text-secondary-900">{completedNotes}</p>
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
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Peças em Falta</p>
                <p className="text-xl lg:text-2xl font-bold text-secondary-900">{lowStockParts}</p>
                {lowStockParts > 0 && (
                  <p className="text-xs text-error-600 mt-1">Verificar estoque</p>
                )}
              </div>
              <div className={`h-8 w-8 lg:h-12 lg:w-12 rounded-lg flex items-center justify-center ${lowStockParts > 0 ? 'bg-error-100' : 'bg-success-100'}`}>
                {lowStockParts > 0 ? (
                  <AlertTriangle className="h-4 w-4 lg:h-6 lg:w-6 text-error-600" />
                ) : (
                  <Package className="h-4 w-4 lg:h-6 lg:w-6 text-success-600" />
                )}
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
                  placeholder="Buscar por veículo ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <Button variant="secondary" size="sm" className="w-full sm:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Service Notes List */}
      <Card>
        <CardHeader className="p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-secondary-900">
            Ordens de Serviço ({filteredNotes.length})
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3 p-4">
            {filteredNotes.map((note) => {
              const activeCheckin = getActiveCheckinForServiceNote(note.id);
              const mechanicName = note.mechanic || getMechanicName(note.employee_id);
              
              return (
                <div key={note.id} className="border border-secondary-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-secondary-900">{note.vehicles?.plate || '-'}</p>
                      <p className="text-sm text-secondary-600">{note.maintenance_type}</p>
                    </div>
                    <div className="flex space-x-2">
                      {getPriorityBadge(note.priority)}
                      {getStatusBadge(note.status)}
                    </div>
                  </div>
                  
                  {/* Check-in Status */}
                  <CheckInStatusCard
                    serviceNote={note}
                    activeCheckin={activeCheckin}
                    onCheckIn={() => handleCheckIn(note)}
                    onCheckOut={() => handleCheckIn(note)}
                    className="mb-3"
                  />
                  
                  <p className="text-sm text-secondary-600 mb-3 line-clamp-2">{note.description}</p>
                  <div className="flex justify-between items-center text-xs text-secondary-500">
                    <span>{new Date(note.start_date).toLocaleDateString('pt-BR')}</span>
                    <span>{mechanicName}</span>
                  </div>
                  <div className="flex justify-end mt-3 space-x-2">
                    <button 
                      onClick={() => handleView(note)}
                      className="p-2 text-secondary-400 hover:text-secondary-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit(note)}
                      className="p-2 text-secondary-400 hover:text-secondary-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(note)}
                      className="p-2 text-secondary-400 hover:text-error-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Data</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Veículo</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Tipo</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Descrição</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Mecânico</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Prioridade</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Status</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Check-In</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {filteredNotes.map((note) => {
                  const activeCheckin = getActiveCheckinForServiceNote(note.id);
                  const mechanicName = note.mechanic || getMechanicName(note.employee_id);
                  
                  return (
                    <tr key={note.id} className="hover:bg-secondary-50">
                      <td className="py-4 px-6 text-sm text-secondary-600">
                        {new Date(note.start_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-secondary-900">
                        {note.vehicles?.plate || '-'}
                      </td>
                      <td className="py-4 px-6 text-sm text-secondary-600">
                        {note.maintenance_type}
                      </td>
                      <td className="py-4 px-6 text-sm text-secondary-600 max-w-xs truncate">
                        {note.description}
                      </td>
                      <td className="py-4 px-6 text-sm text-secondary-600">
                        {mechanicName}
                      </td>
                      <td className="py-4 px-6">
                        {getPriorityBadge(note.priority)}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(note.status)}
                      </td>
                      <td className="py-4 px-6">
                        {activeCheckin ? (
                          <div className="flex items-center space-x-2">
                            <Badge variant="info" className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {activeCheckin.mechanic_name}
                            </Badge>
                            <Button
                              size="sm"
                              variant="warning"
                              onClick={() => handleCheckIn(note)}
                            >
                              <LogOut className="h-3 w-3 mr-1" />
                              Check-Out
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleCheckIn(note)}
                          >
                            <LogIn className="h-3 w-3 mr-1" />
                            Check-In
                          </Button>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleView(note)}
                            className="p-1 text-secondary-400 hover:text-secondary-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEdit(note)}
                            className="p-1 text-secondary-400 hover:text-secondary-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(note)}
                            className="p-1 text-secondary-400 hover:text-error-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredNotes.length === 0 && (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">Nenhuma ordem de serviço encontrada</p>
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
              Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.
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

      <PartsInventoryModal
        isOpen={isPartsModalOpen}
        onClose={() => setIsPartsModalOpen(false)}
        parts={parts}
      />

      <CheckInOutModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        serviceNote={selectedServiceNote}
        activeCheckin={getActiveCheckinForServiceNote(selectedServiceNote?.id)}
        mechanics={employees.filter(emp => emp.role === 'Mechanic')}
        onCheckIn={handleCreateCheckin}
        onCheckOut={handleCheckOut}
        onUploadSignature={uploadSignature}
      />

      <ServiceNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceNote={selectedServiceNote}
        vehicles={vehicles}
        maintenanceTypes={maintenanceTypes}
        mechanics={employees}
        parts={parts}
        onSave={handleSave}
      />

      {/* View Service Note Modal */}
      {isViewModalOpen && selectedServiceNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-secondary-900">
                Detalhes da Ordem de Serviço
              </h2>
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
                      <span className="text-secondary-600">Veículo:</span>
                      <span className="font-medium">
                        {selectedServiceNote.vehicles?.plate} - {selectedServiceNote.vehicles?.model}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Tipo:</span>
                      <span className="font-medium">{selectedServiceNote.maintenance_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Status:</span>
                      <span>{getStatusBadge(selectedServiceNote.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Prioridade:</span>
                      <span>{getPriorityBadge(selectedServiceNote.priority)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-secondary-900 mb-3">Datas</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Início:</span>
                      <span className="font-medium">
                        {new Date(selectedServiceNote.start_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {selectedServiceNote.end_date && (
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Conclusão:</span>
                        <span className="font-medium">
                          {new Date(selectedServiceNote.end_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedServiceNote.mileage && (
                  <div className="bg-secondary-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-secondary-900 mb-3">Quilometragem</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600">Registrada:</span>
                      <span className="font-medium">{selectedServiceNote.mileage.toLocaleString('pt-BR')} km</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Descrição e Observações */}
              <div className="space-y-4">
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-secondary-900 mb-3">Descrição</h4>
                  <p className="text-secondary-700 whitespace-pre-wrap">
                    {selectedServiceNote.description}
                  </p>
                </div>

                {selectedServiceNote.observations && (
                  <div className="bg-secondary-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-secondary-900 mb-3">Observações</h4>
                    <p className="text-secondary-700 whitespace-pre-wrap">
                      {selectedServiceNote.observations}
                    </p>
                  </div>
                )}

                <div className="bg-secondary-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-secondary-900 mb-3">Responsável</h4>
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-secondary-900">
                        {selectedServiceNote.mechanic}
                      </p>
                      <p className="text-sm text-secondary-600">Mecânico Responsável</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Peças Utilizadas */}
            {serviceOrderParts && serviceOrderParts.length > 0 && (
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Peças Utilizadas ({serviceOrderParts.length})
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full border border-secondary-200 rounded-lg">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">SKU</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Peça</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Quantidade</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Valor Unit.</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-200">
                      {serviceOrderParts.map((part) => (
                        <tr key={part.id} className="hover:bg-secondary-50">
                          <td className="py-3 px-4 text-sm font-medium text-secondary-900">
                            {part.parts?.sku || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm text-secondary-700">
                            {part.parts?.name || 'Peça não encontrada'}
                          </td>
                          <td className="py-3 px-4 text-sm text-secondary-700">
                            {part.quantity_used}
                          </td>
                          <td className="py-3 px-4 text-sm text-secondary-700">
                            R$ {part.unit_cost_at_time.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-secondary-900">
                            R$ {part.total_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-secondary-50">
                      <tr>
                        <td colSpan={4} className="py-3 px-4 text-sm font-medium text-secondary-900 text-right">
                          Total Geral:
                        </td>
                        <td className="py-3 px-4 text-sm font-bold text-primary-600">
                          R$ {serviceOrderParts.reduce((sum, part) => sum + part.total_cost, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Quando não há peças */}
            {serviceOrderParts && serviceOrderParts.length === 0 && (
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Peças Utilizadas
                </h3>
                <div className="text-center py-4 text-secondary-500">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhuma peça foi utilizada nesta ordem de serviço</p>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6 space-x-4">
              <Button 
                variant="secondary" 
                onClick={() => setIsViewModalOpen(false)}
              >
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEdit(selectedServiceNote);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;