export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          role: 'Admin' | 'Mechanic' | 'PatioInspector' | 'Sales' | 'Driver' | 'FineAdmin' | 'Manager';
          employee_code: string | null;
          contact_info: any;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          role: 'Admin' | 'Mechanic' | 'PatioInspector' | 'Sales' | 'Driver' | 'FineAdmin' | 'Manager';
          employee_code?: string | null;
          contact_info?: any;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          role?: 'Admin' | 'Mechanic' | 'PatioInspector' | 'Sales' | 'Driver' | 'FineAdmin' | 'Manager';
          employee_code?: string | null;
          contact_info?: any;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          tenant_id: string;
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
          maintenance_status: 'Available' | 'In_Maintenance' | 'Reserved' | 'Rented';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          plate: string;
          model: string;
          year: number;
          type: 'Furgão' | 'Van';
          color?: string | null;
          fuel?: 'Diesel' | 'Gasolina' | 'Elétrico' | null;
          category: string;
          chassis?: string | null;
          renavam?: string | null;
          cargo_capacity?: number | null;
          location?: string | null;
          acquisition_date?: string | null;
          acquisition_value?: number | null;
          status?: 'Disponível' | 'Em Uso' | 'Manutenção' | 'Inativo';
          maintenance_status?: 'Available' | 'In_Maintenance' | 'Reserved' | 'Rented';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          plate?: string;
          model?: string;
          year?: number;
          type?: 'Furgão' | 'Van';
          color?: string | null;
          fuel?: 'Diesel' | 'Gasolina' | 'Elétrico' | null;
          category?: string;
          chassis?: string | null;
          renavam?: string | null;
          cargo_capacity?: number | null;
          location?: string | null;
          acquisition_date?: string | null;
          acquisition_value?: number | null;
          status?: 'Disponível' | 'Em Uso' | 'Manutenção' | 'Inativo';
          maintenance_status?: 'Available' | 'In_Maintenance' | 'Reserved' | 'Rented';
          created_at?: string;
          updated_at?: string;
        };
      };
      maintenance_types: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      mechanics: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          employee_code: string | null;
          phone: string | null;
          specialization: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          employee_code?: string | null;
          phone?: string | null;
          specialization?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          employee_code?: string | null;
          phone?: string | null;
          specialization?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      parts: {
        Row: {
          id: string;
          tenant_id: string;
          sku: string;
          name: string;
          quantity: number;
          unit_cost: number;
          min_stock: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          sku: string;
          name: string;
          quantity?: number;
          unit_cost: number;
          min_stock?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          sku?: string;
          name?: string;
          quantity?: number;
          unit_cost?: number;
          min_stock?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      stock_movements: {
        Row: {
          id: string;
          tenant_id: string;
          part_id: string;
          service_note_id: string | null;
          type: 'Entrada' | 'Saída';
          quantity: number;
          movement_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          part_id: string;
          service_note_id?: string | null;
          type: 'Entrada' | 'Saída';
          quantity: number;
          movement_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          part_id?: string;
          service_note_id?: string | null;
          type?: 'Entrada' | 'Saída';
          quantity?: number;
          movement_date?: string;
          created_at?: string;
        };
      };
      service_order_parts: {
        Row: {
          id: string;
          tenant_id: string;
          service_note_id: string;
          part_id: string;
          quantity_used: number;
          unit_cost_at_time: number;
          total_cost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          service_note_id: string;
          part_id: string;
          quantity_used: number;
          unit_cost_at_time: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          service_note_id?: string;
          part_id?: string;
          quantity_used?: number;
          unit_cost_at_time?: number;
          created_at?: string;
        };
      };
      costs: {
        Row: {
          id: string;
          tenant_id: string;
          category: 'Multa' | 'Funilaria' | 'Seguro' | 'Avulsa';
          vehicle_id: string;
          description: string;
          amount: number;
          cost_date: string;
          status: 'Pendente' | 'Pago';
          document_ref: string | null;
          observations: string | null;
          origin: 'Manual' | 'Patio' | 'Manutencao' | 'Sistema';
          created_by_employee_id: string | null;
          source_reference_id: string | null;
          source_reference_type: 'inspection_item' | 'service_note' | 'manual' | 'system' | 'fine' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          category: 'Multa' | 'Funilaria' | 'Seguro' | 'Avulsa';
          vehicle_id: string;
          description: string;
          amount: number;
          cost_date: string;
          status?: 'Pendente' | 'Pago';
          document_ref?: string | null;
          observations?: string | null;
          origin?: 'Manual' | 'Patio' | 'Manutencao' | 'Sistema';
          created_by_employee_id?: string | null;
          source_reference_id?: string | null;
          source_reference_type?: 'inspection_item' | 'service_note' | 'manual' | 'system' | 'fine' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          category?: 'Multa' | 'Funilaria' | 'Seguro' | 'Avulsa';
          vehicle_id?: string;
          description?: string;
          amount?: number;
          cost_date?: string;
          status?: 'Pendente' | 'Pago';
          document_ref?: string | null;
          observations?: string | null;
          origin?: 'Manual' | 'Patio' | 'Manutencao' | 'Sistema';
          created_by_employee_id?: string | null;
          source_reference_id?: string | null;
          source_reference_type?: 'inspection_item' | 'service_note' | 'manual' | 'system' | 'fine' | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      service_notes: {
        Row: {
          id: string;
          tenant_id: string;
          vehicle_id: string;
          employee_id: string | null;
          maintenance_type: string;
          start_date: string;
          end_date: string | null;
          mechanic: string;
          priority: 'Baixa' | 'Média' | 'Alta';
          mileage: number | null;
          description: string;
          observations: string | null;
          status: 'Aberta' | 'Em Andamento' | 'Concluída';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          vehicle_id: string;
          employee_id?: string | null;
          maintenance_type: string;
          start_date: string;
          end_date?: string | null;
          mechanic: string;
          priority?: 'Baixa' | 'Média' | 'Alta';
          mileage?: number | null;
          description: string;
          observations?: string | null;
          status?: 'Aberta' | 'Em Andamento' | 'Concluída';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          vehicle_id?: string;
          employee_id?: string | null;
          maintenance_type?: string;
          start_date?: string;
          end_date?: string | null;
          mechanic?: string;
          priority?: 'Baixa' | 'Média' | 'Alta';
          mileage?: number | null;
          description?: string;
          observations?: string | null;
          status?: 'Aberta' | 'Em Andamento' | 'Concluída';
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          document: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          document: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          document?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contracts: {
        Row: {
          id: string;
          tenant_id: string;
          customer_id: string;
          vehicle_id: string;
          salesperson_id: string | null;
          start_date: string;
          end_date: string;
          daily_rate: number;
          status: 'Ativo' | 'Finalizado' | 'Cancelado';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_id: string;
          vehicle_id: string;
          salesperson_id?: string | null;
          start_date: string;
          end_date: string;
          daily_rate: number;
          status?: 'Ativo' | 'Finalizado' | 'Cancelado';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          customer_id?: string;
          vehicle_id?: string;
          salesperson_id?: string | null;
          start_date?: string;
          end_date?: string;
          daily_rate?: number;
          status?: 'Ativo' | 'Finalizado' | 'Cancelado';
          created_at?: string;
          updated_at?: string;
        };
      };
      fines: {
        Row: {
          id: string;
          tenant_id: string;
          vehicle_id: string;
          driver_id: string | null;
          employee_id: string | null;
          fine_number: string;
          infraction_type: string;
          amount: number;
          infraction_date: string;
          due_date: string;
          notified: boolean;
          status: 'Pendente' | 'Pago' | 'Contestado';
          document_ref: string | null;
          observations: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          vehicle_id: string;
          driver_id?: string | null;
          employee_id?: string | null;
          fine_number?: string;
          infraction_type: string;
          amount: number;
          infraction_date: string;
          due_date: string;
          notified?: boolean;
          status?: 'Pendente' | 'Pago' | 'Contestado';
          document_ref?: string | null;
          observations?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          vehicle_id?: string;
          driver_id?: string | null;
          employee_id?: string | null;
          fine_number?: string;
          infraction_type?: string;
          amount?: number;
          infraction_date?: string;
          due_date?: string;
          notified?: boolean;
          status?: 'Pendente' | 'Pago' | 'Contestado';
          document_ref?: string | null;
          observations?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inspections: {
        Row: {
          id: string;
          tenant_id: string;
          vehicle_id: string;
          employee_id: string | null;
          inspection_type: 'CheckIn' | 'CheckOut';
          inspected_by: string;
          inspected_at: string;
          signature_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          vehicle_id: string;
          employee_id?: string | null;
          inspection_type: 'CheckIn' | 'CheckOut';
          inspected_by: string;
          inspected_at?: string;
          signature_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          vehicle_id?: string;
          employee_id?: string | null;
          inspection_type?: 'CheckIn' | 'CheckOut';
          inspected_by?: string;
          inspected_at?: string;
          signature_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inspection_items: {
        Row: {
          id: string;
          inspection_id: string;
          location: string;
          description: string;
          damage_type: 'Arranhão' | 'Amassado' | 'Quebrado' | 'Desgaste' | 'Outro';
          severity: 'Baixa' | 'Média' | 'Alta';
          photo_url: string | null;
          requires_repair: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          inspection_id: string;
          location: string;
          description: string;
          damage_type: 'Arranhão' | 'Amassado' | 'Quebrado' | 'Desgaste' | 'Outro';
          severity?: 'Baixa' | 'Média' | 'Alta';
          photo_url?: string | null;
          requires_repair?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          inspection_id?: string;
          location?: string;
          description?: string;
          damage_type?: 'Arranhão' | 'Amassado' | 'Quebrado' | 'Desgaste' | 'Outro';
          severity?: 'Baixa' | 'Média' | 'Alta';
          photo_url?: string | null;
          requires_repair?: boolean;
          created_at?: string;
        };
      };
      damage_notifications: {
        Row: {
          id: string;
          tenant_id: string;
          cost_id: string;
          inspection_item_id: string;
          notification_data: any;
          status: 'pending' | 'sent' | 'failed';
          sent_at: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          cost_id: string;
          inspection_item_id: string;
          notification_data: any;
          status?: 'pending' | 'sent' | 'failed';
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          cost_id?: string;
          inspection_item_id?: string;
          notification_data?: any;
          status?: 'pending' | 'sent' | 'failed';
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
      };
      drivers: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          cpf: string | null;
          license_no: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          cpf?: string | null;
          license_no?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          cpf?: string | null;
          license_no?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      maintenance_checkins: {
        Row: {
          id: string;
          tenant_id: string;
          service_note_id: string;
          mechanic_id: string;
          checkin_at: string;
          checkout_at: string | null;
          notes: string | null;
          signature_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          service_note_id: string;
          mechanic_id: string;
          checkin_at?: string;
          checkout_at?: string | null;
          notes?: string | null;
          signature_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          service_note_id?: string;
          mechanic_id?: string;
          checkin_at?: string;
          checkout_at?: string | null;
          notes?: string | null;
          signature_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}