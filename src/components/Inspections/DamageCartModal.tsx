import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { Plus, Trash2, Camera, DollarSign, Save, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface DamageItem {
  id: string;
  location: string;
  description: string;
  damage_type: 'Arranhão' | 'Amassado' | 'Quebrado' | 'Desgaste' | 'Outro';
  severity: 'Baixa' | 'Média' | 'Alta';
  photo_url?: string;
  requires_repair: boolean;
}

interface DamageCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  damageCart: DamageItem[];
  onUpdateCart: (damages: DamageItem[]) => void;
  onSaveCart: (damages: Omit<DamageItem, 'id'>[]) => void;
  inspectionType: string;
}

const DAMAGE_TYPES = ['Arranhão', 'Amassado', 'Quebrado', 'Desgaste', 'Outro'];
const SEVERITIES = ['Baixa', 'Média', 'Alta'];

export const DamageCartModal: React.FC<DamageCartModalProps> = ({
  isOpen,
  onClose,
  damageCart,
  onUpdateCart,
  onSaveCart,
  inspectionType,
}) => {
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Buscar localizações distintas do banco
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('inspection_items')
        .select('location')
        .neq('location', '')
        .neq('location', null);
      if (!error && data) {
        const unique = Array.from(new Set(data.map((d: any) => d.location.trim())));
        setLocationOptions(unique);
      }
    };
    fetchLocations();
  }, [isOpen]);

  function createEmptyDamage(): DamageItem {
    return {
      id: `damage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      location: '',
      description: '',
      damage_type: 'Arranhão',
      severity: 'Baixa',
      requires_repair: false,
    };
  }

  if (!isOpen) return null;

  const damages = damageCart.length > 0 ? damageCart : [createEmptyDamage()];

  const addNewRow = () => {
    onUpdateCart([...damages, createEmptyDamage()]);
  };

  const removeRow = (id: string) => {
    if (damages.length === 1) {
      onUpdateCart([createEmptyDamage()]);
    } else {
      onUpdateCart(damages.filter(d => d.id !== id));
    }
  };

  const updateDamage = (id: string, field: keyof DamageItem, value: any) => {
    onUpdateCart(damages.map(damage => 
      damage.id === id 
        ? { ...damage, [field]: value }
        : damage
    ));
  };

  const handleSave = () => {
    // Filtrar apenas danos com localização e descrição preenchidas
    const validDamages = damages.filter(d => 
      d.location.trim() !== '' && d.description.trim() !== ''
    );

    if (validDamages.length === 0) {
      toast.error('Adicione pelo menos um dano com localização e descrição preenchidas');
      return;
    }

    onSaveCart(validDamages.map(({id, ...rest}) => rest));
    toast.success(`${validDamages.length} dano(s) registrado(s) com sucesso!`);
    onClose();
  };

  const clearAll = () => {
    onUpdateCart([createEmptyDamage()]);
    toast.success('Lista de danos limpa');
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      'Baixa': 'bg-green-100 text-green-800',
      'Média': 'bg-yellow-100 text-yellow-800',
      'Alta': 'bg-red-100 text-red-800'
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const validDamagesCount = damages.filter(d => 
    d.location.trim() !== '' && d.description.trim() !== ''
  ).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <div>
            <h2 className="text-lg lg:text-xl font-semibold text-secondary-900 flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Registrar Danos - {inspectionType}
            </h2>
            <p className="text-sm text-secondary-600 mt-1">
              Interface tipo Excel - Edite diretamente nas células
            </p>
          </div>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 p-2">
            ×
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-primary-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-600 font-medium">Danos Válidos</p>
                <p className="text-2xl font-bold text-primary-700">{validDamagesCount}</p>
              </div>
              <Camera className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          
          <div className="bg-secondary-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 font-medium">Linhas na Tabela</p>
                <p className="text-2xl font-bold text-secondary-700">{damages.length}</p>
              </div>
              <Plus className="h-8 w-8 text-secondary-600" />
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button onClick={addNewRow} variant="secondary" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Linha
          </Button>
          <Button onClick={clearAll} variant="secondary" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar Tudo
          </Button>
        </div>

        {/* Tabela Tipo Excel */}
        <div className="border border-secondary-200 rounded-lg overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table ref={tableRef} className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600 border-r border-secondary-200">
                    #
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600 border-r border-secondary-200 min-w-[200px]">
                    Localização *
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600 border-r border-secondary-200 min-w-[300px]">
                    Descrição do Dano *
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600 border-r border-secondary-200 min-w-[120px]">
                    Tipo
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600 border-r border-secondary-200 min-w-[100px]">
                    Severidade
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600 border-r border-secondary-200 min-w-[100px]">
                    Requer Reparo
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-secondary-600 min-w-[80px]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {damages.map((damage, index) => (
                  <tr key={damage.id} className="border-t border-secondary-200 hover:bg-secondary-25">
                    <td className="py-2 px-4 text-sm text-secondary-600 border-r border-secondary-200">
                      {index + 1}
                    </td>
                    <td className="py-2 px-2 border-r border-secondary-200">
                      <input
                        type="text"
                        value={damage.location}
                        onChange={(e) => updateDamage(damage.id, 'location', e.target.value)}
                        className="w-full border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
                        placeholder="Ex: Porta dianteira esquerda"
                        list="location-suggestions"
                      />
                      {index === 0 && (
                        <datalist id="location-suggestions">
                          {locationOptions.map((loc) => (
                            <option key={loc} value={loc} />
                          ))}
                        </datalist>
                      )}
                    </td>
                    <td className="py-2 px-2 border-r border-secondary-200">
                      <textarea
                        value={damage.description}
                        onChange={(e) => updateDamage(damage.id, 'description', e.target.value)}
                        rows={2}
                        className="w-full border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 resize-none"
                        placeholder="Descreva o dano detalhadamente..."
                      />
                    </td>
                    <td className="py-2 px-2 border-r border-secondary-200">
                      <select
                        value={damage.damage_type}
                        onChange={(e) => updateDamage(damage.id, 'damage_type', e.target.value)}
                        className="w-full border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
                      >
                        {DAMAGE_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2 border-r border-secondary-200">
                      <select
                        value={damage.severity}
                        onChange={(e) => updateDamage(damage.id, 'severity', e.target.value)}
                        className={`w-full border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 ${getSeverityColor(damage.severity)}`}
                      >
                        {SEVERITIES.map(severity => (
                          <option key={severity} value={severity}>{severity}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-4 border-r border-secondary-200 text-center">
                      <input
                        type="checkbox"
                        checked={damage.requires_repair}
                        onChange={(e) => updateDamage(damage.id, 'requires_repair', e.target.checked)}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => removeRow(damage.id)}
                        className="p-1 text-error-400 hover:text-error-600 hover:bg-error-50 rounded"
                        title="Remover linha"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Como usar:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Clique diretamente nas células para editar</li>
            <li>• Use Tab para navegar entre células</li>
            <li>• Preencha pelo menos Localização e Descrição para cada dano</li>
            <li>• Clique em "Nova Linha" para adicionar mais danos</li>
            <li>• O custo total será calculado automaticamente</li>
          </ul>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end space-x-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={validDamagesCount === 0}>
            <Save className="h-4 w-4 mr-2" />
            Salvar {validDamagesCount > 0 && `(${validDamagesCount} danos)`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DamageCartModal;