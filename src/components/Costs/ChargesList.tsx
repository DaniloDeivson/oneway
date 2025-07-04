import React from 'react';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { Edit, AlertTriangle, Car, User, FileText, Calendar, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { Database } from '../../types/database';

type CustomerCharge = Database['public']['Tables']['customer_charges']['Row'] & {
  customers?: { name: string };
  contracts?: { 
    vehicles?: { plate: string; model: string }; 
  };
  vehicles?: { plate: string; model: string };
};

interface ChargesListProps {
  charges: CustomerCharge[];
  onView: (charge: CustomerCharge) => void;
  onEdit?: (charge: CustomerCharge) => void;
  onMarkAsPaid?: (charge: CustomerCharge) => void;
  onMarkAsAuthorized?: (charge: CustomerCharge) => void;
  canEdit?: boolean;
  canMarkAsPaid?: boolean;
  canMarkAsAuthorized?: boolean;
}

export const ChargesList: React.FC<ChargesListProps> = ({
  charges,
  onView,
  onEdit,
  onMarkAsPaid,
  onMarkAsAuthorized,
  canEdit = false,
  canMarkAsPaid = false,
  canMarkAsAuthorized = false
}) => {
  const getStatusBadge = (status: string) => {
    if (status === 'Pago') {
      return <Badge variant="success">{status}</Badge>;
    } else if (status === 'Autorizado') {
      return <Badge variant="info">{status}</Badge>;
    } else if (status === 'Contestado') {
      return <Badge variant="error">{status}</Badge>;
    } else {
      return <Badge variant="warning">{status}</Badge>;
    }
  };

  const getChargeTypeBadge = (chargeType: string) => {
    const variants = {
      'Dano': 'error',
      'Excesso KM': 'warning',
      'Combustível': 'info',
      'Diária Extra': 'info'
    } as const;

    return <Badge variant={variants[chargeType as keyof typeof variants] || 'secondary'}>{chargeType}</Badge>;
  };

  const getOriginBadge = (generatedFrom: string) => {
    return (
      <Badge variant="secondary" className="text-xs">
        {generatedFrom === 'Automatic' ? 'Automática' : 'Manual'}
      </Badge>
    );
  };

  // Helper function to check if charge is overdue
  const isOverdue = (charge: CustomerCharge) => {
    if (charge.status === 'Pago') return false;
    const today = new Date();
    const dueDate = new Date(charge.due_date);
    return dueDate < today;
  };

  // Helper function to format charge amount
  const formatChargeAmount = (charge: CustomerCharge) => {
    return `R$ ${charge.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-secondary-50">
          <tr>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Data</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Origem</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Tipo</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Veículo</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Cliente</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Descrição</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Vencimento</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Valor</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Status</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-200">
          {charges.map((charge) => (
            <tr key={charge.id} className={`hover:bg-secondary-50 ${isOverdue(charge) ? 'bg-red-25' : ''}`}>
              <td className="py-4 px-6 text-sm text-secondary-600">
                {new Date(charge.charge_date).toLocaleDateString('pt-BR')}
              </td>
              <td className="py-4 px-6">
                {getOriginBadge(charge.generated_from)}
              </td>
              <td className="py-4 px-6">
                {getChargeTypeBadge(charge.charge_type)}
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center">
                  <Car className="h-4 w-4 text-secondary-400 mr-2" />
                  <span className="text-sm font-medium text-secondary-900">
                    {charge.vehicles?.plate || charge.contracts?.vehicles?.plate || '-'}
                  </span>
                </div>
                {charge.vehicles?.model || charge.contracts?.vehicles?.model ? (
                  <div className="text-xs text-secondary-500 mt-1">
                    {charge.vehicles?.model || charge.contracts?.vehicles?.model}
                  </div>
                ) : null}
              </td>
              <td className="py-4 px-6 text-sm text-secondary-600">
                {charge.customers?.name ? (
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-secondary-400 mr-2" />
                    <span>{charge.customers.name}</span>
                  </div>
                ) : (
                  <span>-</span>
                )}
                {charge.contract_id && (
                  <div className="text-xs text-secondary-500 mt-1 flex items-center">
                    <FileText className="h-3 w-3 mr-1" />
                    Contrato #{charge.contract_id.substring(0, 8)}
                  </div>
                )}
              </td>
              <td className="py-4 px-6 text-sm text-secondary-600 max-w-xs">
                <div className="truncate" title={charge.description || 'Sem descrição'}>
                  {charge.description || 'Sem descrição'}
                </div>
              </td>
              <td className="py-4 px-6 text-sm text-secondary-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-secondary-400 mr-2" />
                  <span className={isOverdue(charge) ? 'text-red-600 font-medium' : ''}>
                    {new Date(charge.due_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {isOverdue(charge) && (
                  <div className="text-xs text-red-600 mt-1 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Vencido
                  </div>
                )}
              </td>
              <td className="py-4 px-6 text-sm font-medium text-secondary-900">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-secondary-400 mr-1" />
                  {formatChargeAmount(charge)}
                </div>
              </td>
              <td className="py-4 px-6">
                {getStatusBadge(charge.status)}
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center space-x-2">
                  {charge.status === 'Pendente' && canMarkAsPaid && (
                    <Button 
                      onClick={() => onMarkAsPaid && onMarkAsPaid(charge)}
                      variant="success"
                      size="sm"
                      className="flex items-center"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Pago
                    </Button>
                  )}
                  {charge.status === 'Pendente' && canMarkAsAuthorized && (
                    <Button 
                      onClick={() => onMarkAsAuthorized && onMarkAsAuthorized(charge)}
                      variant="secondary"
                      size="sm"
                      className="flex items-center"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Autorizar
                    </Button>
                  )}
                  <button 
                    onClick={() => onView(charge)}
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    Visualizar
                  </button>
                  {canEdit && (
                    <button 
                      onClick={() => onEdit && onEdit(charge)}
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

export default ChargesList; 