import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { Calendar, DollarSign, Car, Loader2, Gauge, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useVehicles } from '../../hooks/useVehicles';
import { useContracts } from '../../hooks/useContracts';
import { MultipleVehicleSelector } from './MultipleVehicleSelector';
import { Database } from '../../types/database';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];

interface AvailableVehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  type: string;
  status: string;
}

// Definir tipos explícitos para os dados do contrato, cliente e funcionário
interface Customer {
  id: string;
  name: string;
  document: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

interface ContractVehicleData {
  vehicle_id: string;
  daily_rate?: number;
}

interface ContractFormData {
  customer_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  daily_rate: number;
  status: string;
  salesperson_id: string;
  km_limit?: number;
  price_per_excess_km?: number;
  price_per_liter?: number;
  uses_multiple_vehicles?: boolean;
  vehicles?: ContractVehicleData[];
}

interface ContractFormProps {
  onSubmit: (data: ContractFormData) => Promise<void>;
  onCancel: () => void;
  contract?: Partial<ContractFormData> & {
    id?: string;
    contract_vehicles?: Array<{
      vehicle_id: string;
      daily_rate: number | null;
    }>;
  };
  customers: Customer[];
  employees: Employee[];
  loading?: boolean;
}

export const ContractForm: React.FC<ContractFormProps> = ({
  onSubmit,
  onCancel,
  contract,
  customers,
  employees,
  loading = false
}) => {
  const { user, isAdmin, isManager, hasPermission } = useAuth();
  const { vehicles, loading: loadingAllVehicles } = useVehicles();
  const { getAvailableVehicles, checkContractConflicts } = useContracts();
  const [availableVehicles, setAvailableVehicles] = useState<AvailableVehicle[]>([]);
  const [loadingAvailableVehicles, setLoadingAvailableVehicles] = useState(false);
  const [useMultipleVehicles, setUseMultipleVehicles] = useState(
    contract?.uses_multiple_vehicles || false
  );
  const [selectedVehicles, setSelectedVehicles] = useState<ContractVehicleData[]>(() => {
    if (contract?.contract_vehicles && contract.contract_vehicles.length > 0) {
      return contract.contract_vehicles.map(cv => ({
        vehicle_id: cv.vehicle_id,
        daily_rate: cv.daily_rate || 0
      }));
    }
    if (contract?.vehicle_id) {
      return [{
        vehicle_id: contract.vehicle_id,
        daily_rate: contract.daily_rate || 0
      }];
    }
    return [];
  });

  const [formData, setFormData] = useState<ContractFormData>({
    customer_id: contract?.customer_id || '',
    vehicle_id: contract?.vehicle_id || '',
    start_date: contract?.start_date || '',
    end_date: contract?.end_date || '',
    daily_rate: contract?.daily_rate || 0,
    status: contract?.status || 'Ativo',
    salesperson_id: contract?.salesperson_id || '',
    km_limit: contract?.km_limit || 0,
    price_per_excess_km: contract?.price_per_excess_km || 0,
    price_per_liter: contract?.price_per_liter || 0,
    uses_multiple_vehicles: useMultipleVehicles
  });

  // Filter employees to only show Sales role or Admin/Manager
  const salespeople = employees.filter(emp => 
    (emp.role === 'Sales' || emp.role === 'Admin' || emp.role === 'Manager') && emp.active
  );
  
  // Auto-fill salesperson_id with current user if they have contracts permission
  useEffect(() => {
    if (!contract && (hasPermission('contracts') || isAdmin || isManager) && user && !formData.salesperson_id) {
      // Check if current user is a salesperson, admin, or manager
      const canCreateContract = salespeople.some(emp => emp.id === user.id);
      if (canCreateContract) {
        setFormData(prev => ({ ...prev, salesperson_id: user.id }));
      }
    }
  }, [contract, user, hasPermission, isAdmin, isManager, salespeople, formData.salesperson_id]);

  // Fetch available vehicles when component loads if dates are already set
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      fetchAvailableVehicles(formData.start_date, formData.end_date);
    }
  }, []);  // Apenas na inicialização

  // Update form data when multiple vehicles toggle changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      uses_multiple_vehicles: useMultipleVehicles
    }));
  }, [useMultipleVehicles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas (datas obrigatórias)
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      alert('A data de início não pode ser posterior à data de término.');
      return;
    }

    // Validar veículos
    if (useMultipleVehicles) {
      if (selectedVehicles.length === 0) {
        alert('Selecione pelo menos um veículo.');
        return;
      }
      
      // Validate that all vehicles have rates
      const hasInvalidRates = selectedVehicles.some(v => !v.daily_rate || v.daily_rate <= 0);
      if (hasInvalidRates) {
        alert('Todos os veículos devem ter um valor diário válido.');
        return;
      }

      // Verificar conflitos de data para múltiplos veículos
      const vehicleIds = selectedVehicles.map(v => v.vehicle_id);
      const conflicts = await checkContractConflicts(
        vehicleIds, 
        formData.start_date, 
        formData.end_date, 
        contract?.id
      );
      
      if (conflicts.has_conflict) {
        alert('Um ou mais veículos não estão disponíveis no período selecionado. Há conflitos com outros contratos.');
        return;
      }
    } else {
      if (!formData.vehicle_id) {
        alert('Selecione um veículo.');
        return;
      }

      // Verificar conflitos de data para veículo único  
      const conflicts = await checkContractConflicts(
        [formData.vehicle_id], 
        formData.start_date, 
        formData.end_date,
        contract?.id
      );
      
      if (conflicts.has_conflict) {
        alert('Veículo não disponível no período selecionado. Há conflitos com outros contratos.');
        return;
      }
    }

    const submitData: ContractFormData = {
      ...formData,
      vehicles: useMultipleVehicles ? selectedVehicles : undefined
    };

    await onSubmit(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['daily_rate', 'km_limit', 'price_per_excess_km', 'price_per_liter'].includes(name) 
        ? Number(value) || 0 
        : value
    }));
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    
    // Se ambas as datas estão preenchidas, buscar veículos disponíveis
    if (newFormData.start_date && newFormData.end_date) {
      await fetchAvailableVehicles(newFormData.start_date, newFormData.end_date);
    }
  };

  const fetchAvailableVehicles = async (startDate: string, endDate: string) => {
    try {
      setLoadingAvailableVehicles(true);
      const available = await getAvailableVehicles(startDate, endDate, contract?.id);
      setAvailableVehicles(available);
    } catch (error) {
      console.error('Erro ao buscar veículos disponíveis:', error);
      setAvailableVehicles([]);
    } finally {
      setLoadingAvailableVehicles(false);
    }
  };

  const handleVehicleToggle = (useMultiple: boolean) => {
    setUseMultipleVehicles(useMultiple);
    
    if (useMultiple) {
      // Convert single vehicle to multiple vehicles
      if (formData.vehicle_id && formData.daily_rate > 0) {
        setSelectedVehicles([{
          vehicle_id: formData.vehicle_id,
          daily_rate: formData.daily_rate
        }]);
      }
    } else {
      // Convert multiple vehicles to single vehicle
      if (selectedVehicles.length > 0) {
        setFormData(prev => ({
          ...prev,
          vehicle_id: selectedVehicles[0].vehicle_id,
          daily_rate: selectedVehicles[0].daily_rate || 0
        }));
      }
    }
  };

  const calculateDays = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const calculateTotalValue = () => {
    const days = calculateDays();
    if (useMultipleVehicles) {
      return selectedVehicles.reduce((total, vehicle) => {
        return total + (vehicle.daily_rate || 0) * days;
      }, 0);
    }
    return days * formData.daily_rate;
  };

  const totalValue = calculateTotalValue();

  return (
    <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
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
                {customer.name} - {customer.document}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Vendedor Responsável *
          </label>
          <select
            name="salesperson_id"
            value={formData.salesperson_id}
            onChange={handleChange}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
            disabled={!isAdmin && !isManager && formData.salesperson_id === user?.id}
          >
            <option value="">Selecione um vendedor</option>
            {salespeople.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.name} {employee.role === 'Admin' ? '(Admin)' : employee.role === 'Manager' ? '(Gerente)' : '(Vendedor)'}
              </option>
            ))}
          </select>
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
            <option value="Ativo">Ativo</option>
            <option value="Finalizado">Finalizado</option>
            <option value="Cancelado">Cancelado</option>
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
              onChange={handleDateChange}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Data de Término *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleDateChange}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              min={formData.start_date}
              required
            />
          </div>
        </div>
      </div>

      {/* Vehicle Selection Mode Toggle */}
      <div className="bg-secondary-50 p-4 rounded-lg">
        <h3 className="font-semibold text-secondary-900 mb-3">Configuração de Veículos</h3>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="vehicleMode"
              checked={!useMultipleVehicles}
              onChange={() => handleVehicleToggle(false)}
              className="mr-2"
            />
            <Car className="h-4 w-4 mr-1" />
            Veículo Único
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="vehicleMode"
              checked={useMultipleVehicles}
              onChange={() => handleVehicleToggle(true)}
              className="mr-2"
            />
            <Users className="h-4 w-4 mr-1" />
            Múltiplos Veículos
          </label>
        </div>
      </div>

      {/* Single Vehicle Selection */}
      {!useMultipleVehicles && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Veículo * {(loadingAllVehicles || loadingAvailableVehicles) && <span className="text-xs text-secondary-500">(Carregando...)</span>}
            </label>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <select
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={loadingAllVehicles}
              >
                <option value="">
                  {(loadingAllVehicles || loadingAvailableVehicles) ? 'Carregando veículos...' : 
                   (formData.start_date && formData.end_date && availableVehicles.length === 0) ? 
                   'Nenhum veículo disponível no período' : 
                   'Selecione um veículo da frota'}
                </option>
                {(availableVehicles.length > 0 && formData.start_date && formData.end_date ? 
                  availableVehicles : 
                  vehicles.filter(v => v.status === 'Disponível')
                ).map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.model} ({vehicle.year}) - {vehicle.status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Valor Diário (R$) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="number"
                name="daily_rate"
                value={formData.daily_rate}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* Multiple Vehicle Selection */}
      {useMultipleVehicles && (
        <MultipleVehicleSelector
          vehicles={vehicles}
          selectedVehicles={selectedVehicles}
          onVehiclesChange={setSelectedVehicles}
          defaultDailyRate={formData.daily_rate}
          disabled={loadingAllVehicles || loadingAvailableVehicles}
          startDate={formData.start_date}
          endDate={formData.end_date}
          availableVehicles={availableVehicles.length > 0 ? availableVehicles : undefined}
        />
      )}

      {/* Pricing section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Limite de Km
          </label>
          <div className="relative">
            <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="number"
              name="km_limit"
              value={formData.km_limit}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              step="1"
              min="0"
              placeholder="Km incluídos no contrato"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Valor por Km Excedente (R$)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="number"
              name="price_per_excess_km"
              value={formData.price_per_excess_km}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              step="0.01"
              min="0"
              placeholder="Valor por km adicional"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Valor por Litro de Combustível (R$)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="number"
              name="price_per_liter"
              value={formData.price_per_liter}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              step="0.01"
              min="0"
              placeholder="Valor por litro faltante"
            />
          </div>
        </div>
      </div>

      {/* Resumo do Contrato */}
      {formData.start_date && formData.end_date && (
        ((!useMultipleVehicles && formData.daily_rate > 0) || 
         (useMultipleVehicles && selectedVehicles.length > 0)) && (
        <div className="bg-secondary-50 p-4 rounded-lg">
          <h3 className="font-semibold text-secondary-900 mb-3">Resumo do Contrato</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-secondary-600">Período:</span>
              <p className="font-medium">{calculateDays()} dias</p>
            </div>
            <div>
              <span className="text-secondary-600">Veículos:</span>
              <p className="font-medium">
                {useMultipleVehicles ? `${selectedVehicles.length} veículos` : '1 veículo'}
              </p>
            </div>
            <div>
              <span className="text-secondary-600">Valor Médio/Dia:</span>
              <p className="font-medium">
                R$ {useMultipleVehicles 
                  ? (selectedVehicles.reduce((sum, v) => sum + (v.daily_rate || 0), 0) / selectedVehicles.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                  : formData.daily_rate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                }
              </p>
            </div>
            <div>
              <span className="text-secondary-600">Valor Total:</span>
              <p className="font-bold text-lg text-primary-600">
                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          {/* Show vehicle breakdown for multiple vehicles */}
          {useMultipleVehicles && selectedVehicles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-secondary-200">
              <h4 className="font-medium text-secondary-900 mb-2">Detalhamento por Veículo:</h4>
              <div className="space-y-2">
                {selectedVehicles.map((vehicle) => {
                  const vehicleInfo = vehicles.find(v => v.id === vehicle.vehicle_id);
                  const vehicleTotal = (vehicle.daily_rate || 0) * calculateDays();
                  
                  return (
                    <div key={vehicle.vehicle_id} className="flex justify-between items-center text-sm">
                      <span className="text-secondary-600">
                        {vehicleInfo ? `${vehicleInfo.plate} - ${vehicleInfo.model}` : 'Veículo não encontrado'}
                      </span>
                      <span className="font-medium">
                        R$ {(vehicle.daily_rate || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/dia × {calculateDays()} dias = R$ {vehicleTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )
      )}

      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 lg:pt-6 border-t">
        <Button variant="secondary" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={loadingAllVehicles} 
          className="w-full sm:w-auto"
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          {contract ? 'Salvar Alterações' : 'Criar Contrato'}
        </Button>
      </div>
    </form>
  );
};

export default ContractForm;