export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  type: 'Furgão' | 'Van';
  color: string;
  fuel: 'Diesel' | 'Gasolina' | 'Elétrico';
  category: string;
  chassis: string;
  renavam: string;
  cargoCapacity: number;
  location: string;
  acquisitionDate: string;
  acquisitionValue: number;
  totalCosts?: number;
  status: 'Disponível' | 'Em Uso' | 'Manutenção' | 'Inativo';
}

export interface Cost {
  id: string;
  category: 'Multa' | 'Funilaria' | 'Seguro' | 'Avulsa';
  vehicleId: string;
  vehiclePlate?: string;
  description: string;
  amount: number;
  costDate: string;
  status: 'Pendente' | 'Pago';
  documentRef?: string;
  observations?: string;
}

export interface ServiceNote {
  id: string;
  vehicleId: string;
  vehiclePlate?: string;
  maintenanceType: string;
  startDate: string;
  mechanic: string;
  priority: 'Baixa' | 'Média' | 'Alta';
  mileage: number;
  description: string;
  observations?: string;
  status: 'Aberta' | 'Em Andamento' | 'Concluída';
}

export interface Part {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unitCost: number;
  minStock: number;
}

export interface Customer {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
}

export interface Contract {
  id: string;
  customerId: string;
  customerName?: string;
  vehicleId: string;
  vehiclePlate?: string;
  startDate: string;
  endDate: string;
  dailyRate: number;
  status: 'Ativo' | 'Finalizado' | 'Cancelado';
}

export interface Fine {
  id: string;
  vehicleId: string;
  vehiclePlate?: string;
  driverName: string;
  fineNumber: string;
  infractionType: string;
  amount: number;
  infractionDate: string;
  dueDate: string;
  notified: boolean;
  status: 'Pendente' | 'Pago' | 'Contestado';
}

export interface StatsData {
  totalVehicles: number;
  activeContracts: number;
  monthlyRevenue: number;
  monthlyCosts: number;
  pendingMaintenance: number;
  activeVehicles: number;
}