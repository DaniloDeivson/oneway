import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Loader2, Users, UserPlus, Trash2, Edit, Shield, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import UserRegistrationSection from './UserRegistrationSection';

// Define job roles for display purposes only
const JOB_ROLES = {
  'Admin': { name: 'Administrador', color: 'error' },
  'Manager': { name: 'Gerente', color: 'primary' },
  'Mechanic': { name: 'Mecânico', color: 'warning' },
  'PatioInspector': { name: 'Inspetor', color: 'info' },
  'Sales': { name: 'Vendedor', color: 'success' },
  'Driver': { name: 'Motorista', color: 'secondary' },
  'FineAdmin': { name: 'Administrador de Multas', color: 'error' },
  'Inventory': { name: 'Estoquista', color: 'warning' },
  'Finance': { name: 'Financeiro', color: 'primary' },
  'Compras': { name: 'Compras', color: 'success' }
};

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all employees (which represent users in our system)
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ role })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role } : user
      ));
      
      toast.success('Papel do usuário atualizado com sucesso');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Erro ao atualizar papel do usuário');
    }
  };

  const toggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ active: !currentActive })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, active: !currentActive } : user
      ));
      
      toast.success(`Usuário ${!currentActive ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error) {
      console.error('Error toggling user active status:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setDeletingUserId(userId);
      
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) {
        toast.error('Usuário não encontrado');
        return;
      }
      
      // Check if this is the last admin
      const adminUsers = users.filter(user => user.role === 'Admin' && user.active);
      if (adminUsers.length <= 1 && userToDelete.role === 'Admin') {
        toast.error('Não é possível excluir o último administrador do sistema');
        return;
      }
      
      // Try to delete the employee record
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.error('Delete error:', error);
        
        // If deletion fails due to foreign key constraints, deactivate instead
        if (error.code === '23503' || error.message?.includes('violates foreign key constraint')) {
          await toggleUserActive(userId, true);
          toast.success('Usuário desativado com sucesso (não foi possível excluir devido a referências no sistema)');
        } else {
          throw error;
        }
      } else {
        // Remove from local state
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        toast.success('Usuário excluído com sucesso');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setDeletingUserId(null);
    }
  };

  const getAdditionalRolesBadges = (user: any) => {
    if (!user.permissions) return null;
    
    // Determine additional roles based on permissions
    const additionalRoles = determineRolesFromPermissions(user.permissions)
      .filter(role => role !== user.role);
    
    if (additionalRoles.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {additionalRoles.map(role => (
          <span 
            key={role} 
            className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-secondary-100 text-secondary-700"
          >
            {JOB_ROLES[role as keyof typeof JOB_ROLES]?.name || role}
          </span>
        ))}
      </div>
    );
  };

  // Determine roles from permissions
  const determineRolesFromPermissions = (userPermissions: Record<string, boolean>): string[] => {
    const roles: string[] = [];
    
    // Check each role's default permissions against user permissions
    Object.keys(JOB_ROLES).forEach(role => {
      const keyPermissionsForRole = getKeyPermissionsForRole(role);
      const hasAllKeyPermissions = keyPermissionsForRole.every(perm => userPermissions[perm]);
      
      if (hasAllKeyPermissions) {
        roles.push(role);
      }
    });
    
    return roles;
  };

  // Get key permissions that define a role
  const getKeyPermissionsForRole = (role: string): string[] => {
    switch (role) {
      case 'Admin': return ['admin'];
      case 'Manager': return ['fleet', 'costs', 'finance', 'employees'];
      case 'Mechanic': return ['maintenance'];
      case 'PatioInspector': return ['inspections'];
      case 'Sales': return ['contracts'];
      case 'Driver': return ['fleet'];
      case 'FineAdmin': return ['fines'];
      case 'Inventory': return ['inventory'];
      case 'Finance': return ['finance'];
      case 'Compras': return ['purchases'];
      default: return [];
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.contact_info?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = (userId: string) => {
    // Find the user to get their name
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Confirm deletion
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${user.name}? Esta ação não pode ser desfeita.`)) {
      deleteUser(userId);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Shield className="h-16 w-16 text-error-500 mb-4" />
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">Acesso Restrito</h1>
        <p className="text-secondary-600">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Painel de Administração</h1>
          <p className="text-secondary-600">Gerencie usuários e permissões do sistema</p>
        </div>
      </div>

      {/* User Registration Section */}
      <UserRegistrationSection />

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou papel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Users list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Papel
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-sm">
                            {user.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-secondary-900">{user.name}</div>
                          <div className="text-sm text-secondary-500">{user.contact_info?.email}</div>
                          {getAdditionalRolesBadges(user)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className="text-sm border border-secondary-300 rounded-md p-1"
                      >
                        <option value="Admin">Administrador</option>
                        <option value="Manager">Gerente</option>
                        <option value="Mechanic">Mecânico</option>
                        <option value="PatioInspector">Inspetor</option>
                        <option value="Sales">Vendedor</option>
                        <option value="Driver">Motorista</option>
                        <option value="FineAdmin">Admin de Multas</option>
                        <option value="Inventory">Estoquista</option>
                        <option value="Finance">Financeiro</option>
                        <option value="Compras">Compras</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.active 
                          ? 'bg-success-100 text-success-800' 
                          : 'bg-error-100 text-error-800'
                      }`}>
                        {user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => toast.success('Funcionalidade em desenvolvimento')}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleUserActive(user.id, user.active)}
                        className={`${
                          user.active ? 'text-error-600 hover:text-error-900' : 'text-success-600 hover:text-success-900'
                        } mr-4`}
                        title={user.active ? 'Desativar usuário' : 'Ativar usuário'}
                      >
                        {user.active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-error-600 hover:text-error-900"
                        disabled={deletingUserId === user.id}
                        title="Excluir usuário"
                      >
                        {deletingUserId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-secondary-400 mb-4" />
            <p className="text-secondary-600 text-lg">Nenhum usuário encontrado</p>
            <p className="text-secondary-500 text-sm">Tente ajustar sua busca</p>
          </div>
        )}
      </div>
    </div>
  );
}