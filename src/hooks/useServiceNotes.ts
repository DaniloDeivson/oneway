import { useState, useEffect } from 'react';
import { supabase, DEFAULT_TENANT_ID } from '../lib/supabase';
import { Database } from '../types/database';
import toast from 'react-hot-toast';

type ServiceNote = Database['public']['Tables']['service_notes']['Row'] & {
  vehicles?: { plate: string };
  employees?: { name: string; role: string };
};
type ServiceNoteInsert = Database['public']['Tables']['service_notes']['Insert'];
type ServiceNoteUpdate = Database['public']['Tables']['service_notes']['Update'];

export const useServiceNotes = () => {
  const [serviceNotes, setServiceNotes] = useState<ServiceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_notes')
        .select(`
          *,
          vehicles (
            plate
          ),
          employees (
            name,
            role
          )
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setServiceNotes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Erro ao carregar ordens de serviço');
    } finally {
      setLoading(false);
    }
  };

  const createServiceNote = async (serviceNoteData: Omit<ServiceNoteInsert, 'tenant_id'>) => {
    try {
      const { data, error } = await supabase
        .from('service_notes')
        .insert([{ ...serviceNoteData, tenant_id: DEFAULT_TENANT_ID }])
        .select(`
          *,
          vehicles (
            plate
          ),
          employees (
            name,
            role
          )
        `)
        .single();

      if (error) throw error;
      setServiceNotes(prev => [data, ...prev]);
      toast.success('Ordem de serviço criada com sucesso!');
      return data;
    } catch (err) {
      toast.error('Erro ao criar ordem de serviço: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      throw new Error(err instanceof Error ? err.message : 'Failed to create service note');
    }
  };

  const updateServiceNote = async (id: string, updates: ServiceNoteUpdate) => {
    try {
      const { data, error } = await supabase
        .from('service_notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          vehicles (
            plate
          ),
          employees (
            name,
            role
          )
        `)
        .single();

      if (error) throw error;
      setServiceNotes(prev => prev.map(sn => sn.id === id ? data : sn));
      toast.success('Ordem de serviço atualizada com sucesso!');
      return data;
    } catch (err) {
      toast.error('Erro ao atualizar ordem de serviço: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      throw new Error(err instanceof Error ? err.message : 'Failed to update service note');
    }
  };

  const deleteServiceNote = async (id: string) => {
    try {
      // First check if there are any active check-ins for this service note
      const { data: activeCheckins, error: checkError } = await supabase
        .from('maintenance_checkins')
        .select('id')
        .eq('service_note_id', id)
        .is('checkout_at', null)
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (activeCheckins && activeCheckins.length > 0) {
        throw new Error('Não é possível excluir uma ordem de serviço com check-in ativo. Faça o check-out primeiro.');
      }
      
      const { error } = await supabase
        .from('service_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setServiceNotes(prev => prev.filter(sn => sn.id !== id));
      toast.success('Ordem de serviço excluída com sucesso!');
    } catch (err) {
      toast.error('Erro ao excluir ordem de serviço: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      throw new Error(err instanceof Error ? err.message : 'Failed to delete service note');
    }
  };

  useEffect(() => {
    fetchServiceNotes();
  }, []);

  return {
    serviceNotes,
    loading,
    error,
    createServiceNote,
    updateServiceNote,
    deleteServiceNote,
    refetch: fetchServiceNotes
  };
};