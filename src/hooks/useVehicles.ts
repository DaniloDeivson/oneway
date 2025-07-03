import { useState, useEffect } from 'react';
import { supabase, DEFAULT_TENANT_ID } from '../lib/supabase';
import { Database } from '../types/database';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createVehicle = async (vehicleData: Omit<VehicleInsert, 'tenant_id'>) => {
    try {
      // Check if a vehicle with the same plate already exists
      const { data: existingVehicle, error: checkError } = await supabase
        .from('vehicles')
        .select('plate')
        .eq('plate', vehicleData.plate)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      if (existingVehicle && existingVehicle.length > 0) {
        throw new Error(`A vehicle with plate ${vehicleData.plate} already exists.`);
      }

      const { data, error } = await supabase
        .from('vehicles')
        .insert([{ ...vehicleData, tenant_id: DEFAULT_TENANT_ID }])
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
      const { data, error } = await supabase
        .from('vehicles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setVehicles(prev => prev.map(v => v.id === id ? data : v));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update vehicle');
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete vehicle');
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  return {
    vehicles,
    loading,
    error,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    refetch: fetchVehicles
  };
};