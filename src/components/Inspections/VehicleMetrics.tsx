import React from 'react';
import { Gauge, Fuel } from 'lucide-react';

interface VehicleMetricsProps {
  mileage: string | number;
  fuelLevel: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const VehicleMetrics: React.FC<VehicleMetricsProps> = ({
  mileage,
  fuelLevel,
  onChange
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          <Gauge className="h-4 w-4 inline mr-1" />
          Quilometragem
        </label>
        <input
          type="number"
          name="mileage"
          value={mileage}
          onChange={onChange}
          className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Km atual do veículo"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          <Fuel className="h-4 w-4 inline mr-1" />
          Nível de Combustível (%)
        </label>
        <input
          type="number"
          name="fuel_level"
          value={fuelLevel}
          onChange={onChange}
          min="0"
          max="100"
          className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="0-100%"
        />
      </div>
    </div>
  );
};