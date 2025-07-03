import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { useEmployees } from '../hooks/useEmployees';
import { Plus, Search, Filter, UserCheck, Loader2, Edit, Trash2, Mail, Phone } from 'lucide-react';
import RegisterForm from '../components/Auth/RegisterForm';
import toast from 'react-hot-toast';

// Modal para editar/adicionar funcionário
const EmployeeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  employee?: any;
  onSave: (data: any) => Promise<void>;
}> = ({ isOpen, onClose, employee, onSave }) => {
  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
    toast.success(employee ? 'Funcionário atualizado com sucesso!' : 'Funcionário cadastrado com sucesso!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h2 className="text-lg lg:text-xl font-semibold text-secondary-900">
            {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
          </h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 p-2">
            ×
          </button>
        </div>

        <RegisterForm 
          onSuccess={handleSuccess}
          onCancel={onClose}
          initialData={employee}
        />
      </div>
    </div>
  );
};

export const Employees: React.FC = () => {
  const { employees, loading, updateEmployee, deleteEmployee } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(undefined);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.contact_info?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === '' || employee.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const variants = {
      'Admin': 'error',
      'Manager': 'primary',
      'Mechanic': 'warning',
      'PatioInspector': 'info',
      'Sales': 'success',
      'Driver': 'secondary',
      'FineAdmin': 'error'
    } as const;

    const labels = {
      'Admin': 'Administrador',
      'Manager': 'Gerente',
      'Mechanic': 'Mecânico',
      'PatioInspector': 'Inspetor de Pátio',
      'Sales': 'Vendedor',
      'Driver': 'Motorista',
      'FineAdmin': 'Admin. Multas'
    } as const;

    return <Badge variant={variants[role as keyof typeof variants] || 'secondary'}>
      {labels[role as keyof typeof labels] || role}
    </Badge>;
  };

  const getAdditionalRolesBadges = (employee: any) => {
    if (!employee.permissions) return null;
    
    // Determine additional roles based on permissions
    const additionalRoles = determineRolesFromPermissions(employee.permissions)
      .filter(role => role !== employee.role);
    
    if (additionalRoles.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {additionalRoles.map(role => (
          <span 
            key={role} 
            className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-secondary-100 text-secondary-700"
          >
            {getRoleLabel(role)}
          </span>
        ))}
      </div>
    );
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      'Admin': 'Administrador',
      'Manager': 'Gerente',
      'Mechanic': 'Mecânico',
      'PatioInspector': 'Inspetor de Pátio',
      'Sales': 'Vendedor',
      'Driver': 'Motorista',
      'FineAdmin': 'Admin. Multas',
      'Inventory': 'Estoquista',
      'Finance': 'Financeiro',
      'Compras': 'Compras'
    };
    
    return roleMap[role] || role;
  };

  // Determine roles from permissions
  const determineRolesFromPermissions = (userPermissions: Record<string, boolean>): string[] => {
    const roles: string[] = [];
    
    // Check each role's default permissions against user permissions
    Object.entries(getRolePermissionsMap()).forEach(([role, keyPermissions]) => {
      const hasAllKeyPermissions = keyPermissions.every(perm => userPermissions[perm]);
      
      if (hasAllKeyPermissions) {
        roles.push(role);
      }
    });
    
    return roles;
  };

  // Get key permissions for each role
  const getRolePermissionsMap = () => {
    return {
      'Admin': ['admin'],
      'Manager': ['fleet', 'costs', 'finance', 'employees'],
      'Mechanic': ['maintenance'],
      'PatioInspector': ['inspections'],
      'Sales': ['contracts'],
      'Driver': ['fleet'],
      'FineAdmin': ['fines'],
      'Inventory': ['inventory'],
      'Finance': ['finance'],
      'Compras': ['purchases']
    };
  };

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setSelectedEmployee(undefined);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (employee: any) => {
    try {
      await updateEmployee(employee.id, { active: !employee.active });
      toast.success(`Funcionário ${employee.active ? 'desativado' : 'ativado'} com sucesso!`);
    } catch (error) {
      toast.error('Erro ao alterar status do funcionário');
    }
  };

  const handleDelete = async (id: string) => {
    console.log('handleDelete called with id:', id);
    
    if (!id || id === '') {
      console.error('handleDelete: ID is empty or undefined');
      toast.error('ID do funcionário é inválido');
      return;
    }
    
    if (confirm('Tem certeza que deseja excluir este funcionário?')) {
      console.log('User confirmed deletion, proceeding...');
      try {
        console.log('Calling deleteEmployee with id:', id);
        await deleteEmployee(id);
        console.log('deleteEmployee completed successfully');
        // Note: toast.success is already called in the deleteEmployee function
      } catch (error) {
        console.error('Error in handleDelete:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        // Don't show another toast here since deleteEmployee already shows one
      }
    } else {
      console.log('User cancelled deletion');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900">Funcionários</h1>
          <p className="text-secondary-600 mt-1 lg:mt-2">Gerencie a equipe da empresa</p>
        </div>
        <Button onClick={handleNew} size="sm" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Funcionário
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou função..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todas as Funções</option>
                <option value="Admin">Administrador</option>
                <option value="Manager">Gerente</option>
                <option value="Mechanic">Mecânico</option>
                <option value="PatioInspector">Inspetor de Pátio</option>
                <option value="Sales">Vendedor</option>
                <option value="Driver">Motorista</option>
                <option value="FineAdmin">Admin. Multas</option>
              </select>
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employees List */}
      <Card>
        <CardHeader className="p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-secondary-900">
            Funcionários ({filteredEmployees.length})
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3 p-4">
            {filteredEmployees.map((employee) => (
              <div key={employee.id} className="border border-secondary-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-secondary-900">{employee.name}</p>
                    <p className="text-sm text-secondary-600">{employee.contact_info?.email}</p>
                    {getAdditionalRolesBadges(employee)}
                  </div>
                  <div className="flex flex-col items-end">
                    {getRoleBadge(employee.role)}
                    <span className={`mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                      employee.active 
                        ? 'bg-success-100 text-success-800' 
                        : 'bg-error-100 text-error-800'
                    }`}>
                      {employee.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button 
                    onClick={() => handleEdit(employee)}
                    className="p-2 text-secondary-400 hover:text-secondary-600"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleToggleActive(employee)}
                    className="p-2 text-secondary-400 hover:text-warning-600"
                    title={employee.active ? 'Desativar' : 'Ativar'}
                  >
                    <UserCheck className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(employee.id)}
                    className="p-2 text-secondary-400 hover:text-error-600"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Nome</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Contato</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Função</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Status</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-secondary-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-secondary-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-sm">
                            {employee.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-secondary-900">{employee.name}</div>
                          {employee.employee_code && (
                            <div className="text-xs text-secondary-500">Código: {employee.employee_code}</div>
                          )}
                          {getAdditionalRolesBadges(employee)}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {employee.contact_info?.email && (
                          <div className="flex items-center text-sm text-secondary-600">
                            <Mail className="h-4 w-4 mr-1 text-secondary-400" />
                            {employee.contact_info.email}
                          </div>
                        )}
                        {employee.contact_info?.phone && (
                          <div className="flex items-center text-sm text-secondary-600">
                            <Phone className="h-4 w-4 mr-1 text-secondary-400" />
                            {employee.contact_info.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getRoleBadge(employee.role)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.active 
                          ? 'bg-success-100 text-success-800' 
                          : 'bg-error-100 text-error-800'
                      }`}>
                        {employee.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEdit(employee)}
                          className="p-1 text-secondary-400 hover:text-secondary-600"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleActive(employee)}
                          className="p-1 text-secondary-400 hover:text-warning-600"
                          title={employee.active ? 'Desativar' : 'Ativar'}
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(employee.id)}
                          className="p-1 text-secondary-400 hover:text-error-600"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">Nenhum funcionário encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={selectedEmployee}
        onSave={async (data) => {
          if (selectedEmployee) {
            await updateEmployee(selectedEmployee.id, data);
          }
          // For new employees, the RegisterForm handles the creation
        }}
      />
    </div>
  );
};

export default Employees;