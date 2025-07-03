import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { Calendar, DollarSign, Car, User, Loader2, AlertTriangle, Gauge } from 'lucide-react';
import { ResponsibleField } from '../UI/ResponsibleField';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface ContractFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  contract?: any;
  customers: any[];
  employees: any[];
  getAvailableVehicles: (startDate: string, endDate: string) => Promise<any[]>;
  loading?: boolean;
}

export const ContractForm: React.FC<ContractFormProps> = ({
  onSubmit,
  onCancel,
  contract,
  customers,
  employees,
  getAvailableVehicles,
  loading = false
}) => {
  const { user, isAdmin, isManager, hasPermission } = useAuth();
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: contract?.customer_id || '',
    vehicle_id: contract?.vehicle_id || '',
    start_date: contract?.start_date || '',
    end_date: contract?.end_date || '',
    daily_rate: contract?.daily_rate || 0,
    status: contract?.status || 'Ativo',
    salesperson_id: contract?.salesperson_id || '',
    km_limit: contract?.km_limit || 0,
    price_per_excess_km: contract?.price_per_excess_km || 0,
    price_per_liter: contract?.price_per_liter || 0
  });
  const [conflicts, setConflicts] = useState<any>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      alert('A data de início não pode ser posterior à data de término.');
      return;
    }
    
    // Validate vehicle availability
    if (!contract) {
      setLoadingVehicles(true);
      try {
        const conflicts = await checkVehicleAvailability();
        if (conflicts.has_conflict) {
          setConflicts(conflicts);
          return;
        }
      } finally {
        setLoadingVehicles(false);
      }
    }
    
    await onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['daily_rate', 'km_limit', 'price_per_excess_km', 'price_per_liter'].includes(name) 
        ? Number(value) || 0 
        : value
    }));
    
    // Clear conflicts when form changes
    if (conflicts) {
      setConflicts(null);
    }
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Clear conflicts
    setConflicts(null);

    // Se ambas as datas estão preenchidas, buscar veículos disponíveis
    if (newFormData.start_date && newFormData.end_date && newFormData.start_date <= newFormData.end_date) {
      setLoadingVehicles(true);
      try {
        const vehicles = await getAvailableVehicles(newFormData.start_date, newFormData.end_date);
        setAvailableVehicles(vehicles);
        
        // Se o veículo atual não está disponível, limpar seleção
        if (newFormData.vehicle_id && !vehicles.find(v => v.id === newFormData.vehicle_id)) {
          setFormData(prev => ({ ...prev, vehicle_id: '' }));
        }
      } catch (error) {
        console.error('Error fetching available vehicles:', error);
      } finally {
        setLoadingVehicles(false);
      }
    }
  };

  const checkVehicleAvailability = async () => {
    if (!formData.vehicle_id || !formData.start_date || !formData.end_date) {
      return { has_conflict: false, conflicting_contracts: [] };
    }
    
    try {
      // Call the API to check for conflicts
      const { data, error } = await supabase.rpc('fn_check_contract_conflicts', {
        p_vehicle_id: formData.vehicle_id,
        p_start_date: formData.start_date,
        p_end_date: formData.end_date,
        p_contract_id: contract?.id || null
      });
      
      if (error) throw error;
      return data || { has_conflict: false, conflicting_contracts: [] };
    } catch (error) {
      console.error('Error checking vehicle availability:', error);
      return { has_conflict: false, conflicting_contracts: [] };
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

  const totalValue = calculateDays() * formData.daily_rate;

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

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Veículo * {loadingVehicles && <span className="text-xs text-secondary-500">(Carregando...)</span>}
          </label>
          <div className="relative">
            <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <select
              name="vehicle_id"
              value={formData.vehicle_id}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={loadingVehicles || !formData.start_date || !formData.end_date}
            >
              <option value="">
                {!formData.start_date || !formData.end_date 
                  ? 'Selecione as datas primeiro' 
                  : 'Selecione um veículo disponível'
                }
              </option>
              {availableVehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate} - {vehicle.model} ({vehicle.year})
                </option>
              ))}
            </select>
          </div>
          {formData.start_date && formData.end_date && availableVehicles.length === 0 && !loadingVehicles && (
            <p className="text-sm text-error-600 mt-1">
              Nenhum veículo disponível no período selecionado
            </p>
          )}
        </div>
      </div>

      {/* Pricing section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      {/* Conflict Warning */}
      {conflicts && conflicts.has_conflict && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-error-600 mr-2 mt-0.5" />
            <div>
              <p className="text-error-800 font-medium">Conflito de Agendamento Detectado</p>
              <p className="text-error-700 text-sm mt-1">
                Este veículo já está reservado para o período selecionado. Por favor, escolha outro veículo ou altere as datas.
              </p>
              <div className="mt-2 space-y-1">
                {conflicts.conflicting_contracts.map((contract: any, index: number) => (
                  <div key={index} className="text-sm text-error-700">
                    • Cliente: {contract.customer_name} | 
                    Período: {new Date(contract.start_date).toLocaleDateString('pt-BR')} a {new Date(contract.end_date).toLocaleDateString('pt-BR')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumo do Contrato */}
      {formData.start_date && formData.end_date && formData.daily_rate > 0 && (
        <div className="bg-secondary-50 p-4 rounded-lg">
          <h3 className="font-semibold text-secondary-900 mb-3">Resumo do Contrato</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-secondary-600">Período:</span>
              <p className="font-medium">{calculateDays()} dias</p>
            </div>
            <div>
              <span className="text-secondary-600">Valor Diário:</span>
              <p className="font-medium">R$ {formData.daily_rate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <span className="text-secondary-600">Valor Total:</span>
              <p className="font-bold text-lg text-primary-600">
                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 lg:pt-6 border-t">
        <Button variant="secondary" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={loading || loadingVehicles || (conflicts && conflicts.has_conflict)} 
          className="w-full sm:w-auto"
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {contract ? 'Salvar Alterações' : 'Criar Contrato'}
        </Button>
      </div>
    </form>
  );
};

export default ContractForm;