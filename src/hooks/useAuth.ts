import { useState, useEffect } from 'react';
import { supabase, DEFAULT_TENANT_ID } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Mechanic' | 'PatioInspector' | 'Sales' | 'Driver' | 'FineAdmin' | 'Inventory' | 'Finance' | 'Compras';
  name: string;
  permissions: Record<string, boolean>;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (session) {
          // Get user profile from employees table
          const { data: employeeData, error: employeeError } = await supabase
            .from('employees')
            .select('*')
            .eq('contact_info->>email', session.user.email)
            .eq('tenant_id', DEFAULT_TENANT_ID)
            .single();
            
          if (!isMounted) return;
            
          if (employeeError) {
            console.error('Error fetching employee data:', employeeError);
            setUser(null);
            setError('Usuário não encontrado no sistema');
          } else if (employeeData && employeeData.active) {
            setUser({
              id: employeeData.id,
              email: employeeData.contact_info?.email || session.user.email || '',
              role: employeeData.role,
              name: employeeData.name,
              permissions: employeeData.permissions || {}
            });
            setError(null);
          } else {
            setUser(null);
            setError('Usuário inativo ou não encontrado');
          }
        } else {
          setUser(null);
          setError(null);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Session check error:', err);
        setError(err instanceof Error ? err.message : 'Failed to check session');
        setUser(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    checkSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          try {
            // Get user profile from employees table
            const { data: employeeData, error: employeeError } = await supabase
              .from('employees')
              .select('*')
              .eq('contact_info->>email', session.user.email)
              .eq('tenant_id', DEFAULT_TENANT_ID)
              .single();
              
            if (!isMounted) return;
              
            if (employeeError) {
              console.error('Error fetching employee data:', employeeError);
              setUser(null);
              setError('Usuário não encontrado no sistema');
            } else if (employeeData && employeeData.active) {
              setUser({
                id: employeeData.id,
                email: employeeData.contact_info?.email || session.user.email || '',
                role: employeeData.role,
                name: employeeData.name,
                permissions: employeeData.permissions || {}
              });
              setError(null);
              console.log('User authenticated via onAuthStateChange');
            } else {
              setUser(null);
              setError('Usuário inativo ou não encontrado');
            }
          } catch (err) {
            if (!isMounted) return;
            console.error('Error in auth state change:', err);
            setUser(null);
            setError('Erro ao carregar dados do usuário');
          }
          
          // SEMPRE definir loading como false após processar login
          if (isMounted) {
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          if (!isMounted) return;
          setUser(null);
          setError(null);
          setLoading(false);
        }
      }
    );
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting login for:', email);
      
      // Use Supabase auth for all login attempts
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      console.log('Login successful, user:', data.user?.email);
      
      // User will be set by the onAuthStateChange listener
      toast.success('Login realizado com sucesso!');
      
      // Garantir que loading seja false após 3 segundos como fallback
      setTimeout(() => {
        setLoading(false);
      }, 3000);
      
    } catch (err) {
      setLoading(false); // Only set loading to false on error
      setError(err instanceof Error ? err.message : 'Credenciais inválidas');
      toast.error('Falha no login: ' + (err instanceof Error ? err.message : 'Credenciais inválidas'));
      throw err;
    }
  };

  const logout = async () => {
    try {
      console.log('Starting logout process...');
      setLoading(true);
      
      // Clear the user state first
      setUser(null);
      setError(null);
      
      // Check if there's an active session before trying to sign out
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Only try to sign out if there's an active session
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('Supabase logout error:', error);
          // Don't throw error for session missing - just log it
          if (error.message !== 'Auth session missing!') {
            throw error;
          }
        }
      } else {
        console.log('No active session found, skipping Supabase signOut');
      }
      
      console.log('Logout successful');
      toast.success('Logout realizado com sucesso!');
    } catch (err) {
      console.error('Logout error:', err);
      // Don't show error to user for session issues
      if (err instanceof Error && err.message.includes('Auth session missing')) {
        console.log('Session was already expired, logout completed locally');
        toast.success('Logout realizado com sucesso!');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to logout');
        toast.error('Erro ao fazer logout');
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    
    // Admin and Manager have all permissions
    if (user.role === 'Admin' || user.role === 'Manager') return true;
    
    // Check specific permission
    return !!user.permissions[permission];
  };

  const hasMultipleRoles = () => {
    if (!user || !user.permissions) return false;
    
    // Count how many role-defining permissions the user has
    const roleDefiningPermissions = {
      'admin': 'Admin',
      'maintenance': 'Mechanic',
      'inspections': 'PatioInspector',
      'contracts': 'Sales',
      'fines': 'FineAdmin',
      'inventory': 'Inventory',
      'finance': 'Finance',
      'purchases': 'Compras'
    };
    
    let roleCount = 0;
    Object.entries(roleDefiningPermissions).forEach(([perm]) => {
      if (user.permissions[perm]) roleCount++;
    });
    
    return roleCount > 1;
  };

  const getAdditionalRoles = (): string[] => {
    if (!user || !user.permissions) return [];
    
    const roles: string[] = [];
    
    // Define key permissions for each role
    const rolePermissions = {
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
    
    // Check each role
    Object.entries(rolePermissions).forEach(([roleName, permissions]) => {
      // Skip the primary role
      if (roleName === user.role) return;
      
      // Check if user has all permissions for this role
      const hasAllPermissions = permissions.every(p => user.permissions[p]);
      if (hasAllPermissions) {
        roles.push(roleName);
      }
    });
    
    return roles;
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    hasPermission,
    hasMultipleRoles,
    getAdditionalRoles,
    isAdmin: user?.role === 'Admin',
    isManager: user?.role === 'Manager'
  };
};