import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, Lock, User, Eye, EyeOff, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { DEFAULT_TENANT_ID } from '../../lib/supabase';

// Form validation schema
const registerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  role: z.string().min(1, 'Selecione uma função'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RegisterForm({ onSuccess, onCancel }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      phone: '',
    },
  });

  const watchedRole = watch('role');

  // Update selected roles when primary role changes
  React.useEffect(() => {
    if (watchedRole && !selectedRoles.includes(watchedRole)) {
      setSelectedRoles(prev => [...prev, watchedRole]);
    }
  }, [watchedRole, selectedRoles]);

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => {
      // If it's the primary role, don't allow removal
      if (role === watchedRole) return prev;
      
      // Toggle the role
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // Verifica se o email está em removed_users
      const { data: removedUser, error: removedUserError } = await supabase
        .from('removed_users')
        .select('id')
        .eq('email', data.email)
        .single();
      if (removedUser) {
        throw new Error('Este usuário foi removido do sistema e não pode ser cadastrado novamente.');
      }
      if (removedUserError && removedUserError.code !== 'PGRST116') {
        // PGRST116 = not found, então só lança erro se for outro
        throw removedUserError;
      }

      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role
          }
        }
      });

      if (authError) {
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Falha ao criar usuário');
      }

      // Get permissions based on all selected roles
      const combinedPermissions = getCombinedPermissions(selectedRoles);

      // Then create the employee record
      const { error: employeeError } = await supabase
        .from('employees')
        .insert([{
          id: authData.user.id,
          tenant_id: DEFAULT_TENANT_ID,
          name: data.name,
          role: data.role,
          employee_code: null,
          contact_info: {
            email: data.email,
            phone: data.phone || null,
          },
          active: true,
          permissions: combinedPermissions,
        }]);

      if (employeeError) {
        throw new Error(`Erro ao criar perfil: ${employeeError.message}`);
      }

      toast.success('Conta criada com sucesso! Você já pode fazer login.');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error registering user:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
      toast.error('Falha ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  // Get combined permissions based on multiple roles
  const getCombinedPermissions = (roles: string[]) => {
    const basePermissions = {
      dashboard: true,
      fleet: false,
      costs: false,
      finance: false,
      maintenance: false,
      inventory: false,
      contracts: false,
      inspections: false,
      fines: false,
      suppliers: false,
      purchases: false,
      statistics: false,
      employees: false,
      admin: false,
    };

    // Combine permissions from all selected roles
    return roles.reduce((acc, role) => {
      const rolePermissions = getDefaultPermissions(role);
      
      // Merge permissions, prioritizing 'true' values
      Object.keys(rolePermissions).forEach(key => {
        if (rolePermissions[key]) {
          acc[key] = true;
        }
      });
      
      return acc;
    }, {...basePermissions});
  };

  // Get default permissions based on role
  const getDefaultPermissions = (role: string) => {
    const basePermissions = {
      dashboard: true,
      fleet: false,
      costs: false,
      finance: false,
      maintenance: false,
      inventory: false,
      contracts: false,
      inspections: false,
      fines: false,
      suppliers: false,
      purchases: false,
      statistics: false,
      employees: false,
      admin: false,
    };

    switch (role) {
      case 'Admin':
        return Object.keys(basePermissions).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>);
      case 'Manager':
        return {
          ...basePermissions,
          fleet: true,
          costs: true,
          finance: true,
          maintenance: true,
          inventory: true,
          contracts: true,
          inspections: true,
          fines: true,
          suppliers: true,
          statistics: true,
          employees: true,
        };
      case 'Mechanic':
        return {
          ...basePermissions,
          maintenance: true,
          inventory: true,
        };
      case 'PatioInspector':
        return {
          ...basePermissions,
          inspections: true,
          fleet: true,
        };
      case 'Sales':
        return {
          ...basePermissions,
          contracts: true,
          fleet: true,
        };
      case 'Driver':
        return {
          ...basePermissions,
          fleet: true,
        };
      case 'FineAdmin':
        return {
          ...basePermissions,
          fines: true,
          fleet: true,
        };
      case 'Inventory':
        return {
          ...basePermissions,
          inventory: true,
          purchases: true,
        };
      case 'Finance':
        return {
          ...basePermissions,
          finance: true,
          costs: true,
        };
      case 'Compras':
        return {
          ...basePermissions,
          purchases: true,
          suppliers: true,
          inventory: true,
        };
      default:
        return basePermissions;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md text-error-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-1">
          Nome Completo *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <input
            id="name"
            type="text"
            {...register('name')}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Seu nome completo"
            disabled={isLoading}
          />
        </div>
        {errors.name && (
          <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-1">
          Email *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="seu@email.com"
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-secondary-700 mb-1">
          Função Principal *
        </label>
        <select
          id="role"
          {...register('role')}
          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={isLoading}
        >
          <option value="">Selecione uma função principal</option>
          <option value="Admin">Administrador</option>
          <option value="Manager">Gerente</option>
          <option value="Mechanic">Mecânico</option>
          <option value="PatioInspector">Inspetor de Pátio</option>
          <option value="Sales">Vendedor</option>
          <option value="Driver">Motorista</option>
          <option value="FineAdmin">Administrador de Multas</option>
          <option value="Inventory">Estoquista</option>
          <option value="Finance">Financeiro</option>
          <option value="Compras">Compras</option>
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-error-600">{errors.role.message}</p>
        )}
      </div>

      {/* Multiple Roles Selection */}
      {watchedRole && (
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Funções Adicionais (Opcional)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Admin', 'Manager', 'Mechanic', 'PatioInspector', 'Sales', 'Driver', 'FineAdmin', 'Inventory', 'Finance', 'Compras'].map(role => (
              <div 
                key={role}
                className={`
                  p-2 border rounded-md cursor-pointer text-sm
                  ${selectedRoles.includes(role) 
                    ? 'bg-primary-100 border-primary-300 text-primary-700' 
                    : 'bg-white border-secondary-200 text-secondary-700 hover:bg-secondary-50'}
                  ${role === watchedRole ? 'opacity-70 cursor-not-allowed' : ''}
                `}
                onClick={() => role !== watchedRole && handleRoleToggle(role)}
              >
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={selectedRoles.includes(role)}
                    onChange={() => {}}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded mr-2"
                    disabled={role === watchedRole}
                  />
                  {role === 'Admin' ? 'Administrador' : 
                   role === 'Manager' ? 'Gerente' :
                   role === 'Mechanic' ? 'Mecânico' :
                   role === 'PatioInspector' ? 'Inspetor de Pátio' :
                   role === 'Sales' ? 'Vendedor' :
                   role === 'Driver' ? 'Motorista' :
                   role === 'FineAdmin' ? 'Admin. Multas' :
                   role === 'Inventory' ? 'Estoquista' :
                   role === 'Finance' ? 'Financeiro' :
                   role === 'Compras' ? 'Compras' : role}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-secondary-500">
            Selecione funções adicionais para conceder permissões múltiplas ao usuário.
            A função principal não pode ser desmarcada.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 mb-1">
          Telefone
        </label>
        <input
          id="phone"
          type="tel"
          {...register('phone')}
          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="(00) 00000-0000"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-1">
          Senha *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            {...register('password')}
            className="w-full pl-10 pr-10 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Mínimo 6 caracteres"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 mb-1">
          Confirmar senha *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            {...register('confirmPassword')}
            className="w-full pl-10 pr-10 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Confirme sua senha"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
            disabled={isLoading}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 border border-secondary-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <UserPlus className="h-5 w-5 mr-2" />
              Criar Conta
            </>
          )}
        </button>
      </div>
    </form>
  );
}