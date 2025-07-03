import React from 'react';
import { Camera, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';

interface DamageCartSummaryProps {
  damageCount: number;
  inspectionType: string;
  contractId?: string;
  onOpenDamageCart: () => void;
}

export const DamageCartSummary: React.FC<DamageCartSummaryProps> = ({
  damageCount,
  inspectionType,
  contractId,
  onOpenDamageCart
}) => {
  return (
    <div className="border-t pt-4 lg:pt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
          <Camera className="h-5 w-5 mr-2" />
          Danos Detectados ({damageCount})
        </h3>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onOpenDamageCart}
        >
          <Camera className="h-4 w-4 mr-2" />
          Registrar Danos
        </Button>
      </div>

      {damageCount > 0 ? (
        <div className="bg-secondary-50 p-3 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-secondary-600">Total de danos:</span>
            <span className="font-medium">{damageCount}</span>
          </div>
          
          {/* Alert for CheckOut with damages */}
          {inspectionType === 'CheckOut' && damageCount > 0 && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 mt-3">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-warning-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning-800">
                    Notificação Automática
                  </p>
                  <p className="text-xs text-warning-700 mt-1">
                    Um email será enviado automaticamente ao gerente para aprovação de orçamento dos danos detectados.
                    Um lançamento de custo será criado no sistema com valor "A Definir".
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Alert for CheckIn with contract and damages */}
          {inspectionType === 'CheckIn' && contractId && damageCount > 0 && (
            <div className="bg-info-50 border border-info-200 rounded-lg p-3 mt-3">
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-info-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-info-800">
                    Cobrança Automática
                  </p>
                  <p className="text-xs text-info-700 mt-1">
                    Os danos detectados serão automaticamente vinculados ao cliente do contrato selecionado.
                    Um lançamento de cobrança será criado no departamento de Cobrança.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-secondary-500">
          <Camera className="h-8 w-8 mx-auto mb-2" />
          <p>Nenhum dano registrado</p>
          <p className="text-sm mt-1">Use o botão acima para registrar danos encontrados</p>
        </div>
      )}
    </div>
  );
};