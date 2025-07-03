import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useVehicles } from '../hooks/useVehicles';
import { useCosts } from '../hooks/useCosts';
import { useServiceNotes } from '../hooks/useServiceNotes';
import { useContracts } from '../hooks/useContracts';
import { useFines } from '../hooks/useFines';
import { useInspections } from '../hooks/useInspections';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart2, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Car, 
  Wrench, 
  AlertTriangle, 
  Users, 
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock
} from 'lucide-react';

// Custom colors for charts
const CHART_COLORS = {
  primary: '#0ea5e9',
  secondary: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6',
  orange: '#f97316',
  lime: '#84cc16',
  cyan: '#06b6d4',
};

// Array of colors for pie charts
const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.error,
  CHART_COLORS.info,
  CHART_COLORS.purple,
  CHART_COLORS.teal,
  CHART_COLORS.orange,
  CHART_COLORS.lime,
  CHART_COLORS.cyan,
];

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  color?: string;
}> = ({ title, value, icon, description, color = 'primary' }) => {
  const bgColorClass = `bg-${color}-100`;
  const textColorClass = `text-${color}-600`;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-secondary-600 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-secondary-900">{value}</p>
            {description && <p className="text-sm text-secondary-500 mt-1">{description}</p>}
          </div>
          <div className={`h-12 w-12 ${bgColorClass} rounded-lg flex items-center justify-center`}>
            <div className={textColorClass}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const Statistics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'costs' | 'fleet' | 'maintenance'>('overview');
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: startOfMonth(subMonths(new Date(), 5)),
    endDate: endOfMonth(new Date())
  });

  // Fetch data from hooks
  const { vehicles } = useVehicles();
  const { costs } = useCosts();
  const { serviceNotes } = useServiceNotes();
  const { contracts } = useContracts();
  const { fines } = useFines();
  const { inspections } = useInspections();

  // Navigate months
  const navigateMonths = (direction: 'prev' | 'next') => {
    setDateRange(prev => {
      const months = direction === 'prev' ? 1 : -1;
      return {
        startDate: subMonths(prev.startDate, months),
        endDate: direction === 'prev' 
          ? subMonths(prev.endDate, months)
          : endOfMonth(subMonths(prev.endDate, months))
      };
    });
  };

  // Filter data by date range
  const filteredCosts = costs.filter(cost => {
    const costDate = new Date(cost.cost_date);
    return costDate >= dateRange.startDate && costDate <= dateRange.endDate;
  });

  const filteredServiceNotes = serviceNotes.filter(note => {
    const startDate = new Date(note.start_date);
    return startDate >= dateRange.startDate && startDate <= dateRange.endDate;
  });

  // Calculate statistics
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'Disponível').length;
  const inMaintenanceVehicles = vehicles.filter(v => v.status === 'Manutenção').length;
  const inUseVehicles = vehicles.filter(v => v.status === 'Em Uso').length;
  
  const totalCosts = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const pendingCosts = filteredCosts.filter(cost => cost.status === 'Pendente').reduce((sum, cost) => sum + cost.amount, 0);
  
  const completedMaintenance = filteredServiceNotes.filter(note => note.status === 'Concluída').length;
  const pendingMaintenance = filteredServiceNotes.filter(note => note.status !== 'Concluída').length;
  
  const activeContracts = contracts.filter(contract => contract.status === 'Ativo').length;
  const pendingFines = fines.filter(fine => fine.status === 'Pendente').length;

  // Prepare chart data
  const vehicleStatusData = [
    { name: 'Disponível', value: availableVehicles, color: CHART_COLORS.success },
    { name: 'Em Uso', value: inUseVehicles, color: CHART_COLORS.info },
    { name: 'Manutenção', value: inMaintenanceVehicles, color: CHART_COLORS.warning },
    { name: 'Inativo', value: totalVehicles - availableVehicles - inUseVehicles - inMaintenanceVehicles, color: CHART_COLORS.error }
  ];

  // Costs by category
  const costsByCategoryData = Object.entries(
    filteredCosts.reduce((acc, cost) => {
      acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Costs by month
  const costsByMonthData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), i);
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const monthCosts = filteredCosts.filter(cost => {
      const costDate = new Date(cost.cost_date);
      return costDate >= monthStart && costDate <= monthEnd;
    });
    
    return {
      name: format(month, 'MMM/yy', { locale: ptBR }),
      value: monthCosts.reduce((sum, cost) => sum + cost.amount, 0)
    };
  }).reverse();

  // Maintenance by type
  const maintenanceByTypeData = Object.entries(
    filteredServiceNotes.reduce((acc, note) => {
      acc[note.maintenance_type] = (acc[note.maintenance_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Costs by vehicle
  const costsByVehicleData = Object.entries(
    filteredCosts.reduce((acc, cost) => {
      if (!cost.vehicle_id) return acc;
      
      const vehicle = vehicles.find(v => v.id === cost.vehicle_id);
      if (!vehicle) return acc;
      
      const key = vehicle.plate;
      acc[key] = (acc[key] || 0) + cost.amount;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900">Estatísticas</h1>
        <p className="text-secondary-600 mt-1 lg:mt-2">Análise detalhada da frota, custos e manutenções</p>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-secondary-500" />
              <span className="text-secondary-700 font-medium">
                {format(dateRange.startDate, 'dd/MM/yyyy')} - {format(dateRange.endDate, 'dd/MM/yyyy')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => navigateMonths('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => navigateMonths('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            <BarChart2 className="h-4 w-4 inline mr-2" />
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('costs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'costs'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            <DollarSign className="h-4 w-4 inline mr-2" />
            Custos
          </button>
          <button
            onClick={() => setActiveTab('fleet')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'fleet'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            <Car className="h-4 w-4 inline mr-2" />
            Frota
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'maintenance'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            <Wrench className="h-4 w-4 inline mr-2" />
            Manutenção
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total de Veículos"
              value={totalVehicles}
              icon={<Car className="h-6 w-6" />}
              color="primary"
            />
            <StatCard
              title="Custo Total"
              value={`R$ ${totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={<DollarSign className="h-6 w-6" />}
              color="error"
              description="No período selecionado"
            />
            <StatCard
              title="Contratos Ativos"
              value={activeContracts}
              icon={<FileText className="h-6 w-6" />}
              color="success"
            />
            <StatCard
              title="Manutenções Pendentes"
              value={pendingMaintenance}
              icon={<Wrench className="h-6 w-6" />}
              color="warning"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Status Distribution */}
            <Card>
              <CardHeader className="p-4 lg:p-6">
                <h3 className="text-lg font-semibold text-secondary-900">Status da Frota</h3>
                <p className="text-secondary-600 text-sm">Distribuição atual dos veículos</p>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vehicleStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {vehicleStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} veículos`, 'Quantidade']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Costs by Month */}
            <Card>
              <CardHeader className="p-4 lg:p-6">
                <h3 className="text-lg font-semibold text-secondary-900">Custos por Mês</h3>
                <p className="text-secondary-600 text-sm">Evolução dos custos nos últimos 6 meses</p>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costsByMonthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { notation: 'compact', compactDisplay: 'short' })}`} />
                      <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
                      <Bar dataKey="value" fill={CHART_COLORS.primary} name="Custo" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* More Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Costs by Category */}
            <Card>
              <CardHeader className="p-4 lg:p-6">
                <h3 className="text-lg font-semibold text-secondary-900">Custos por Categoria</h3>
                <p className="text-secondary-600 text-sm">Distribuição de custos por tipo</p>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costsByCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {costsByCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance by Type */}
            <Card>
              <CardHeader className="p-4 lg:p-6">
                <h3 className="text-lg font-semibold text-secondary-900">Manutenções por Tipo</h3>
                <p className="text-secondary-600 text-sm">Quantidade por tipo de manutenção</p>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={maintenanceByTypeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value) => [`${value} manutenções`, 'Quantidade']} />
                      <Bar dataKey="value" fill={CHART_COLORS.warning} name="Manutenções" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Costs Tab */}
      {activeTab === 'costs' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Custo Total"
              value={`R$ ${totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={<DollarSign className="h-6 w-6" />}
              color="error"
            />
            <StatCard
              title="Custos Pendentes"
              value={`R$ ${pendingCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={<AlertTriangle className="h-6 w-6" />}
              color="warning"
            />
            <StatCard
              title="Multas Pendentes"
              value={pendingFines}
              icon={<FileText className="h-6 w-6" />}
              color="error"
            />
            <StatCard
              title="Custo Médio por Veículo"
              value={`R$ ${(totalCosts / totalVehicles).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={<TrendingUp className="h-6 w-6" />}
              color="info"
            />
          </div>

          {/* Costs by Vehicle */}
          <Card>
            <CardHeader className="p-4 lg:p-6">
              <h3 className="text-lg font-semibold text-secondary-900">Custos por Veículo</h3>
              <p className="text-secondary-600 text-sm">Top 10 veículos com maior custo</p>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costsByVehicleData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { notation: 'compact', compactDisplay: 'short' })}`} />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
                    <Bar dataKey="value" fill={CHART_COLORS.primary} name="Custo" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Costs by Month and Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Costs by Month */}
            <Card>
              <CardHeader className="p-4 lg:p-6">
                <h3 className="text-lg font-semibold text-secondary-900">Evolução de Custos</h3>
                <p className="text-secondary-600 text-sm">Custos mensais no período</p>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={costsByMonthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { notation: 'compact', compactDisplay: 'short' })}`} />
                      <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
                      <Line type="monotone" dataKey="value" stroke={CHART_COLORS.primary} name="Custo" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Costs by Category */}
            <Card>
              <CardHeader className="p-4 lg:p-6">
                <h3 className="text-lg font-semibold text-secondary-900">Custos por Categoria</h3>
                <p className="text-secondary-600 text-sm">Detalhamento por tipo de custo</p>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costsByCategoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { notation: 'compact', compactDisplay: 'short' })}`} />
                      <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
                      <Bar dataKey="value" fill={CHART_COLORS.error} name="Valor" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Fleet Tab */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total de Veículos"
              value={totalVehicles}
              icon={<Car className="h-6 w-6" />}
              color="primary"
            />
            <StatCard
              title="Veículos Disponíveis"
              value={availableVehicles}
              icon={<CheckCircle className="h-6 w-6" />}
              color="success"
            />
            <StatCard
              title="Em Manutenção"
              value={inMaintenanceVehicles}
              icon={<Wrench className="h-6 w-6" />}
              color="warning"
            />
            <StatCard
              title="Em Uso"
              value={inUseVehicles}
              icon={<Users className="h-6 w-6" />}
              color="info"
            />
          </div>

          {/* Fleet Status */}
          <Card>
            <CardHeader className="p-4 lg:p-6">
              <h3 className="text-lg font-semibold text-secondary-900">Status da Frota</h3>
              <p className="text-secondary-600 text-sm">Distribuição de veículos por status</p>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vehicleStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {vehicleStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} veículos`, 'Quantidade']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Fleet Age and Type Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Age Distribution */}
            <Card>
              <CardHeader className="p-4 lg:p-6">
                <h3 className="text-lg font-semibold text-secondary-900">Idade da Frota</h3>
                <p className="text-secondary-600 text-sm">Distribuição por ano de fabricação</p>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        Object.entries(
                          vehicles.reduce((acc, vehicle) => {
                            acc[vehicle.year] = (acc[vehicle.year] || 0) + 1;
                            return acc;
                          }, {} as Record<number, number>)
                        )
                          .map(([year, count]) => ({ year, count }))
                          .sort((a, b) => Number(a.year) - Number(b.year))
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} veículos`, 'Quantidade']} />
                      <Bar dataKey="count" fill={CHART_COLORS.info} name="Veículos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Type Distribution */}
            <Card>
              <CardHeader className="p-4 lg:p-6">
                <h3 className="text-lg font-semibold text-secondary-900">Tipos de Veículos</h3>
                <p className="text-secondary-600 text-sm">Distribuição por tipo de veículo</p>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          Object.entries(
                            vehicles.reduce((acc, vehicle) => {
                              acc[vehicle.type] = (acc[vehicle.type] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([type, count]) => ({ name: type, value: count }))
                        }
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {vehicleStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} veículos`, 'Quantidade']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total de Manutenções"
              value={filteredServiceNotes.length}
              icon={<Wrench className="h-6 w-6" />}
              color="primary"
            />
            <StatCard
              title="Manutenções Concluídas"
              value={completedMaintenance}
              icon={<CheckCircle className="h-6 w-6" />}
              color="success"
            />
            <StatCard
              title="Manutenções Pendentes"
              value={pendingMaintenance}
              icon={<Clock className="h-6 w-6" />}
              color="warning"
            />
            <StatCard
              title="Custo de Manutenção"
              value={`R$ ${filteredCosts
                .filter(cost => cost.category === 'Avulsa' && cost.description.includes('manutenção'))
                .reduce((sum, cost) => sum + cost.amount, 0)
                .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={<DollarSign className="h-6 w-6" />}
              color="error"
            />
          </div>

          {/* Maintenance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Maintenance by Type */}
            <Card>
              <CardHeader className="p-4 lg:p-6">
                <h3 className="text-lg font-semibold text-secondary-900">Manutenções por Tipo</h3>
                <p className="text-secondary-600 text-sm">Distribuição por tipo de manutenção</p>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={maintenanceByTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {maintenanceByTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} manutenções`, 'Quantidade']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Status */}
            <Card>
              <CardHeader className="p-4 lg:p-6">
                <h3 className="text-lg font-semibold text-secondary-900">Status das Manutenções</h3>
                <p className="text-secondary-600 text-sm">Distribuição por status</p>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Concluída', value: completedMaintenance, color: CHART_COLORS.success },
                          { name: 'Em Andamento', value: filteredServiceNotes.filter(note => note.status === 'Em Andamento').length, color: CHART_COLORS.info },
                          { name: 'Aberta', value: filteredServiceNotes.filter(note => note.status === 'Aberta').length, color: CHART_COLORS.warning }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {[
                          { name: 'Concluída', value: completedMaintenance, color: CHART_COLORS.success },
                          { name: 'Em Andamento', value: filteredServiceNotes.filter(note => note.status === 'Em Andamento').length, color: CHART_COLORS.info },
                          { name: 'Aberta', value: filteredServiceNotes.filter(note => note.status === 'Aberta').length, color: CHART_COLORS.warning }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} manutenções`, 'Quantidade']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance by Vehicle */}
          <Card>
            <CardHeader className="p-4 lg:p-6">
              <h3 className="text-lg font-semibold text-secondary-900">Manutenções por Veículo</h3>
              <p className="text-secondary-600 text-sm">Top 10 veículos com mais manutenções</p>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      Object.entries(
                        filteredServiceNotes.reduce((acc, note) => {
                          if (!note.vehicle_id) return acc;
                          
                          const vehicle = vehicles.find(v => v.id === note.vehicle_id);
                          if (!vehicle) return acc;
                          
                          const key = vehicle.plate;
                          acc[key] = (acc[key] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                        .map(([name, value]) => ({ name, value }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 10)
                    }
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip formatter={(value) => [`${value} manutenções`, 'Quantidade']} />
                    <Bar dataKey="value" fill={CHART_COLORS.warning} name="Manutenções" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Statistics;