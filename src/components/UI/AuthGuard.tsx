import { useEffect, useState, useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface AuthGuardProps {
  children: React.ReactNode
  requiredPermission?: string
}

export function AuthGuard({ children, requiredPermission }: AuthGuardProps) {
  const { user, loading, hasPermission } = useAuth()
  const [checking, setChecking] = useState(true)
  const location = useLocation()

  // Memoizar a verificação de permissões para evitar re-renders
  const hasRequiredPermission = useMemo(() => {
    if (!requiredPermission) return true
    return hasPermission(requiredPermission)
  }, [requiredPermission, hasPermission])

  useEffect(() => {
    // Se não está carregando e temos um usuário, podemos verificar permissões
    if (!loading) {
      setChecking(false)
    }
  }, [loading, user])

  // Mostrar loading enquanto verifica autenticação
  if (loading || checking) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  // Se não há usuário, redirecionar para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se há permissão específica requerida, verificar
  if (requiredPermission && !hasRequiredPermission) {
    return <Navigate to="/unauthorized" state={{ reason: 'insufficient_permissions' }} replace />
  }

  return <>{children}</>
}