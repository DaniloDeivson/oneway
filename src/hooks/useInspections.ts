import { useState, useEffect } from 'react';
import { supabase, DEFAULT_TENANT_ID } from '../lib/supabase';
import { Database } from '../types/database';
import toast from 'react-hot-toast';

type Inspection = Database['public']['Tables']['inspections']['Row'] & {
  vehicles?: { plate: string; model: string; year: number };
  inspection_items?: InspectionItem[];
  employees?: { name: string; role: string };
  contracts?: { id: string; contract_number: string };
  customers?: { id: string; name: string };
};

type InspectionItem = Database['public']['Tables']['inspection_items']['Row'];

type InspectionInsert = Database['public']['Tables']['inspections']['Insert'];
type InspectionUpdate = Database['public']['Tables']['inspections']['Update'];
type InspectionItemInsert = Database['public']['Tables']['inspection_items']['Insert'];

type Vehicle = Database['public']['Tables']['vehicles']['Row'];

interface InspectionStatistics {
  total_inspections: number;
  checkin_count: number;
  checkout_count: number;
  total_damages: number;
  high_severity_damages: number;
  total_estimated_costs: number;
  vehicles_in_maintenance: number;
  average_damages_per_checkout: number;
}

export const useInspections = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [statistics, setStatistics] = useState<InspectionStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função auxiliar para atualizar a quilometragem do veículo
  const updateVehicleMileage = async (vehicleId: string, newMileage: number) => {
    try {
      // Primeiro, buscar a quilometragem atual do veículo
      const { data: vehicleData, error: fetchError } = await supabase
        .from('vehicles')
        .select('mileage')
        .eq('id', vehicleId)
        .single();

      if (fetchError) throw fetchError;

      // Só atualiza se a nova quilometragem for maior que a atual
      if (vehicleData && (!vehicleData.mileage || newMileage > vehicleData.mileage)) {
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({ 
            mileage: newMileage,
            updated_at: new Date().toISOString()
          })
          .eq('id', vehicleId);

        if (updateError) throw updateError;
      }
    } catch (err) {
      console.error('Erro ao atualizar quilometragem do veículo:', err);
      throw err;
    }
  };

  const fetchInspections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          vehicles (
            plate,
            model,
            year
          ),
          inspection_items (
            *
          )
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('inspected_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      setInspections(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Erro ao carregar inspeções: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase
        .rpc('fn_inspection_statistics', { 
          p_tenant_id: DEFAULT_TENANT_ID,
          p_start_date: null,
          p_end_date: null
        });

      if (error) throw error;
      if (data && data.length > 0) {
        setStatistics(data[0]);
      }
    } catch (err) {
      // Error handling for statistics
    }
  };

  const createInspection = async (inspectionData: Omit<InspectionInsert, 'tenant_id'>, damages?: Omit<InspectionItem, 'id' | 'inspection_id'>[]) => {
    try {
      const { data: newInspection, error } = await supabase
        .from('inspections')
        .insert([{ ...inspectionData, tenant_id: DEFAULT_TENANT_ID }])
        .select()
        .single();
        
      if (error) throw error;
      
      if (damages && damages.length > 0) {
        const inspectionItems = damages.map(damage => ({
          ...damage,
          inspection_id: newInspection.id
        }));
        const { error: itemsError } = await supabase
          .from('inspection_items')
          .insert(inspectionItems);
        if (itemsError) {
          throw itemsError;
        }
      }
      
      // Atualizar quilometragem do veículo se fornecida
      if (newInspection.vehicle_id && newInspection.mileage) {
        await updateVehicleMileage(newInspection.vehicle_id, newInspection.mileage);
      }
      
      await fetchInspections();
      await fetchStatistics();
      return newInspection;
    } catch (err) {
      toast.error('Erro ao criar inspeção: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      throw new Error(err instanceof Error ? err.message : 'Failed to create inspection');
    }
  };

  const updateInspection = async (id: string, updates: InspectionUpdate) => {
    try {
      console.log('Updating inspection with:', updates);
      
      const { data, error } = await supabase
        .from('inspections')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          vehicles (
            plate,
            model,
            year
          ),
          inspection_items (
            *
          )
        `)
        .single();

      if (error) {
        console.error('Error updating inspection:', error);
        throw error;
      }
      
      console.log('Inspection updated successfully:', data);
      setInspections(prev => prev.map(i => i.id === id ? data : i));
      
      // Atualizar quilometragem do veículo se fornecida
      if (data.vehicle_id && data.mileage) {
        await updateVehicleMileage(data.vehicle_id, data.mileage);
      }
      
      await fetchStatistics();
      return data;
    } catch (err) {
      console.error('Full error in updateInspection:', err);
      toast.error('Erro ao atualizar inspeção: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      throw new Error(err instanceof Error ? err.message : 'Failed to update inspection');
    }
  };

  const deleteInspection = async (id: string) => {
    try {
      // Check if there are any damage notifications pending for this inspection
      const { data: inspectionItems, error: itemsError } = await supabase
        .from('inspection_items')
        .select('id')
        .eq('inspection_id', id);
      
      if (itemsError) throw itemsError;
      
      if (inspectionItems && inspectionItems.length > 0) {
        const itemIds = inspectionItems.map(item => item.id);
        
        // Check for notifications
        const { data: notifications, error: notifError } = await supabase
          .from('damage_notifications')
          .select('id, status')
          .in('inspection_item_id', itemIds);
        
        if (notifError) throw notifError;
        
        // Check if there are any sent notifications
        const sentNotifications = notifications?.filter(n => n.status === 'sent') || [];
        if (sentNotifications.length > 0) {
          throw new Error('Não é possível excluir uma inspeção com notificações de danos já enviadas.');
        }
      }
      
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setInspections(prev => prev.filter(i => i.id !== id));
      
      // Se a inspeção tinha quilometragem, atualizar o veículo com a maior quilometragem das inspeções restantes
      const inspection = inspections.find(i => i.id === id);
      if (inspection?.vehicle_id && inspection.mileage) {
        const { data: latestInspection, error: fetchError } = await supabase
          .from('inspections')
          .select('mileage')
          .eq('vehicle_id', inspection.vehicle_id)
          .order('mileage', { ascending: false })
          .limit(1)
          .single();

        if (!fetchError && latestInspection) {
          await updateVehicleMileage(inspection.vehicle_id, latestInspection.mileage);
        }
      }
      
      await fetchStatistics();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete inspection');
    }
  };

  const addInspectionItem = async (inspectionId: string, itemData: Omit<InspectionItemInsert, 'inspection_id'>) => {
    try {
      const { data, error } = await supabase
        .from('inspection_items')
        .insert([{ ...itemData, inspection_id: inspectionId }])
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setInspections(prev => prev.map(inspection => {
        if (inspection.id === inspectionId) {
          return {
            ...inspection,
            inspection_items: [...(inspection.inspection_items || []), data]
          };
        }
        return inspection;
      }));
      
      await fetchStatistics();
      return data;
    } catch (err) {
      toast.error('Erro ao adicionar item de inspeção: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      throw new Error(err instanceof Error ? err.message : 'Failed to add inspection item');
    }
  };

  const removeInspectionItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('inspection_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      // Update local state
      setInspections(prev => prev.map(inspection => ({
        ...inspection,
        inspection_items: inspection.inspection_items?.filter(item => item.id !== itemId) || []
      })));
      
      await fetchStatistics();
    } catch (err) {
      toast.error('Erro ao remover item de inspeção: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      throw new Error(err instanceof Error ? err.message : 'Failed to remove inspection item');
    }
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `inspection-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      toast.error('Erro ao fazer upload da foto: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      throw new Error(err instanceof Error ? err.message : 'Failed to upload photo');
    }
  };

  const uploadSignature = async (signatureBlob: Blob): Promise<string> => {
    try {
      const fileName = `signature-${Date.now()}.png`;
      const filePath = `signatures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, signatureBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('signatures')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      toast.error('Erro ao fazer upload da assinatura: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      throw new Error(err instanceof Error ? err.message : 'Failed to upload signature');
    }
  };

  const processDamageNotifications = async () => {
    try {
      const { data, error } = await supabase
        .rpc('fn_process_damage_notifications', { p_tenant_id: DEFAULT_TENANT_ID });

      if (error) throw error;
      
      toast.success(`Processadas ${data || 0} notificações de danos`);
      return data;
    } catch (err) {
      toast.error('Erro ao processar notificações: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      throw new Error(err instanceof Error ? err.message : 'Failed to process notifications');
    }
  };

  useEffect(() => {
    fetchInspections();
    fetchStatistics();
  }, []);

  return {
    inspections,
    statistics,
    loading,
    error,
    createInspection,
    updateInspection,
    deleteInspection,
    addInspectionItem,
    removeInspectionItem,
    uploadPhoto,
    uploadSignature,
    processDamageNotifications,
    refetch: fetchInspections
  };
};