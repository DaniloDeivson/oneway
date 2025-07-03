import { useState, useEffect } from 'react';
import { supabase, DEFAULT_TENANT_ID } from '../lib/supabase';

export interface PurchaseOrder {
  id: string;
  tenant_id: string;
  supplier_id: string;
  order_number: string;
  order_date: string;
  total_amount: number;
  status: 'Pending' | 'Received' | 'Cancelled';
  created_by_employee_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // From view
  supplier_name?: string;
  supplier_document?: string;
  created_by_name?: string;
  created_by_role?: string;
  item_count?: number;
}

export interface PurchaseOrderInsert {
  supplier_id: string;
  order_number?: string;
  order_date: string;
  total_amount: number;
  status: 'Pending' | 'Received' | 'Cancelled';
  created_by_employee_id: string | null;
  notes?: string | null;
}

export interface PurchaseOrderUpdate {
  supplier_id?: string;
  order_date?: string;
  total_amount?: number;
  status?: 'Pending' | 'Received' | 'Cancelled';
  notes?: string | null;
  created_by_employee_id?: string | null;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  part_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
  // From view
  part_name?: string;
  part_sku?: string;
}

export interface PurchaseOrderItemInsert {
  purchase_order_id: string;
  part_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface PurchaseOrderStatistics {
  total_orders: number;
  pending_orders: number;
  received_orders: number;
  cancelled_orders: number;
  total_amount: number;
  pending_amount: number;
  avg_order_amount: number;
  most_ordered_part: string | null;
  top_supplier: string | null;
}

export const usePurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [statistics, setStatistics] = useState<PurchaseOrderStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      
      // Try to use the detailed view first
      let { data, error } = await supabase
        .from('vw_purchase_orders_detailed')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('created_at', { ascending: false });

      // If view doesn't exist, query directly
      if (error || !data) {
        const { data: directData, error: directError } = await supabase
          .from('purchase_orders')
          .select(`
            *,
            suppliers (
              name,
              document
            ),
            employees (
              name,
              role
            )
          `)
          .eq('tenant_id', DEFAULT_TENANT_ID)
          .order('created_at', { ascending: false });

        if (directError) throw directError;
        
        // Transform data to match view structure
        data = directData?.map(po => ({
          ...po,
          supplier_name: po.suppliers?.name,
          supplier_document: po.suppliers?.document,
          created_by_name: po.employees?.name,
          created_by_role: po.employees?.role,
          item_count: 0 // We'll need a separate query to get this
        })) || [];
      }

      setPurchaseOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase
        .rpc('fn_purchase_order_statistics', { p_tenant_id: DEFAULT_TENANT_ID });

      if (error) throw error;
      if (data && data.length > 0) {
        setStatistics(data[0]);
      }
    } catch (err) {
      console.error('Error fetching purchase order statistics:', err);
    }
  };

  const fetchPurchaseOrderItems = async (purchaseOrderId: string): Promise<PurchaseOrderItem[]> => {
    try {
      // Try to use the detailed view first
      let { data, error } = await supabase
        .from('vw_purchase_order_items_detailed')
        .select('*')
        .eq('purchase_order_id', purchaseOrderId)
        .order('created_at', { ascending: true });

      // If view doesn't exist, query directly
      if (error || !data) {
        const { data: directData, error: directError } = await supabase
          .from('purchase_order_items')
          .select(`
            *,
            parts (
              name,
              sku
            )
          `)
          .eq('purchase_order_id', purchaseOrderId)
          .order('created_at', { ascending: true });

        if (directError) throw directError;
        
        // Transform data to match view structure
        data = directData?.map(item => ({
          ...item,
          part_name: item.parts?.name,
          part_sku: item.parts?.sku
        })) || [];
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching purchase order items:', err);
      return [];
    }
  };

  const createPurchaseOrder = async (orderData: PurchaseOrderInsert, items: PurchaseOrderItemInsert[]) => {
    try {
      // Start a transaction
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert([{ ...orderData, tenant_id: DEFAULT_TENANT_ID }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert items
      if (items.length > 0) {
        const itemsWithOrderId = items.map(item => ({
          ...item,
          purchase_order_id: order.id
        }));

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsWithOrderId);

        if (itemsError) throw itemsError;
      }

      // Refresh the list
      await fetchPurchaseOrders();
      await fetchStatistics();
      
      return order;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create purchase order');
    }
  };

  const updatePurchaseOrder = async (id: string, updates: PurchaseOrderUpdate) => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh the list
      await fetchPurchaseOrders();
      await fetchStatistics();
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update purchase order');
    }
  };

  const deletePurchaseOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh the list
      await fetchPurchaseOrders();
      await fetchStatistics();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete purchase order');
    }
  };

  const addPurchaseOrderItem = async (item: PurchaseOrderItemInsert) => {
    try {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .insert([item])
        .select()
        .single();

      if (error) throw error;
      
      // Update the total amount in the purchase order
      const { data: items } = await supabase
        .from('purchase_order_items')
        .select('line_total')
        .eq('purchase_order_id', item.purchase_order_id);
      
      const totalAmount = items?.reduce((sum, item) => sum + item.line_total, 0) || 0;
      
      await updatePurchaseOrder(item.purchase_order_id, { total_amount: totalAmount });
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add purchase order item');
    }
  };

  const deletePurchaseOrderItem = async (id: string, purchaseOrderId: string) => {
    try {
      const { error } = await supabase
        .from('purchase_order_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update the total amount in the purchase order
      const { data: items } = await supabase
        .from('purchase_order_items')
        .select('line_total')
        .eq('purchase_order_id', purchaseOrderId);
      
      const totalAmount = items?.reduce((sum, item) => sum + item.line_total, 0) || 0;
      
      await updatePurchaseOrder(purchaseOrderId, { total_amount: totalAmount });
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete purchase order item');
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
    fetchStatistics();
  }, []);

  return {
    purchaseOrders,
    statistics,
    loading,
    error,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    fetchPurchaseOrderItems,
    addPurchaseOrderItem,
    deletePurchaseOrderItem,
    refetch: fetchPurchaseOrders,
    refetchStatistics: fetchStatistics
  };
};