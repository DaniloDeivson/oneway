import { useState, useEffect } from 'react';
import { supabase, DEFAULT_TENANT_ID } from '../lib/supabase';
import { Database } from '../types/database';
import toast from 'react-hot-toast';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

interface VehicleWithMileage extends Omit<Vehicle, 'mileage'> {
  mileage: number;
  total_mileage: number;
  initial_mileage: number;
}

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<VehicleWithMileage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para calcular a quilometragem total de um veículo
  const calculateTotalMileage = async (vehicleId: string): Promise<number> => {
    try {
      // Usar a função SQL que considera veículo, inspeções e ordens de serviço
      const { data, error } = await supabase
        .rpc('fn_calculate_vehicle_total_mileage', { p_vehicle_id: vehicleId });

      if (error) throw error;

      return data || 0;
    } catch (err) {
      console.error('Erro ao calcular quilometragem total:', err);
      // Fallback para o cálculo manual se a função SQL falhar
      try {
        const { data: vehicleData } = await supabase
          .from('vehicles')
          .select('mileage')
          .eq('id', vehicleId)
          .single();

        return vehicleData?.mileage || 0;
      } catch {
        return 0;
      }
    }
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      // Buscar veículos incluindo initial_mileage
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('created_at', { ascending: false });

      if (vehiclesError) throw vehiclesError;

      // Calcular quilometragem total para cada veículo
      const vehiclesWithMileage = await Promise.all(
        (vehiclesData || []).map(async (vehicle) => {
          const totalMileage = await calculateTotalMileage(vehicle.id);
          return {
            ...vehicle,
            mileage: vehicle.mileage || 0,
            total_mileage: totalMileage,
            initial_mileage: Number(vehicle.initial_mileage) || 0
          } as VehicleWithMileage;
        })
      );

      setVehicles(vehiclesWithMileage);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar veículos';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const createVehicle = async (vehicleData: Omit<VehicleInsert, 'tenant_id'>) => {
    try {
      // Se vehicleData contém tenant_id, usar ele; senão usar DEFAULT_TENANT_ID
      const tenantId = ('tenant_id' in vehicleData ? vehicleData.tenant_id : null) || DEFAULT_TENANT_ID;
      
      const { data: existingVehicle, error: checkError } = await supabase
        .from('vehicles')
        .select('plate')
        .eq('plate', vehicleData.plate)
        .eq('tenant_id', tenantId)
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      if (existingVehicle && existingVehicle.length > 0) {
        throw new Error(`A vehicle with plate ${vehicleData.plate} already exists.`);
      }

      const { data, error } = await supabase
        .from('vehicles')
        .insert([{ ...vehicleData, tenant_id: tenantId }])
        .select()
        .single();

      if (error) throw error;
      setVehicles(prev => [data, ...prev]);
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create vehicle');
    }
  };

  const updateVehicle = async (id: string, updates: VehicleUpdate) => {
    try {
      // Limpar campos undefined/null para evitar problemas
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined)
      );

      const { data, error } = await supabase
        .from('vehicles')
        .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Calcular nova quilometragem total
      const totalMileage = await calculateTotalMileage(id);
      
      // Atualizar o estado local
      setVehicles(prev => prev.map(v => {
        if (v.id === id) {
          return {
            ...data,
            mileage: data.mileage || 0,
            total_mileage: totalMileage,
            initial_mileage: Number(data.initial_mileage) || 0
          } as VehicleWithMileage;
        }
        return v;
      }));

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar veículo';
      toast.error(`Erro ao atualizar veículo: ${message}`);
      throw new Error(message);
    }
  };

  const deleteVehicle = async (id: string, tenantId?: string) => {
    try {
      const tenant_id = tenantId || DEFAULT_TENANT_ID;
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant_id);

      if (error) throw error;
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete vehicle');
    }
  };

  // Adicionar um método para atualizar a quilometragem total de um veículo específico
  const refreshVehicleMileage = async (vehicleId: string) => {
    try {
      const totalMileage = await calculateTotalMileage(vehicleId);
      setVehicles(prev => prev.map(v => {
        if (v.id === vehicleId) {
          return { ...v, total_mileage: totalMileage };
        }
        return v;
      }));
    } catch (err) {
      console.error('Erro ao atualizar quilometragem do veículo:', err);
    }
  };

  useEffect(() => {
    fetchVehicles();

    // Listen for vehicle mileage updates from maintenance check-outs
    const handleMileageUpdate = (event: CustomEvent) => {
      const { vehicleId } = event.detail;
      if (vehicleId) {
        // Refetch vehicles data or just refresh the specific vehicle
        setTimeout(() => {
          fetchVehicles();
        }, 500); // Small delay to ensure database is updated
      }
    };

    window.addEventListener('vehicle-mileage-updated', handleMileageUpdate as EventListener);

    return () => {
      window.removeEventListener('vehicle-mileage-updated', handleMileageUpdate as EventListener);
    };
  }, []);

  return {
    vehicles,
    loading,
    error,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    refreshVehicleMileage,
    refetch: fetchVehicles
  };
};