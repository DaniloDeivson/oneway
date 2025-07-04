import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { Search, Car, Calendar, MapPin, X, Loader2 } from 'lucide-react';
import { useContracts } from '../../hooks/useContracts';

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  type: string;
  status: string;
  location?: string;
}

interface VehicleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  loading?: boolean;
}

export const VehicleSearchModal: React.FC<VehicleSearchModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  onSelectVehicle,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const { contracts } = useContracts();

  // Calculate real status based on contracts
  const getActualStatus = (vehicle: Vehicle) => {
    const activeContract = contracts.find(contract => 
      contract.vehicle_id === vehicle.id && 
      contract.status === 'Ativo'
    );

    if (activeContract) {
      return 'Em Contrato';
    } else if (vehicle.status === 'Em Uso' && !activeContract) {
      return 'Disponível'; // Correct status if no active contract
    }
    
    return vehicle.status;
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVehicles(vehicles);
      return;
    }

    const filtered = vehicles.filter(vehicle =>
      vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVehicles(filtered);
  }, [searchTerm, vehicles]);

  if (!isOpen) return null;

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

  const handleSelectVehicle = (vehicle: Vehicle) => {
    onSelectVehicle(vehicle);
    setSearchTerm('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h2 className="text-lg lg:text-xl font-semibold text-secondary-900 flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Buscar Veículo para Inspeção
          </h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 p-2">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search Input */}
        <div className="mb-4 lg:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Digite a placa ou modelo do veículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-lg border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>
          <p className="text-sm text-secondary-600 mt-2">
            Digite pelo menos 3 caracteres para buscar por placa ou modelo
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <>
            {/* Vehicle List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => {
                  const actualStatus = getActualStatus(vehicle);
                  return (
                    <div
                      key={vehicle.id}
                      onClick={() => handleSelectVehicle(vehicle)}
                      className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Car className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-secondary-900 text-lg">{vehicle.plate}</h3>
                            <p className="text-sm text-secondary-600">{vehicle.model} ({vehicle.year})</p>
                          </div>
                        </div>
                        {getStatusBadge(actualStatus)}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-secondary-600">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {vehicle.type}
                          </span>
                          {vehicle.location && (
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {vehicle.location}
                            </span>
                          )}
                        </div>
                        <span className="text-primary-600 font-medium">Selecionar →</span>
                      </div>
                    </div>
                  );
                })
              ) : searchTerm.length >= 3 ? (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                  <p className="text-secondary-600">Nenhum veículo encontrado</p>
                  <p className="text-sm text-secondary-500 mt-1">
                    Tente buscar por outra placa ou modelo
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                  <p className="text-secondary-600">Digite para buscar veículos</p>
                  <p className="text-sm text-secondary-500 mt-1">
                    Use a placa ou modelo para encontrar rapidamente
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {searchTerm.length >= 3 && filteredVehicles.length === 0 && (
              <div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex items-center">
                  <Search className="h-5 w-5 text-warning-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-warning-800">Veículo não encontrado</p>
                    <p className="text-xs text-warning-700 mt-1">
                      Verifique se a placa está correta ou se o veículo está cadastrado no sistema
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end pt-4 lg:pt-6 border-t mt-4 lg:mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};