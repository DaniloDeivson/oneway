import React from 'react';
import { FileText } from 'lucide-react';

interface ContractSelectorProps {
  availableContracts: any[];
  activeContract: any;
  contractId: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const ContractSelector: React.FC<ContractSelectorProps> = ({
  availableContracts,
  activeContract,
  contractId,
  onChange
}) => {
  if (availableContracts.length === 0) {
    return (
      <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200">
        <p className="text-sm text-secondary-600">
          Nenhum contrato ativo encontrado para este veículo.
        </p>
        <label className="block text-sm font-medium text-secondary-700 mt-2 mb-1">
          Contrato de Locação (opcional)
        </label>
        <select
          name="contract_id"
          value={contractId}
          onChange={onChange}
          className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Selecione um contrato</option>
        </select>
      </div>
    );
  }

  return (
    <div className="bg-info-50 p-4 rounded-lg border border-info-200">
      <div className="flex items-start">
        <FileText className="h-5 w-5 text-info-600 mr-2 mt-0.5" />
        <div>
          <h4 className="font-medium text-info-800">Contrato Ativo Encontrado</h4>
          <p className="text-sm text-info-700 mt-1">
            Cliente: <strong>{activeContract?.customers?.name}</strong>
          </p>
          <p className="text-sm text-info-700">
            Período: {activeContract && new Date(activeContract.start_date).toLocaleDateString('pt-BR')} a {activeContract && new Date(activeContract.end_date).toLocaleDateString('pt-BR')}
          </p>
          <div className="mt-2">
            <label className="block text-sm font-medium text-info-800 mb-1">
              Selecione o Contrato:
            </label>
            <select
              name="contract_id"
              value={contractId}
              onChange={onChange}
              className="w-full border border-info-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Nenhum (sem contrato)</option>
              {availableContracts.map(contract => (
                <option key={contract.id} value={contract.id}>
                  Cliente: {contract.customers?.name} ({new Date(contract.start_date).toLocaleDateString('pt-BR')} - {new Date(contract.end_date).toLocaleDateString('pt-BR')})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};