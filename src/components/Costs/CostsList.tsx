import React from 'react';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { Edit, Eye, AlertTriangle, Car, User, FileText, Calendar, DollarSign, CheckCircle } from 'lucide-react';

interface CostsListProps {
  costs: any[];
  onView: (cost: any) => void;
  onEdit?: (cost: any) => void;
  onAuthorize?: (cost: any) => void;
  canEdit?: boolean;
  canAuthorize?: boolean;
}

export const CostsList: React.FC<CostsListProps> = ({
  costs,
  onView,
  onEdit,
  onAuthorize,
  canEdit = false,
  canAuthorize = false
}) => {
  const getStatusBadge = (status: string) => {
    if (status === 'Pago') {
      return <Badge variant="success">{status}</Badge>;
    } else if (status === 'Autorizado') {
      return <Badge variant="info">{status}</Badge>;
    } else {
      return <Badge variant="warning">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      'Multa': 'error',
      'Funilaria': 'warning',
      'Seguro': 'info',
      'Avulsa': 'secondary',
      'Compra': 'primary',
      'Excesso Km': 'error',
      'Diária Extra': 'warning',
      'Combustível': 'info',
      'Avaria': 'error'
    } as const;

    return <Badge variant={variants[category as keyof typeof variants] || 'secondary'}>{category}</Badge>;
  };

  // Helper function to check if cost is auto-generated with amount to define
  const isAmountToDefine = (cost: any) => {
    return cost.amount === 0 && cost.status === 'Pendente';
  };

  // Helper function to format cost amount
  const formatCostAmount = (cost: any) => {
    if (isAmountToDefine(cost)) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-warning-600 font-medium">A Definir</span>
          <AlertTriangle className="h-4 w-4 text-warning-600" />
        </div>
      );
    }
    return `R$ ${cost.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-secondary-50">
          <tr>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Data</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Origem</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Categoria</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Veículo</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Cliente</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Descrição</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Responsável</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Valor</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Status</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Ação</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-200">
          {costs.map((cost) => (
            <tr key={cost.id} className={`hover:bg-secondary-50 ${isAmountToDefine(cost) ? 'bg-warning-25' : ''}`}>
              <td className="py-4 px-6 text-sm text-secondary-600">
                {new Date(cost.cost_date).toLocaleDateString('pt-BR')}
              </td>
              <td className="py-4 px-6">
                <Badge variant="secondary" className="text-xs">
                  {(() => {
                    if (cost.origin === 'Patio') {
                      if (cost.description?.toLowerCase().includes('check-out')) return 'Controle de Pátio (Check-Out)';
                      if (cost.description?.toLowerCase().includes('check-in')) return 'Controle de Pátio (Check-In)';
                      return 'Controle de Pátio';
                    }
                    if (cost.origin === 'Manutencao') return 'Manutenção';
                    if (cost.origin === 'Sistema') return 'Sistema';
                    if (cost.origin === 'Compras') return 'Compras';
                    return cost.origin;
                  })()}
                </Badge>
              </td>
              <td className="py-4 px-6">
                {getCategoryBadge(cost.category)}
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center">
                  <Car className="h-4 w-4 text-secondary-400 mr-2" />
                  <span className="text-sm font-medium text-secondary-900">{cost.vehicle_plate || '-'}</span>
                </div>
              </td>
              <td className="py-4 px-6 text-sm text-secondary-600">
                {cost.customer_name ? (
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-secondary-400 mr-2" />
                    <span>{cost.customer_name}</span>
                  </div>
                ) : (
                  <span>-</span>
                )}
                {cost.contract_id && (
                  <div className="text-xs text-secondary-500 mt-1 flex items-center">
                    <FileText className="h-3 w-3 mr-1" />
                    Contrato #{cost.contract_id.substring(0, 8)}
                  </div>
                )}
              </td>
              <td className="py-4 px-6 text-sm text-secondary-600 max-w-xs">
                <div className="truncate" title={cost.description}>
                  {cost.description}
                </div>
              </td>
              <td className="py-4 px-6 text-sm text-secondary-600">
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {cost.created_by_name || 'Sistema'}
                </div>
              </td>
              <td className="py-4 px-6 text-sm font-medium text-secondary-900">
                {formatCostAmount(cost)}
              </td>
              <td className="py-4 px-6">
                {getStatusBadge(cost.status)}
              </td>
              <td className="py-4 px-6 text-sm text-secondary-600">
                {cost.origin === 'Patio' && cost.description?.toLowerCase().includes('check-out') ? 'Check-Out' :
                 cost.origin === 'Patio' && cost.description?.toLowerCase().includes('check-in') ? 'Check-In' :
                 '-'}
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center space-x-2">
                  {cost.status === 'Pendente' && cost.category === 'Compra' && canAuthorize && (
                    <Button 
                      onClick={() => onAuthorize && onAuthorize(cost)}
                      variant="success"
                      size="sm"
                      className="flex items-center"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Autorizar
                    </Button>
                  )}
                  <button 
                    onClick={() => onView(cost)}
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    Visualizar
                  </button>
                  {canEdit && (
                    <button 
                      onClick={() => onEdit && onEdit(cost)}
                      className="text-secondary-600 hover:text-secondary-800"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CostsList;