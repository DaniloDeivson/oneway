import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { Card, CardContent } from '../UI/Card';
import { Plus, X, Car, DollarSign } from 'lucide-react';
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

interface ContractVehicleData {
  vehicle_id: string;
  daily_rate?: number;
}

interface MultipleVehicleSelectorProps {
  vehicles: Vehicle[];
  selectedVehicles: ContractVehicleData[];
  onVehiclesChange: (vehicles: ContractVehicleData[]) => void;
  defaultDailyRate?: number;
  disabled?: boolean;
  startDate?: string;
  endDate?: string;
  availableVehicles?: AvailableVehicle[];
}

export const MultipleVehicleSelector: React.FC<MultipleVehicleSelectorProps> = ({
  vehicles,
  selectedVehicles,
  onVehiclesChange,
  defaultDailyRate = 0,
  disabled = false,
  startDate,
  endDate,
  availableVehicles
}) => {
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [vehicleRate, setVehicleRate] = useState(defaultDailyRate);

  // Update vehicle rate when default changes
  useEffect(() => {
    setVehicleRate(defaultDailyRate);
  }, [defaultDailyRate]);

  // Get available vehicles (not already selected and with proper status)
  const filteredVehicles = React.useMemo(() => {
    // Se temos uma lista específica de veículos disponíveis (por período), use ela
    if (availableVehicles && availableVehicles.length > 0) {
      return availableVehicles.filter(
        vehicle => !selectedVehicles.some(sv => sv.vehicle_id === vehicle.id)
      );
    }
    
    // Caso contrário, filtre por status "Disponível"
    return vehicles.filter(
      vehicle => 
        vehicle.status === 'Disponível' && 
        !selectedVehicles.some(sv => sv.vehicle_id === vehicle.id)
    );
  }, [vehicles, availableVehicles, selectedVehicles]);

  const handleAddVehicle = () => {
    if (selectedVehicleId) {
      const newVehicle: ContractVehicleData = {
        vehicle_id: selectedVehicleId,
        daily_rate: vehicleRate
      };
      
      onVehiclesChange([...selectedVehicles, newVehicle]);
      setSelectedVehicleId('');
      setVehicleRate(defaultDailyRate);
      setShowAddVehicle(false);
    }
  };

  const handleRemoveVehicle = (vehicleId: string) => {
    onVehiclesChange(selectedVehicles.filter(sv => sv.vehicle_id !== vehicleId));
  };

  const handleUpdateVehicleRate = (vehicleId: string, newRate: number) => {
    onVehiclesChange(
      selectedVehicles.map(sv =>
        sv.vehicle_id === vehicleId ? { ...sv, daily_rate: newRate } : sv
      )
    );
  };

  const getVehicleInfo = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-secondary-700">
          Veículos Selecionados
        </label>
        {!disabled && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowAddVehicle(true)}
            disabled={filteredVehicles.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Veículo
          </Button>
        )}
      </div>

      {/* Selected Vehicles List */}
      <div className="space-y-3">
        {selectedVehicles.map((selectedVehicle) => {
          const vehicleInfo = getVehicleInfo(selectedVehicle.vehicle_id);
          if (!vehicleInfo) return null;

          return (
            <Card key={selectedVehicle.vehicle_id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Car className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">
                        {vehicleInfo.plate} - {vehicleInfo.model}
                      </p>
                      <p className="text-sm text-secondary-600">
                        {vehicleInfo.type} • {vehicleInfo.year}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-secondary-400" />
                      <input
                        type="number"
                        value={selectedVehicle.daily_rate || 0}
                        onChange={(e) => handleUpdateVehicleRate(
                          selectedVehicle.vehicle_id,
                          parseFloat(e.target.value) || 0
                        )}
                        className="w-24 px-2 py-1 border border-secondary-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        disabled={disabled}
                      />
                      <span className="text-sm text-secondary-600">/dia</span>
                    </div>
                    
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVehicle(selectedVehicle.vehicle_id)}
                        className="p-1 text-secondary-400 hover:text-error-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedVehicles.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-secondary-300 rounded-lg">
          <Car className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
          <p className="text-secondary-600">Nenhum veículo selecionado</p>
          <p className="text-sm text-secondary-500">
            Clique em "Adicionar Veículo" para começar
          </p>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">
                Adicionar Veículo
              </h3>
              <button
                onClick={() => setShowAddVehicle(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Selecionar Veículo
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={!startDate || !endDate}
                >
                  <option value="">
                    {!startDate || !endDate ?
                      'Selecione as datas do contrato primeiro' :
                      (filteredVehicles.length === 0 ? 'Nenhum veículo disponível' : 'Selecione um veículo')
                    }
                  </option>
                  {filteredVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} - {vehicle.model} ({vehicle.year}) - {vehicle.status}
                    </option>
                  ))}
                </select>
                {filteredVehicles.length === 0 && (
                  <p className="text-sm text-warning-600 mt-1">
                    {!startDate || !endDate ? 
                      '⚠️ Defina as datas do contrato primeiro para ver veículos disponíveis' :
                      '⚠️ Nenhum veículo disponível no período selecionado'
                    }
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Valor Diário (R$)
                </label>
                <input
                  type="number"
                  value={vehicleRate}
                  onChange={(e) => setVehicleRate(parseFloat(e.target.value) || 0)}
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddVehicle(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleAddVehicle}
                disabled={!selectedVehicleId}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 