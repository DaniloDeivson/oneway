import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { Calendar, Car, User, Loader2, Package, AlertTriangle, ShoppingCart, Wrench } from 'lucide-react';
import { ResponsibleField } from '../UI/ResponsibleField';
import { useAuth } from '../../hooks/useAuth';
import { PartCartItem } from '../../hooks/useServiceOrderParts';

interface ServiceNoteFormProps {
  onSubmit: (data: any, partsCart?: PartCartItem[]) => Promise<void>;
  onCancel: () => void;
  serviceNote?: any;
  vehicles: any[];
  maintenanceTypes: any[];
  mechanics: any[];
  parts: any[];
  onOpenPartsCart: () => void;
  partsCount: number;
}

export const ServiceNoteForm: React.FC<ServiceNoteFormProps> = ({
  onSubmit,
  onCancel,
  serviceNote,
  vehicles,
  maintenanceTypes,
  mechanics,
  parts,
  onOpenPartsCart,
  partsCount
}) => {
  const { user, hasPermission, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: serviceNote?.vehicle_id || '',
    maintenance_type: serviceNote?.maintenance_type || '',
    start_date: serviceNote?.start_date || new Date().toISOString().split('T')[0],
    end_date: serviceNote?.end_date || '',
    mechanic: serviceNote?.mechanic || '',
    employee_id: serviceNote?.employee_id || '',
    priority: serviceNote?.priority || 'Média',
    mileage: serviceNote?.mileage || 0,
    description: serviceNote?.description || '',
    observations: serviceNote?.observations || '',
    status: serviceNote?.status || 'Aberta'
  });

  // Filter mechanics to only show employees with Mechanic role
  const mechanicEmployees = mechanics.filter(emp => emp.role === 'Mechanic' && emp.active);
  
  // Auto-fill employee_id with current user if they have maintenance permission
  useEffect(() => {
    if (!serviceNote && hasPermission('maintenance') && user && !formData.employee_id) {
      // Check if current user is a mechanic
      const isMechanic = mechanicEmployees.some(emp => emp.id === user.id);
      if (isMechanic || isAdmin) {
        setFormData(prev => ({ ...prev, employee_id: user.id }));
      }
    }
  }, [serviceNote, user, hasPermission, mechanicEmployees, formData.employee_id, isAdmin]);

  // Update mechanic name when employee_id changes
  useEffect(() => {
    if (formData.employee_id) {
      const selectedMechanic = mechanics.find(m => m.id === formData.employee_id);
      if (selectedMechanic) {
        setFormData(prev => ({ ...prev, mechanic: selectedMechanic.name }));
      }
    }
  }, [formData.employee_id, mechanics]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.vehicle_id) {
      alert('Por favor, selecione um veículo antes de salvar a ordem de serviço.');
      return;
    }
    
    if (!formData.maintenance_type) {
      alert('Por favor, selecione um tipo de manutenção.');
      return;
    }
    
    if (!formData.description) {
      alert('Por favor, forneça uma descrição para a ordem de serviço.');
      return;
    }
    
    if (!formData.mechanic) {
      alert('Por favor, informe o nome do mecânico responsável.');
      return;
    }
    
    setLoading(true);
    try {
      const processedData = {
        ...formData,
        mileage: formData.mileage ? parseInt(formData.mileage.toString()) : null,
        end_date: formData.end_date === '' ? null : formData.end_date,
        observations: formData.observations === '' ? null : formData.observations
      };

      await onSubmit(processedData);
      onCancel();
    } catch (error) {
      console.error('Error saving service note:', error);
      alert('Erro ao salvar ordem de serviço. Verifique se todos os campos obrigatórios estão preenchidos.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'mileage' ? Number(value) || 0 : value
    }));
  };

  const handleMechanicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const employeeId = e.target.value;
    const selectedMechanic = mechanics.find(m => m.id === employeeId);
    
    setFormData(prev => ({
      ...prev,
      employee_id: employeeId,
      mechanic: selectedMechanic ? selectedMechanic.name : ''
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
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
          >
            <option value="">Selecione um veículo</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.plate} - {vehicle.model}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Tipo de Manutenção *
          </label>
          <select
            name="maintenance_type"
            value={formData.maintenance_type}
            onChange={handleChange}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="">Selecione o tipo</option>
            {maintenanceTypes.map(type => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Data de Início *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Data de Conclusão
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              min={formData.start_date}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Mecânico Responsável *
          </label>
          <select
            value={formData.employee_id}
            onChange={handleMechanicChange}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="">Selecione um mecânico</option>
            {mechanicEmployees.map(mechanic => (
              <option key={mechanic.id} value={mechanic.id}>
                {mechanic.name} {mechanic.employee_code && `(${mechanic.employee_code})`}
              </option>
            ))}
          </select>
          {mechanicEmployees.length === 0 && (
            <p className="text-xs text-error-600 mt-1">
              Nenhum mecânico cadastrado. Adicione mecânicos no painel de funcionários.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Prioridade *
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="Baixa">Baixa</option>
            <option value="Média">Média</option>
            <option value="Alta">Alta</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Quilometragem
          </label>
          <input
            type="number"
            name="mileage"
            value={formData.mileage}
            onChange={handleChange}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="0"
            placeholder="0"
          />
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
          >
            <option value="Aberta">Aberta</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Concluída">Concluída</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Descrição *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Descreva o serviço a ser realizado..."
          required
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
        />
      </div>

      {/* Parts Section */}
      <div className="border-t pt-4 lg:pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Peças {serviceNote ? 'Utilizadas' : 'a Utilizar'} ({partsCount})
          </h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpenPartsCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {serviceNote ? 'Adicionar Peças' : 'Selecionar Peças'}
          </Button>
        </div>

        {partsCount > 0 ? (
          <div className="bg-secondary-50 p-3 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-secondary-600">Total de peças:</span>
              <span className="font-medium">{partsCount}</span>
            </div>
            
            <div className="bg-info-50 border border-info-200 rounded-lg p-3 mt-3">
              <div className="flex items-start">
                <Wrench className="h-5 w-5 text-info-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-info-800">
                    Integração com Estoque
                  </p>
                  <p className="text-xs text-info-700 mt-1">
                    As peças selecionadas serão automaticamente deduzidas do estoque e um custo será gerado para cada peça utilizada.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-secondary-500">
            <Package className="h-8 w-8 mx-auto mb-2" />
            <p>Nenhuma peça {serviceNote ? 'adicionada ainda' : 'selecionada'}</p>
            <p className="text-sm mt-1">Use o botão acima para adicionar peças à manutenção</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 lg:pt-6 border-t">
        <Button variant="secondary" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {serviceNote ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}
        </Button>
      </div>
    </form>
  );
};

export default ServiceNoteForm;