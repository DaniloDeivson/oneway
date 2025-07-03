import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { Calendar, DollarSign, Car, User, Loader2, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useContracts } from '../../hooks/useContracts';

// Tipos de infração predefinidos
const INFRACTION_TYPES = [
  'Excesso de velocidade',
  'Estacionamento irregular',
  'Avanço de sinal vermelho',
  'Uso de celular ao volante',
  'Não uso do cinto de segurança',
  'Dirigir sem CNH',
  'Ultrapassagem proibida',
  'Estacionamento em vaga de deficiente',
  'Não parar na faixa de pedestres',
  'Dirigir sob efeito de álcool',
  'Transitar na contramão',
  'Estacionamento em local proibido',
  'Não respeitar distância de segurança',
  'Trafegar no acostamento',
  'Conversão proibida',
  'Parar sobre a faixa de pedestres',
  'Estacionamento em fila dupla',
  'Não dar preferência ao pedestre',
  'Velocidade incompatível com o local',
  'Outros'
];

interface FineFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  fine?: any;
  vehicles: any[];
  drivers: any[];
  employees: any[];
  loading?: boolean;
}

export const FineForm: React.FC<FineFormProps> = ({
  onSubmit,
  onCancel,
  fine,
  vehicles,
  drivers,
  employees,
  loading = false
}) => {
  const { user, isAdmin, isManager, hasPermission } = useAuth();
  const { contracts } = useContracts();
  const [formData, setFormData] = useState({
    vehicle_id: fine?.vehicle_id || '',
    driver_id: fine?.driver_id || '',
    employee_id: fine?.employee_id || '',
    fine_number: fine?.fine_number || '',
    infraction_type: fine?.infraction_type || '',
    amount: fine?.amount || 0,
    infraction_date: fine?.infraction_date || new Date().toISOString().split('T')[0],
    due_date: fine?.due_date || '',
    status: fine?.status || 'Pendente',
    document_ref: fine?.document_ref || '',
    observations: fine?.observations || '',
    contract_id: fine?.contract_id || '',
    customer_id: fine?.customer_id || '',
    customer_name: fine?.customer_name || '',
    severity: fine?.severity || '',
    points: fine?.points || 0
  });
  const [activeContracts, setActiveContracts] = useState<any[]>([]);

  // Auto-fill employee_id with current user if they have fines permission
  useEffect(() => {
    if (!fine && user && !formData.employee_id) {
      // Check if current user has permission to manage fines
      if (isAdmin || isManager || hasPermission('fines')) {
        setFormData(prev => ({ ...prev, employee_id: user.id }));
      }
    }
  }, [fine, user, isAdmin, isManager, hasPermission, formData.employee_id]);

  // Update active contracts when vehicle or infraction date changes
  useEffect(() => {
    if (formData.vehicle_id && formData.infraction_date && contracts.length > 0) {
      const matchingContracts = contracts.filter(contract => 
        contract.vehicle_id === formData.vehicle_id &&
        new Date(formData.infraction_date) >= new Date(contract.start_date) &&
        new Date(formData.infraction_date) <= new Date(contract.end_date)
      );
      setActiveContracts(matchingContracts);
      
      // Auto-select contract if there's only one match
      if (matchingContracts.length === 1 && !formData.contract_id) {
        setFormData(prev => ({
          ...prev,
          contract_id: matchingContracts[0].id,
          customer_id: matchingContracts[0].customer_id,
          customer_name: matchingContracts[0].customers?.name || ''
        }));
      }
    } else {
      setActiveContracts([]);
    }
  }, [formData.vehicle_id, formData.infraction_date, contracts.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações obrigatórias
    if (!formData.vehicle_id) {
      alert('Por favor, selecione um veículo.');
      return;
    }
    
    if (!formData.employee_id) {
      alert('Por favor, selecione um responsável pelo lançamento da multa.');
      return;
    }
    
    if (!formData.infraction_type) {
      alert('Por favor, selecione o tipo de infração.');
      return;
    }
    
    if (!formData.amount || formData.amount <= 0) {
      alert('Por favor, informe um valor válido para a multa.');
      return;
    }
    
    if (!formData.infraction_date) {
      alert('Por favor, informe a data da infração.');
      return;
    }
    
    if (!formData.severity) {
      alert('Por favor, selecione a gravidade da infração.');
      return;
    }
    
    if (!formData.points || formData.points < 0) {
      alert('Por favor, informe a pontuação da infração.');
      return;
    }
    
    // Calculate due date if not provided (30 days from infraction date)
    let calculatedDueDate = formData.due_date;
    if (!calculatedDueDate || calculatedDueDate === '') {
      const infractionDate = new Date(formData.infraction_date);
      infractionDate.setDate(infractionDate.getDate() + 30);
      calculatedDueDate = infractionDate.toISOString().split('T')[0];
    }

    const submitData = {
      vehicle_id: formData.vehicle_id,
      employee_id: formData.employee_id,
      infraction_type: formData.infraction_type,
      amount: Number(formData.amount),
      infraction_date: formData.infraction_date,
      due_date: calculatedDueDate,
      status: formData.status || 'Pendente',
      fine_number: formData.fine_number || null,
      driver_id: formData.driver_id || null,
      document_ref: formData.document_ref || null,
      observations: formData.observations || null,
      contract_id: formData.contract_id || null,
      customer_id: formData.customer_id || null,
      customer_name: formData.customer_name || null,
      severity: formData.severity,
      points: Number(formData.points)
    };
    
    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting fine:', error);
      alert('Erro ao salvar multa. Verifique os dados e tente novamente.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) || 0 : value
    }));
  };

  // Auto-calculate due date (30 days from infraction)
  const handleInfractionDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const infractionDate = e.target.value;
    setFormData(prev => {
      const dueDate = new Date(infractionDate);
      dueDate.setDate(dueDate.getDate() + 30);
      return {
        ...prev,
        infraction_date: infractionDate,
        due_date: prev.due_date || dueDate.toISOString().split('T')[0]
      };
    });
  };

  // Handle contract selection
  const handleContractChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contractId = e.target.value;
    if (contractId) {
      const selectedContract = contracts.find(c => c.id === contractId);
      if (selectedContract) {
        setFormData(prev => ({
          ...prev,
          contract_id: contractId,
          customer_id: selectedContract.customer_id,
          customer_name: selectedContract.customers?.name || ''
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        contract_id: '',
        customer_id: '',
        customer_name: ''
      }));
    }
  };

  // Filter employees to show only those with FineAdmin role or Admin role or fines permission
  const fineManagers = employees.filter(emp => 
    emp.active && (emp.role === 'Admin' || emp.role === 'Manager' || emp.role === 'FineAdmin' || emp.permissions?.fines)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Veículo *
          </label>
          <select
            name="vehicle_id"
            value={formData.vehicle_id}
            onChange={handleChange}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="">Selecione um veículo</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.plate} - {vehicle.model} ({vehicle.year})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Motorista Responsável
          </label>
          <select
            name="driver_id"
            value={formData.driver_id}
            onChange={handleChange}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Não informado</option>
            {drivers.map(driver => (
              <option key={driver.id} value={driver.id}>
                {driver.name} {driver.cpf && `(${driver.cpf})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Responsável pelo Lançamento *
        </label>
        <select
          name="employee_id"
          value={formData.employee_id}
          onChange={handleChange}
          className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
          disabled={!isAdmin && !isManager}
        >
          <option value="">Selecione o responsável</option>
          {fineManagers.map(employee => (
            <option key={employee.id} value={employee.id}>
              {employee.name} - {employee.role === 'Admin' ? 'Administrador' : employee.role === 'FineAdmin' ? 'Administrador de Multas' : employee.role === 'Manager' ? 'Gerente' : 'Inspetor'} {employee.employee_code && `(${employee.employee_code})`}
            </option>
          ))}
        </select>
        {fineManagers.length === 0 && (
          <p className="text-xs text-error-600 mt-1">
            Nenhum usuário com permissão para lançar multas. Adicione usuários com permissão no Admin Panel.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Número da Multa
          </label>
          <input
            type="text"
            name="fine_number"
            value={formData.fine_number}
            onChange={handleChange}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Será gerado automaticamente se vazio"
          />
          <p className="text-xs text-secondary-500 mt-1">
            Deixe vazio para gerar automaticamente
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="Pendente">Pendente</option>
            <option value="Pago">Pago</option>
            <option value="Contestado">Contestado</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Tipo de Infração *
        </label>
        <select
          name="infraction_type"
          value={formData.infraction_type}
          onChange={handleChange}
          className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        >
          <option value="">Selecione o tipo de infração</option>
          {INFRACTION_TYPES.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Valor (R$) *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              step="0.01"
              min="0"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Data da Infração *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="date"
              name="infraction_date"
              value={formData.infraction_date}
              onChange={handleInfractionDateChange}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Data de Vencimento *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <p className="text-xs text-secondary-500 mt-1">
            Calculado automaticamente (30 dias após infração)
          </p>
        </div>
      </div>

      {/* Contract association section */}
      <div className="bg-secondary-50 p-4 rounded-lg">
        <h3 className="font-medium text-secondary-900 mb-3">Associação com Contrato</h3>
        
        {activeContracts.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-secondary-600">
              {activeContracts.length === 1 
                ? "Encontramos um contrato ativo para este veículo na data da infração:" 
                : `Encontramos ${activeContracts.length} contratos ativos para este veículo na data da infração:`}
            </p>
            
            <select
              name="contract_id"
              value={formData.contract_id}
              onChange={handleContractChange}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecione um contrato</option>
              {activeContracts.map(contract => (
                <option key={contract.id} value={contract.id}>
                  Cliente: {contract.customers?.name} - Período: {new Date(contract.start_date).toLocaleDateString('pt-BR')} a {new Date(contract.end_date).toLocaleDateString('pt-BR')}
                </option>
              ))}
            </select>
            
            {formData.contract_id && (
              <div className="bg-info-50 border border-info-200 rounded-lg p-3">
                <div className="flex items-start">
                  <User className="h-5 w-5 text-info-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-info-800">
                      Cliente: {formData.customer_name}
                    </p>
                    <p className="text-xs text-info-700 mt-1">
                      Esta multa será associada ao cliente e aparecerá no painel de cobrança.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          formData.vehicle_id && formData.infraction_date ? (
            <p className="text-sm text-secondary-600">
              Não encontramos contratos ativos para este veículo na data da infração.
            </p>
          ) : (
            <p className="text-sm text-secondary-600">
              Selecione um veículo e a data da infração para verificar contratos associados.
            </p>
          )
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Referência do Documento
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
          <input
            type="text"
            name="document_ref"
            value={formData.document_ref}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Número do auto de infração, protocolo..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Observações
        </label>
        <textarea
          name="observations"
          value={formData.observations}
          onChange={handleChange}
          rows={3}
          className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Observações adicionais sobre a multa..."
        />
      </div>

      {/* Alert sobre integração com custos */}
      <div className="bg-info-50 border border-info-200 rounded-lg p-4">
        <div className="flex items-start">
          <DollarSign className="h-5 w-5 text-info-600 mr-2 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-info-800">
              Integração Automática com Custos
            </p>
            <p className="text-xs text-info-700 mt-1">
              Ao registrar esta multa, um lançamento de custo será criado automaticamente no painel financeiro 
              com categoria "Multa" e status "Pendente".
              {formData.contract_id && " A multa também será associada ao cliente no painel de cobrança."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Gravidade da Infração *
          </label>
          <select
            name="severity"
            value={formData.severity}
            onChange={handleChange}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="">Selecione a gravidade</option>
            <option value="Baixa">Baixa</option>
            <option value="Média">Média</option>
            <option value="Alta">Alta</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Pontuação da Infração *
          </label>
          <input
            type="number"
            name="points"
            value={formData.points}
            onChange={handleChange}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="0"
            required
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 lg:pt-6 border-t">
        <Button variant="secondary" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={loading || !formData.employee_id} 
          className="w-full sm:w-auto"
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {fine ? 'Salvar Alterações' : 'Registrar Multa'}
        </Button>
      </div>
    </form>
  );
};

export default FineForm;