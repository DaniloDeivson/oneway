import { useCallback, useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Employee } from '../types/database'

interface AuthState {
  loading: boolean
  isAuthenticated: boolean
  user: Employee | null
  error: string | null
}

export interface UseAuthReturn {
  loading: boolean
  isAuthenticated: boolean
  user: Employee | null
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: Partial<Employee>) => Promise<{ success: boolean; message: string }>
  signOut: () => Promise<void>
  hasPermission: (permission: string) => boolean
  isAdmin: boolean
  isManager: boolean
}

// Cache para evitar chamadas repetidas ao banco
const employeeCache = new Map<string, { data: Employee; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate()
  const [state, setState] = useState<AuthState>({
    loading: true,
    isAuthenticated: false,
    user: null,
    error: null
  })

  // Verificar se o usuário existe na tabela employees usando query direta
  const checkEmployeeAccess = useCallback(async (userId: string) => {
    try {
      // Verificar cache primeiro
      const cached = employeeCache.get(userId)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('📦 Usando dados do cache para usuário:', userId)
        return cached.data
      }

      // Primeiro, tentar usar a função RPC se disponível
      try {
        const { data, error } = await supabase.rpc('get_employee_by_id', {
          user_id: userId
        })

        if (!error && data) {
          // Salvar no cache
          employeeCache.set(userId, { data, timestamp: Date.now() })
          return data
        }
      } catch {
        console.log('RPC function not available, using direct query')
      }

      // Obter o email do usuário autenticado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        throw new Error('Email do usuário não encontrado')
      }

      // Usar SQL direto para contornar problemas de RLS
      let data, error;
      
      try {
        const result = await supabase
          .rpc('get_employee_by_email', {
            email_param: user.email.toLowerCase()
          })
        data = result.data;
        error = result.error;
      } catch {
        console.log('get_employee_by_email not available, using direct SQL')
        
              // Fallback: usar uma query mais simples que pode contornar RLS
      try {
        const sqlResult = await supabase
          .from('employees')
          .select('*')
          .eq('contact_info->>email', user.email.toLowerCase())
          .eq('active', true)
          .maybeSingle()
        
        data = sqlResult.data;
        error = sqlResult.error;
      } catch {
        console.log('Direct query failed, trying alternative approach')
        
        // Última tentativa: usar uma query mais básica
        const basicResult = await supabase
          .from('employees')
          .select('id, name, role, tenant_id, contact_info, permissions, roles_extra, active, created_at, updated_at')
          .eq('contact_info->>email', user.email.toLowerCase())
          .maybeSingle()
        
        data = basicResult.data;
        error = basicResult.error;
      }
      }

      if (error) {
        console.error('Database error:', error)
        throw new Error(`Erro de acesso: ${error.message}`)
      }

      if (!data) {
        throw new Error('Usuário não encontrado ou inativo')
      }

      // Verificar se o usuário não tem status problemático
      if (data.contact_info?.status && 
          ['orphaned', 'orphaned_duplicate', 'duplicate_resolved'].includes(data.contact_info.status)) {
        throw new Error('Usuário inativo ou com status inválido')
      }

      // Salvar no cache
      employeeCache.set(userId, { data, timestamp: Date.now() })
      return data
    } catch (error) {
      console.error('Erro ao verificar acesso:', error)
      throw error
    }
  }, [])

  // Função para verificar permissões - memoizada
  const hasPermission = useMemo(() => {
    return (permission: string): boolean => {
      if (!state.user) return false
      
      // Admin tem todas as permissões
      if (state.user.role === 'Admin') return true
      
      // Lógica específica por papel
      switch (state.user.role) {
        case 'Inspector':
          // Inspetor: Inspeção e Frota
          return ['inspections', 'fleet'].includes(permission)
        
        case 'FineAdmin':
          // Profissional de Multas: Somente Multas
          return permission === 'fines'
        
        case 'Sales':
          // Comercial: Somente Clientes e Contratos
          return ['contracts'].includes(permission)
        
        default:
          // Verificar permissões específicas se definidas
          if (state.user.permissions && state.user.permissions[permission]) {
            return true
          }
          return false
      }
    }
  }, [state.user])

  // Verificar se é admin - memoizado
  const isAdmin = useMemo(() => state.user?.role === 'Admin', [state.user?.role])
  
  // Verificar se é manager - memoizado (mantido para compatibilidade)
  const isManager = useMemo(() => state.user?.role === 'Admin', [state.user?.role])

  // Login com email/senha
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Usuário não encontrado')
      }

      const employee = await checkEmployeeAccess(authData.user.id)

      setState({
        loading: false,
        isAuthenticated: true,
        user: employee,
        error: null
      })

      // Redirecionar para a rota raiz (dashboard)
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Erro no login:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: error instanceof Error ? error.message : 'Erro ao fazer login'
      }))
    }
  }, [navigate, checkEmployeeAccess])

  // Registro de novo usuário
  const signUp = useCallback(async (email: string, password: string, userData: Partial<Employee>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      // 1. Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: userData.name,
            role: userData.role || 'User',
            tenant_id: userData.tenant_id
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Erro ao criar usuário')
      }

      setState({
        loading: false,
        isAuthenticated: false,
        user: null,
        error: null
      })

      return { success: true, message: 'Verifique seu email para confirmar o cadastro' }
    } catch (error) {
      console.error('Erro no registro:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: error instanceof Error ? error.message : 'Erro ao registrar usuário'
      }))
      throw error
    }
  }, [])

  // Logout
  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Limpar cache ao fazer logout
      employeeCache.clear()

      setState({
        loading: false,
        isAuthenticated: false,
        user: null,
        error: null
      })

      navigate('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer logout'
      }))
    }
  }, [navigate])

  // Verificar sessão atual - memoizado para evitar re-execuções desnecessárias
  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      try {
        if (!isMounted) return
        
        setState(prev => ({ ...prev, loading: true }))
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (error) throw error

        if (session?.user) {
          console.log('🔍 Verificando sessão para usuário:', session.user.id)
          const employee = await checkEmployeeAccess(session.user.id)
          
          if (!isMounted) return
          
          console.log('✅ Dados do funcionário carregados:', employee)
          
          setState({
            loading: false,
            isAuthenticated: true,
            user: employee,
            error: null
          })
        } else {
          console.log('❌ Nenhuma sessão encontrada')
          if (isMounted) {
            setState({
              loading: false,
              isAuthenticated: false,
              user: null,
              error: null
            })
          }
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error)
        if (isMounted) {
          setState({
            loading: false,
            isAuthenticated: false,
            user: null,
            error: error instanceof Error ? error.message : 'Erro ao verificar sessão'
          })
        }
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      console.log('🔄 Auth state change:', event, session?.user?.id)
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          setState(prev => ({ ...prev, loading: true }))
          const employee = await checkEmployeeAccess(session.user.id)
          
          if (!isMounted) return
          
          console.log('✅ Funcionário carregado após sign in:', employee)
          setState({
            loading: false,
            isAuthenticated: true,
            user: employee,
            error: null
          })
        } catch (error) {
          console.error('❌ Erro ao carregar funcionário após sign in:', error)
          if (isMounted) {
            setState({
              loading: false,
              isAuthenticated: false,
              user: null,
              error: error instanceof Error ? error.message : 'Erro ao verificar sessão'
            })
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 Usuário deslogado')
        if (isMounted) {
          // Limpar cache ao fazer logout
          employeeCache.clear()
          setState({
            loading: false,
            isAuthenticated: false,
            user: null,
            error: null
          })
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [checkEmployeeAccess])

  return {
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    error: state.error,
    signIn,
    signUp,
    signOut,
    hasPermission,
    isAdmin,
    isManager
  }
}