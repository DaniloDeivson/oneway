import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, UserCheck, Save, Loader2 } from 'lucide-react';
import { Button } from '../UI/Button';
import { useEmployees } from '../../hooks/useEmployees';
import toast from 'react-hot-toast';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    contact_info?: {
      email: string;
      phone?: string;
    };
    role: string;
    active: boolean;
    tenant_id?: string;
  };
  onUserUpdated: () => void;
}

const JOB_ROLES = {
  'Admin': 'Administrador',
  'Manager': 'Gerente',
  'Mechanic': 'Mecânico',
  'PatioInspector': 'Inspetor',
  'Sales': 'Vendedor',
  'Driver': 'Motorista',
  'FineAdmin': 'Admin de Multas',
  'Inventory': 'Estoquista',
  'Finance': 'Financeiro',
  'Compras': 'Compras'
};

export default function UserEditModal({ isOpen, onClose, user, onUserUpdated }: UserEditModalProps) {
  const { updateEmployee, deleteEmployee, loading } = useEmployees();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    active: true
  });

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        email: user.contact_info?.email || '',
        phone: user.contact_info?.phone || '',
        role: user.role || '',
        active: user.active !== undefined ? user.active : true
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.role) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Monta o objeto de atualização APENAS com campos que existem na tabela
      const updates: any = {
        name: formData.name,
        contact_info: {
          email: formData.email,
          phone: formData.phone || null
        },
        role: formData.role as 'Admin' | 'Mechanic' | 'PatioInspector' | 'Sales' | 'Driver' | 'FineAdmin' | 'Manager',
        active: formData.active,
        // Removidos: department e hire_date (não existem na tabela)
        updated_at: new Date().toISOString()
      };

      console.log('🔄 Dados para atualização:', updates);

      await updateEmployee(user.id, updates);

      toast.success('Usuário atualizado com sucesso!');
      onUserUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast.error(error?.message || 'Erro ao atualizar funcionário');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      try {
        await deleteEmployee(user.id);
        onUserUpdated();
        onClose();
      } catch (error) {
        // O hook já mostra o erro via toast
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary-600" />
                Editar Usuário
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Digite o nome completo"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Digite o e-mail"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Digite o telefone"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Papel *
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Selecione um papel</option>
                    {Object.entries(JOB_ROLES).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Campos department e hire_date removidos - não existem na tabela employees */}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                  Usuário ativo
                </label>
              </div>
            </form>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto sm:ml-3"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="error"
              onClick={handleDelete}
              className="w-full sm:w-auto mt-3 sm:mt-0"
              disabled={loading}
            >
              Excluir Usuário
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-full sm:w-auto mt-3 sm:mt-0"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 