import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useContracts } from '../../hooks/useContracts';
import toast from 'react-hot-toast';

// Import sub-components
import { VehicleInfo } from './VehicleInfo';
import { InspectionTypeSelector } from './InspectionTypeSelector';
import { InspectorSelector } from './InspectorSelector';
import { ContractSelector } from './ContractSelector';
import { VehicleMetrics } from './VehicleMetrics';
import { DamageCartSummary } from './DamageCartSummary';

interface InspectionFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  inspection?: any;
  selectedVehicle?: any;
  employees: any[];
  onOpenDamageCart: () => void;
  damageCount: number;
  damageCart?: any[];
}

export const InspectionForm: React.FC<InspectionFormProps> = ({
  onSubmit,
  onCancel,
  inspection,
  selectedVehicle,
  employees,
  onOpenDamageCart,
  damageCount,
  damageCart = []
}) => {
  const { user, hasPermission } = useAuth();
  const { contracts, refetch: refetchContracts } = useContracts();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: inspection?.vehicle_id || selectedVehicle?.id || '',
    inspection_type: inspection?.inspection_type || 'CheckIn',
    employee_id: inspection?.employee_id || '',
    inspected_by: inspection?.inspected_by || '',
    notes: inspection?.notes || '',
    signature_url: inspection?.signature_url || '',
    mileage: inspection?.mileage || '',
    fuel_level: inspection?.fuel_level ? Math.round(inspection.fuel_level * 100) : '',
    contract_id: inspection?.contract_id || ''
  });
  const [activeContract, setActiveContract] = useState<any>(null);
  const [availableContracts, setAvailableContracts] = useState<any[]>([]);

  // Filter employees to only show PatioInspector role
  const patioInspectors = employees.filter(emp => emp.role === 'PatioInspector' && emp.active);
  
  // Auto-fill inspector_id with current user if they have inspections permission
  useEffect(() => {
    if (!inspection && hasPermission('inspections') && user && !formData.employee_id) {
      // Check if current user is a patio inspector
      const isInspector = patioInspectors.some(emp => emp.id === user.id);
      if (isInspector) {
        setFormData(prev => ({ ...prev, employee_id: user.id }));
      }
    }
  }, [inspection, user, hasPermission, patioInspectors, formData.employee_id]);

  // Update inspected_by when employee_id changes
  useEffect(() => {
    if (formData.employee_id) {
      const selectedInspector = employees.find(e => e.id === formData.employee_id);
      if (selectedInspector) {
        setFormData(prev => ({ ...prev, inspected_by: selectedInspector.name }));
      }
    }
  }, [formData.employee_id, employees]);

  // Fetch contracts when component mounts or vehicle changes
  useEffect(() => {
    if (formData.vehicle_id) {
      // Find active contracts for this vehicle
      const vehicleContracts = contracts.filter(contract => 
        contract.vehicle_id === formData.vehicle_id && 
        contract.status === 'Ativo'
      );
      
      setAvailableContracts(vehicleContracts);
      
      // Auto-set active contract if found
      if (vehicleContracts.length > 0) {
        const currentContract = vehicleContracts[0];
        setActiveContract(currentContract);
        
        // Auto-set contract_id if not already set
        if (!formData.contract_id) {
          setFormData(prev => ({ ...prev, contract_id: currentContract.id }));
        }
      } else {
        setActiveContract(null);
      }
    }
  }, [formData.vehicle_id, contracts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.vehicle_id) {
      toast.error('Por favor, selecione um veículo antes de salvar a inspeção.');
      return;
    }
    
    if (!formData.employee_id) {
      toast.error('Por favor, selecione um responsável pela inspeção.');
      return;
    }
    
    if (!formData.inspected_by) {
      toast.error('Por favor, informe o nome do inspetor responsável.');
      return;
    }
    
    setLoading(true);
    try {
      // Convert fuel_level to a number between 0 and 1
      const processedData = {
        ...formData,
        mileage: formData.mileage ? parseInt(formData.mileage.toString()) : null,
        fuel_level: formData.fuel_level ? parseFloat(formData.fuel_level.toString()) / 100 : null,
        notes: formData.notes === '' ? null : formData.notes,
        signature_url: formData.signature_url === '' ? null : formData.signature_url,
        contract_id: formData.contract_id === '' ? null : formData.contract_id
      };

      await onSubmit(processedData);
      onCancel();
    } catch (error) {
      console.error('Error saving inspection:', error);
      toast.error('Erro ao salvar inspeção. Verifique se todos os campos obrigatórios estão preenchidos.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const employeeId = e.target.value;
    const selectedEmployee = employees.find(emp => emp.id === employeeId);
    
    setFormData(prev => ({
      ...prev,
      employee_id: employeeId,
      inspected_by: selectedEmployee ? selectedEmployee.name : ''
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
      {/* Vehicle Info */}
      <VehicleInfo vehicle={selectedVehicle} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Inspection Type */}
        <InspectionTypeSelector 
          value={formData.inspection_type} 
          onChange={handleChange} 
        />

        {/* Inspector */}
        <InspectorSelector 
          employeeId={formData.employee_id}
          inspectedBy={formData.inspected_by}
          patioInspectors={patioInspectors}
          onChange={handleEmployeeChange}
        />
      </div>

      {/* Contract Selector */}
      <ContractSelector 
        availableContracts={availableContracts}
        activeContract={activeContract}
        contractId={formData.contract_id}
        onChange={handleChange}
      />

      {/* Vehicle Metrics */}
      <VehicleMetrics 
        mileage={formData.mileage}
        fuelLevel={formData.fuel_level}
        onChange={handleChange}
      />

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Observações Gerais
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Observações gerais sobre a inspeção..."
        />
      </div>

      {/* Damage Cart Section */}
      <DamageCartSummary 
        damageCount={damageCount}
        inspectionType={formData.inspection_type}
        contractId={formData.contract_id}
        onOpenDamageCart={onOpenDamageCart}
        damageCart={damageCart}
      />

      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 lg:pt-6 border-t">
        <Button variant="secondary" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !formData.employee_id} className="w-full sm:w-auto">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {inspection ? 'Salvar Alterações' : 'Criar Inspeção'}
        </Button>
      </div>
    </form>
  );
};

export default InspectionForm;