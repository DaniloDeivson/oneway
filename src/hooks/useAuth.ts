import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: Record<string, boolean>;
  tenant_id: string;
}

const SESSION_KEY = 'oneWayUser';

const saveUserSession = (user: AppUser) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
};

const getUserSession = (): AppUser | null => {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored);
    return null;
  } catch {
    return null;
  }
};

const clearUserSession = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(getUserSession());
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Busca dados do usuário na tabela employees
  const fetchUserProfile = async (supabaseUser: { email: string; user_metadata?: { name?: string } }): Promise<AppUser | null> => {
    if (!supabaseUser?.email) return null;
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('contact_info->>email', supabaseUser.email)
      .single();
    if (error || !data) return null;
    return {
      id: data.id,
      email: data.contact_info?.email || supabaseUser.email,
      name: data.name || supabaseUser.user_metadata?.name || supabaseUser.email,
      role: data.role,
      permissions: data.permissions || {},
      tenant_id: data.tenant_id,
    };
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user && typeof session.user.email === 'string') {
        const profile = await fetchUserProfile({
          email: session.user.email,
          user_metadata: session.user.user_metadata,
        });
        if (profile) {
          setUser(profile);
          saveUserSession(profile);
        } else {
          setUser(null);
          clearUserSession();
        }
      } else {
        setUser(null);
        clearUserSession();
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user && typeof session.user.email === 'string') {
        setLoginLoading(false);
        setLoading(true);
        const profile = await fetchUserProfile({
          email: session.user.email,
          user_metadata: session.user.user_metadata,
        });
        if (profile) {
          setUser(profile);
          saveUserSession(profile);
        } else {
          setUser(null);
          clearUserSession();
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        setLoginLoading(false);
        clearUserSession();
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoginLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoginLoading(false);
        throw error;
      }
      toast.success('Login realizado com sucesso!');
    } catch (err) {
      setLoginLoading(false);
      const message = err instanceof Error ? err.message : 'Erro no login';
      setError(message);
      toast.error('Falha no login: ' + message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setLoginLoading(false);
      await supabase.auth.signOut();
      setUser(null);
      setError(null);
      clearUserSession();
      toast.success('Logout realizado com sucesso!');
    } catch {
      toast.error('Erro ao fazer logout');
    } finally {
      setLoading(false);
      setLoginLoading(false);
    }
  };

  // Helpers
  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const hasPermission = (perm: string) => !!user?.permissions?.[perm] || isAdmin;

  return {
    user,
    loading,
    loginLoading,
    error,
    login,
    logout,
    isAdmin,
    isManager,
    hasPermission,
  };
};