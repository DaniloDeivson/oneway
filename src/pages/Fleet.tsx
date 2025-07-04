import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { useVehicles } from '../hooks/useVehicles';
import { useCosts } from '../hooks/useCosts';
import { useContracts } from '../hooks/useContracts';
import { useAuth } from '../hooks/useAuth';
import { Plus, Search, Filter, Car, DollarSign, Loader2, Edit, Eye, Trash2, Gauge, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { Database } from '../types/database';
import { supabase } from '../lib/supabase';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Contract = Database['public']['Tables']['contracts']['Row'];

// Tipos para ordenação
type SortField = 'plate' | 'model' | 'year' | 'status' | 'totalCost' | 'location' | 'total_mileage' | 'initial_mileage';
type SortDirection = 'asc' | 'desc';

interface VehicleWithCosts extends Omit<Vehicle, 'mileage'> {
  totalCost: number;
  actualStatus: 'Disponível' | 'Manutenção' | 'Em Uso' | 'Inativo';
  contractInfo?: Contract;
  total_mileage: number;
  mileage: number;
  tank_capacity: number;
  initial_mileage: number;
}

interface VehicleFormData {
  plate: string;
  model: string;
  year: number;
  type: 'Furgão' | 'Van';
  color: string | null;
  fuel: 'Diesel' | 'Gasolina' | 'Elétrico' | null;
  category: string;
  chassis: string | null;
  renavam: string | null;
  cargo_capacity: number | null;
  location: string | null;
  acquisition_date: string | null;
  acquisition_value: number | null;
  status: 'Disponível' | 'Em Uso' | 'Manutenção' | 'Inativo';
  mileage: number;
  initial_mileage: number;
  tank_capacity: number;
}

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: VehicleWithCosts;
  onSave: (data: Partial<VehicleFormData>) => Promise<void>;
}

interface VehicleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: VehicleWithCosts;
  costs: Array<Database['public']['Tables']['costs']['Row']>;
}

// Modal para editar/adicionar veículo
const VehicleModal: React.FC<VehicleModalProps> = ({ isOpen, onClose, vehicle, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<VehicleFormData>({
    plate: vehicle?.plate || '',
    model: vehicle?.model || '',
    year: vehicle?.year || new Date().getFullYear(),
    type: vehicle?.type || 'Furgão',
    color: vehicle?.color || null,
    fuel: vehicle?.fuel || 'Diesel',
    category: vehicle?.category || '',
    chassis: vehicle?.chassis || null,
    renavam: vehicle?.renavam || null,
    cargo_capacity: vehicle?.cargo_capacity || null,
    location: vehicle?.location || null,
    acquisition_date: vehicle?.acquisition_date || null,
    acquisition_value: vehicle?.acquisition_value || null,
    status: vehicle?.status || 'Disponível',
    mileage: vehicle?.mileage || 0,
    initial_mileage: vehicle?.initial_mileage || vehicle?.mileage || 0,
    tank_capacity: vehicle?.tank_capacity || 0
  });

  // Buscar quilometragem total do veículo
  const [totalMileage, setTotalMileage] = useState<number>(vehicle?.total_mileage || 0);

  const { user } = useAuth();

  useEffect(() => {
    if (vehicle?.id) {
      // Buscar quilometragem total
      supabase
        .rpc('fn_calculate_vehicle_total_mileage', { p_vehicle_id: vehicle.id })
        .then(({ data, error }) => {
          if (!error && data) {
            setTotalMileage(data);
          }
        });
    }
  }, [vehicle]);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        plate: vehicle.plate || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        type: vehicle.type || 'Furgão',
        color: vehicle.color || null,
        fuel: vehicle.fuel || 'Diesel',
        category: vehicle.category || '',
        chassis: vehicle.chassis || null,
        renavam: vehicle.renavam || null,
        cargo_capacity: vehicle.cargo_capacity || null,
        location: vehicle.location || null,
        acquisition_date: vehicle.acquisition_date || null,
        acquisition_value: vehicle.acquisition_value || null,
        status: vehicle.status || 'Disponível',
        mileage: vehicle.mileage || 0,
        initial_mileage: vehicle.initial_mileage || vehicle.mileage || 0,
        tank_capacity: vehicle.tank_capacity || 0
      });
    } else {
      // Reset form for new vehicle
      setFormData({
        plate: '',
        model: '',
        year: new Date().getFullYear(),
        type: 'Furgão',
        color: null,
        fuel: 'Diesel',
        category: '',
        chassis: null,
        renavam: null,
        cargo_capacity: null,
        location: null,
        acquisition_date: null,
        acquisition_value: null,
        status: 'Disponível',
        mileage: 0,
        initial_mileage: 0,
        tank_capacity: 0
      });
    }
  }, [vehicle]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.initial_mileage < 0) {
        toast.error('A quilometragem inicial não pode ser negativa!');
        setLoading(false);
        return;
      }
      if (!user) {
        toast.error('Usuário não autenticado!');
        setLoading(false);
        return;
      }
      const tenant_id = user.tenant_id || '';
      if (!tenant_id) {
        toast.error('tenant_id não encontrado para o usuário!');
        setLoading(false);
        return;
      }
            const submitData = {
        ...formData,
        year: Number(formData.year),
        cargo_capacity: formData.cargo_capacity !== null && formData.cargo_capacity !== undefined ? Number(formData.cargo_capacity) : 0,
        acquisition_value: formData.acquisition_value !== null && formData.acquisition_value !== undefined ? Number(formData.acquisition_value) : 0,
        color: formData.color && formData.color.trim() !== '' ? formData.color : null,
        chassis: formData.chassis && formData.chassis.trim() !== '' ? formData.chassis : null,
        renavam: formData.renavam && formData.renavam.trim() !== '' ? formData.renavam : null,
        location: formData.location && formData.location.trim() !== '' ? formData.location : null,
        acquisition_date: formData.acquisition_date && formData.acquisition_date.trim() !== '' ? formData.acquisition_date : null,
        tank_capacity: formData.tank_capacity !== null && formData.tank_capacity !== undefined ? Number(formData.tank_capacity) : 0,
        // Usar initial_mileage do formulário e preservar mileage existente para edições
        initial_mileage: formData.initial_mileage,
        // Para novos veículos, definir mileage igual ao initial_mileage
        // Para edições, não alterar o mileage existente
        ...(vehicle ? {} : { mileage: formData.initial_mileage }),
        // Só incluir tenant_id para novos veículos
        ...(vehicle ? {} : { tenant_id })
      };
      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error('Erro ao salvar veículo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['year', 'cargo_capacity', 'acquisition_value', 'mileage', 'initial_mileage', 'tank_capacity'].includes(name) 
        ? Number(value) || 0 
        : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h2 className="text-lg lg:text-xl font-semibold text-secondary-900">
            {vehicle ? 'Editar Veículo' : 'Novo Veículo'}
          </h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 p-2">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Placa *
              </label>
              <input
                type="text"
                name="plate"
                value={formData.plate ?? ''}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="ABC1234"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Modelo *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model ?? ''}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Fiat Ducato"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Ano *
              </label>
              <input
                type="number"
                name="year"
                value={formData.year ?? 0}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="2000"
                max={new Date().getFullYear() + 1}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Tipo *
              </label>
              <select
                name="type"
                value={formData.type ?? ''}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="Furgão">Furgão</option>
                <option value="Van">Van</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Cor
              </label>
              <input
                type="text"
                name="color"
                value={formData.color ?? ''}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Branco"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Combustível
              </label>
              <select
                name="fuel"
                value={formData.fuel ?? ''}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Diesel">Diesel</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Elétrico">Elétrico</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Categoria *
              </label>
              <input
                type="text"
                name="category"
                value={formData.category ?? ''}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Carga/Passageiros"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Chassi
              </label>
              <input
                type="text"
                name="chassis"
                value={formData.chassis ?? ''}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="9BWHE21JX24060960"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                RENAVAM
              </label>
              <input
                type="text"
                name="renavam"
                value={formData.renavam ?? ''}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="00123456789"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Capacidade de Carga (kg)
              </label>
              <input
                type="number"
                name="cargo_capacity"
                value={formData.cargo_capacity ?? ''}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Localização
              </label>
              <input
                type="text"
                name="location"
                value={formData.location ?? ''}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="São Paulo - SP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status ?? ''}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="Disponível">Disponível</option>
                <option value="Em Uso">Em Uso</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Quilometragem Inicial (km) *
              </label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="number"
                  name="initial_mileage"
                  value={formData.initial_mileage !== null && formData.initial_mileage !== undefined ? formData.initial_mileage : ''}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Quilometragem Total (km)
              </label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="text"
                  value={totalMileage.toLocaleString('pt-BR')}
                  className="w-full pl-10 pr-4 py-2 bg-secondary-50 border border-secondary-300 rounded-lg text-secondary-700"
                  disabled
                />
              </div>
              <p className="mt-1 text-xs text-secondary-500">
                Quilometragem total acumulada incluindo inspeções
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Data de Aquisição
              </label>
              <input
                type="date"
                name="acquisition_date"
                value={formData.acquisition_date ?? ''}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Valor de Aquisição (R$)
              </label>
              <input
                type="number"
                name="acquisition_value"
                value={formData.acquisition_value ?? ''}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Capacidade do Tanque (litros) *
              </label>
              <input
                type="number"
                name="tank_capacity"
                value={formData.tank_capacity ?? ''}
                onChange={handleChange}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="1"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 lg:pt-6 border-t">
            <Button variant="secondary" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {vehicle ? 'Salvar Alterações' : 'Cadastrar Veículo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para visualizar detalhes do veículo
const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({ isOpen, onClose, vehicle, costs }) => {
  if (!isOpen || !vehicle) return null;

  const vehicleCosts = costs.filter(cost => cost.vehicle_id === vehicle.id);
  const totalCosts = vehicleCosts.reduce((sum, cost) => sum + cost.amount, 0);

  const getStatusBadge = (status: string) => {
    const variants = {
      'Disponível': 'success',
      'Em Uso': 'info',
      'Manutenção': 'warning',
      'Inativo': 'error'
    } as const;

    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h2 className="text-lg lg:text-xl font-semibold text-secondary-900">
            Detalhes do Veículo
          </h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 p-2">
            ×
          </button>
        </div>

        {/* Vehicle Info */}
        <div className="bg-secondary-50 p-4 rounded-lg mb-6">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
              <Car className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-secondary-900">{vehicle.plate}</h3>
              <p className="text-sm text-secondary-600">{vehicle.model} ({vehicle.year})</p>
            </div>
            <div className="ml-auto">
              {getStatusBadge(vehicle.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-sm text-secondary-600">Tipo:</p>
              <p className="font-medium">{vehicle.type}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-600">Categoria:</p>
              <p className="font-medium">{vehicle.category}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-600">Combustível:</p>
              <p className="font-medium">{vehicle.fuel || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-600">Cor:</p>
              <p className="font-medium">{vehicle.color || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-600">Capacidade de Carga:</p>
              <p className="font-medium">{vehicle.cargo_capacity ? `${vehicle.cargo_capacity} kg` : 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-600">Localização:</p>
              <p className="font-medium">{vehicle.location || 'Não informado'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-secondary-600">Chassi:</p>
              <p className="font-medium">{vehicle.chassis || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-600">RENAVAM:</p>
              <p className="font-medium">{vehicle.renavam || 'Não informado'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-secondary-600">Data de Aquisição:</p>
              <p className="font-medium">{vehicle.acquisition_date ? new Date(vehicle.acquisition_date).toLocaleDateString('pt-BR') : 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-600">Valor de Aquisição:</p>
              <p className="font-medium">{vehicle.acquisition_value ? `R$ ${vehicle.acquisition_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-primary-50 p-4 rounded-lg flex items-center justify-between">
              <span className="text-lg font-semibold text-primary-900">Quilometragem Inicial</span>
              <span className="text-2xl font-bold text-primary-700">{(vehicle.initial_mileage || 0).toLocaleString('pt-BR')} km</span>
            </div>
            <div className="bg-info-50 p-4 rounded-lg flex items-center justify-between">
              <span className="text-lg font-semibold text-info-900">Quilometragem Total</span>
              <span className="text-2xl font-bold text-info-700">{(vehicle.total_mileage || 0).toLocaleString('pt-BR')} km</span>
            </div>
          </div>
        </div>

        {/* Costs Summary */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Resumo de Custos
          </h3>
          <div className="bg-white border border-secondary-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-secondary-600">Total de Custos:</p>
              <p className="text-xl font-bold text-secondary-900">
                R$ {totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-secondary-600">Manutenção:</p>
                <p className="font-medium">
                  R$ {vehicleCosts.filter(c => c.category === 'Avulsa' || c.category === 'Funilaria').reduce((sum, c) => sum + c.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Multas:</p>
                <p className="font-medium">
                  R$ {vehicleCosts.filter(c => c.category === 'Multa').reduce((sum, c) => sum + c.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Seguro:</p>
                <p className="font-medium">
                  R$ {vehicleCosts.filter(c => c.category === 'Seguro').reduce((sum, c) => sum + c.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Costs */}
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Custos Recentes
          </h3>
          
          {vehicleCosts.length > 0 ? (
            <div className="space-y-3">
              {vehicleCosts.slice(0, 5).map((cost) => (
                <div key={cost.id} className="border border-secondary-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-secondary-900">{cost.description}</h4>
                    <Badge variant={
                      cost.category === 'Multa' ? 'error' :
                      cost.category === 'Funilaria' ? 'warning' :
                      cost.category === 'Seguro' ? 'info' : 'secondary'
                    }>
                      {cost.category}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary-600">
                      {new Date(cost.cost_date).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="font-bold text-secondary-900">
                      R$ {cost.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-secondary-50 rounded-lg">
              <DollarSign className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">Nenhum custo registrado para este veículo</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6 border-t mt-6">
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};

export const Fleet: React.FC = () => {
  const { vehicles, loading, createVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const { costs } = useCosts();
  const { contracts } = useContracts();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(undefined);
  const [sortField, setSortField] = useState<SortField>('plate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [vehiclesWithCosts, setVehiclesWithCosts] = useState<VehicleWithCosts[]>([]);

  // Função para calcular custos totais e status real dos veículos
  useEffect(() => {
    const enrichVehicles = () => {
      const enrichedVehicles = vehicles.map(vehicle => {
        const vehicleCosts = costs.filter(cost => cost.vehicle_id === vehicle.id);
        const totalCost = vehicleCosts.reduce((sum, cost) => sum + cost.amount, 0);
        const activeContract = contracts.find(c => 
          (c.vehicle_id === vehicle.id || 
           c.contract_vehicles?.some(cv => cv.vehicle_id === vehicle.id)) && 
          c.status === 'Ativo'
        );

        let actualStatus = vehicle.status;
        if (activeContract) {
          actualStatus = 'Em Uso';
        }

        return {
          ...vehicle,
          totalCost,
          actualStatus,
          contractInfo: activeContract
        } as VehicleWithCosts;
      });

      setVehiclesWithCosts(enrichedVehicles);
    };

    enrichVehicles();
  }, [vehicles, costs, contracts]);

  // Listen for vehicle mileage updates from maintenance check-outs
  useEffect(() => {
    const handleMileageUpdate = () => {
      // Force refresh of vehicles data when mileage is updated
      window.location.reload();
    };

    window.addEventListener('vehicle-mileage-updated', handleMileageUpdate);
    return () => window.removeEventListener('vehicle-mileage-updated', handleMileageUpdate);
  }, []);

  // Função de ordenação
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Função para inativar veículo
  const inactivateVehicle = async (id: string) => {
    if (confirm('Tem certeza que deseja inativar este veículo?')) {
      try {
        await updateVehicle(id, { status: 'Inativo' });
        toast.success('Veículo inativado com sucesso!');
      } catch (error) {
        toast.error('Erro ao inativar veículo');
      }
    }
  };

  // Aplicar filtros e ordenação
  const filteredAndSortedVehicles = vehiclesWithCosts
    .filter(vehicle => vehicle.status !== 'Inativo')
    .filter(vehicle => {
      const matchesSearch = 
        vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === '' || vehicle.actualStatus === statusFilter;
      const matchesType = typeFilter === '' || vehicle.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Tratar campos especiais
      if (sortField === 'totalCost') {
        aValue = a.totalCost;
        bValue = b.totalCost;
      } else if (sortField === 'status') {
        aValue = a.actualStatus;
        bValue = b.actualStatus;
      } else if (sortField === 'initial_mileage') {
        aValue = a.initial_mileage || 0;
        bValue = b.initial_mileage || 0;
      } else if (sortField === 'total_mileage') {
        aValue = a.total_mileage || 0;
        bValue = b.total_mileage || 0;
      }

      // Ordenação
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getStatusBadge = (status: string) => {
    const variants = {
      'Disponível': 'success',
      'Em Contrato': 'info',
      'Em Uso': 'info',
      'Manutenção': 'warning',
      'Inativo': 'error'
    } as const;

    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleEdit = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleView = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsDetailModalOpen(true);
  };

  const handleNew = () => {
    setSelectedVehicle(undefined);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (selectedVehicle) {
        await updateVehicle(selectedVehicle.id, data);
      } else {
        await createVehicle(data);
      }
      // Forçar refresh da lista para garantir que os dados estejam atualizados
      await new Promise(resolve => setTimeout(resolve, 100));
      // Não precisa chamar fetchVehicles pois o hook já atualiza automaticamente
    } catch (error) {
      console.error('Erro ao salvar veículo:', error);
      throw error;
    }
  };

  // Calculate statistics baseado no status real
  const totalVehicles = vehiclesWithCosts.length;
  const availableVehicles = vehiclesWithCosts.filter(v => v.actualStatus === 'Disponível').length;
  const inContractVehicles = vehiclesWithCosts.filter(v => v.actualStatus === 'Em Contrato').length;
  const maintenanceVehicles = vehiclesWithCosts.filter(v => v.actualStatus === 'Manutenção').length;
  const totalFleetCost = vehiclesWithCosts.reduce((sum, v) => sum + v.totalCost, 0);

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
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900">Frota</h1>
          <p className="text-secondary-600 mt-1 lg:mt-2">Gerencie todos os veículos da empresa</p>
        </div>
        <Button onClick={handleNew} size="sm" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Veículo
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Total de Veículos</p>
                <p className="text-xl lg:text-2xl font-bold text-secondary-900">{totalVehicles}</p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Car className="h-4 w-4 lg:h-6 lg:w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Disponíveis</p>
                <p className="text-xl lg:text-2xl font-bold text-success-600">{availableVehicles}</p>
                <p className="text-xs text-success-600 mt-1">Prontos para uso</p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-success-100 rounded-lg flex items-center justify-center">
                <Car className="h-4 w-4 lg:h-6 lg:w-6 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Em Uso</p>
                <p className="text-xl lg:text-2xl font-bold text-info-600">{inContractVehicles}</p>
                <p className="text-xs text-info-600 mt-1">Em operação</p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-info-100 rounded-lg flex items-center justify-center">
                <Car className="h-4 w-4 lg:h-6 lg:w-6 text-info-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Em Manutenção</p>
                <p className="text-xl lg:text-2xl font-bold text-warning-600">{maintenanceVehicles}</p>
                <p className="text-xs text-warning-600 mt-1">Em reparo</p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <Car className="h-4 w-4 lg:h-6 lg:w-6 text-warning-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-600 text-xs lg:text-sm font-medium">Custo Total da Frota</p>
                <p className="text-lg lg:text-xl font-bold text-primary-600">
                  R$ {totalFleetCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-primary-600 mt-1">Investimento total</p>
              </div>
              <div className="h-8 w-8 lg:h-12 lg:w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 lg:h-6 lg:w-6 text-primary-600" />
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
                  placeholder="Buscar por placa, modelo ou localização..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os Status</option>
                <option value="Disponível">Disponível</option>
                <option value="Em Contrato">Em Contrato</option>
                <option value="Em Uso">Em Uso</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Inativo">Inativo</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os Tipos</option>
                <option value="Furgão">Furgão</option>
                <option value="Van">Van</option>
              </select>
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles List */}
      <Card>
        <CardHeader className="p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-secondary-900">
            Veículos ({filteredAndSortedVehicles.length})
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3 p-4">
            {filteredAndSortedVehicles.map((vehicle) => (
              <div key={vehicle.id} className="border border-secondary-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-secondary-900">{vehicle.plate}</p>
                    <p className="text-sm text-secondary-600">{vehicle.model} ({vehicle.year})</p>
                  </div>
                  {getStatusBadge(vehicle.actualStatus)}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-secondary-500">Tipo:</span>
                    <p className="font-medium">{vehicle.type}</p>
                  </div>
                  <div>
                    <span className="text-secondary-500">Categoria:</span>
                    <p className="font-medium">{vehicle.category}</p>
                  </div>
                  <div>
                    <span className="text-secondary-500">Km Inicial:</span>
                    <p className="font-medium">{(vehicle.initial_mileage || 0).toLocaleString('pt-BR')} km</p>
                  </div>
                  <div>
                    <span className="text-secondary-500">Km Total:</span>
                    <p className="font-medium">{vehicle.total_mileage?.toLocaleString('pt-BR')} km</p>
                  </div>
                  <div>
                    <span className="text-secondary-500">Custo Total:</span>
                    <p className="font-medium text-primary-600">
                      R$ {vehicle.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <span className="text-secondary-500">Localização:</span>
                    <p className="font-medium">{vehicle.location || '-'}</p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button 
                    onClick={() => handleView(vehicle)}
                    className="p-2 text-secondary-400 hover:text-secondary-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleEdit(vehicle)}
                    className="p-2 text-secondary-400 hover:text-secondary-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <Button
                    onClick={() => inactivateVehicle(vehicle.id)}
                    variant="secondary"
                    size="icon"
                    className="p-1 text-secondary-400 hover:text-warning-600"
                    title="Inativar veículo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th 
                    className="text-left py-3 px-6 text-sm font-medium text-secondary-600 cursor-pointer hover:bg-secondary-100"
                    onClick={() => handleSort('plate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Placa</span>
                      {getSortIcon('plate')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-6 text-sm font-medium text-secondary-600 cursor-pointer hover:bg-secondary-100"
                    onClick={() => handleSort('model')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Modelo</span>
                      {getSortIcon('model')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-6 text-sm font-medium text-secondary-600 cursor-pointer hover:bg-secondary-100"
                    onClick={() => handleSort('year')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Ano</span>
                      {getSortIcon('year')}
                    </div>
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Tipo</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Categoria</th>
                  <th 
                    className="text-left py-3 px-6 text-sm font-medium text-secondary-600 cursor-pointer hover:bg-secondary-100"
                    onClick={() => handleSort('initial_mileage')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Km Inicial</span>
                      {getSortIcon('initial_mileage')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-6 text-sm font-medium text-secondary-600 cursor-pointer hover:bg-secondary-100"
                    onClick={() => handleSort('total_mileage')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Km Total</span>
                      {getSortIcon('total_mileage')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-6 text-sm font-medium text-secondary-600 cursor-pointer hover:bg-secondary-100"
                    onClick={() => handleSort('totalCost')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Custo Total</span>
                      {getSortIcon('totalCost')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-6 text-sm font-medium text-secondary-600 cursor-pointer hover:bg-secondary-100"
                    onClick={() => handleSort('location')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Localização</span>
                      {getSortIcon('location')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-6 text-sm font-medium text-secondary-600 cursor-pointer hover:bg-secondary-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {filteredAndSortedVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-secondary-50">
                    <td className="py-4 px-6 text-sm font-medium text-secondary-900">
                      {vehicle.plate}
                    </td>
                    <td className="py-4 px-6 text-sm text-secondary-600">
                      {vehicle.model}
                    </td>
                    <td className="py-4 px-6 text-sm text-secondary-600">
                      {vehicle.year}
                    </td>
                    <td className="py-4 px-6 text-sm text-secondary-600">
                      {vehicle.type}
                    </td>
                    <td className="py-4 px-6 text-sm text-secondary-600">
                      {vehicle.category}
                    </td>
                    <td className="py-4 px-6 text-sm text-secondary-600">
                      <div className="flex items-center">
                        <Gauge className="h-4 w-4 text-secondary-400 mr-1" />
                        <span className="font-medium">{(vehicle.initial_mileage || 0).toLocaleString('pt-BR')} km</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-secondary-600">
                      <div className="flex items-center">
                        <Gauge className="h-4 w-4 text-secondary-400 mr-1" />
                        <span className="font-medium">{vehicle.total_mileage?.toLocaleString('pt-BR')} km</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-secondary-600">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-secondary-400" />
                        <span className="font-medium">
                          R$ {vehicle.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-secondary-600">
                      {vehicle.location || '-'}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(vehicle.actualStatus)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleView(vehicle)}
                          className="p-1 text-secondary-400 hover:text-secondary-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(vehicle)}
                          className="p-1 text-secondary-400 hover:text-secondary-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <Button
                          onClick={() => inactivateVehicle(vehicle.id)}
                          variant="secondary"
                          size="icon"
                          className="p-1 text-secondary-400 hover:text-warning-600"
                          title="Inativar veículo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAndSortedVehicles.length === 0 && (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">Nenhum veículo encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicle={selectedVehicle}
        onSave={handleSave}
      />

      <VehicleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        vehicle={selectedVehicle}
        costs={costs}
      />
    </div>
  );
};

export default Fleet;