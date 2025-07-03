import { useState, useEffect } from 'react';
import { supabase, DEFAULT_TENANT_ID } from '../lib/supabase';

export interface ServiceOrderPart {
  id: string;
  service_note_id: string;
  part_id: string;
  quantity_used: number;
  unit_cost_at_time: number;
  total_cost: number;
  created_at: string;
  parts?: {
    sku: string;
    name: string;
    quantity: number;
  };
}

export interface PartCartItem {
  part_id: string;
  sku: string;
  name: string;
  available_quantity: number;
  quantity_to_use: number;
  unit_cost: number;
  total_cost: number;
}

export const useServiceOrderParts = (serviceNoteId?: string) => {
  const [serviceOrderParts, setServiceOrderParts] = useState<ServiceOrderPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceOrderParts = async (noteId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_order_parts')
        .select(`
          *,
          parts (
            sku,
            name,
            quantity
          )
        `)
        .eq('service_note_id', noteId)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServiceOrderParts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addPartsToServiceOrder = async (serviceNoteId: string, parts: PartCartItem[]) => {
    try {
      const partsToInsert = parts.map(part => ({
        tenant_id: DEFAULT_TENANT_ID,
        service_note_id: serviceNoteId,
        part_id: part.part_id,
        quantity_used: part.quantity_to_use,
        unit_cost_at_time: part.unit_cost
      }));

      const { data, error } = await supabase
        .from('service_order_parts')
        .insert(partsToInsert)
        .select(`
          *,
          parts (
            sku,
            name,
            quantity
          )
        `);

      if (error) throw error;
      
      if (serviceNoteId) {
        await fetchServiceOrderParts(serviceNoteId);
      }
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add parts to service order');
    }
  };

  const removePartFromServiceOrder = async (serviceOrderPartId: string) => {
    try {
      const { error } = await supabase
        .from('service_order_parts')
        .delete()
        .eq('id', serviceOrderPartId);

      if (error) throw error;
      
      setServiceOrderParts(prev => prev.filter(p => p.id !== serviceOrderPartId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to remove part from service order');
    }
  };

  useEffect(() => {
    if (serviceNoteId) {
      fetchServiceOrderParts(serviceNoteId);
    }
  }, [serviceNoteId]);

  return {
    serviceOrderParts,
    loading,
    error,
    addPartsToServiceOrder,
    removePartFromServiceOrder,
    refetch: serviceNoteId ? () => fetchServiceOrderParts(serviceNoteId) : undefined
  };
};