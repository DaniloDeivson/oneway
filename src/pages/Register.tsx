import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { UserPlus, ShieldAlert } from 'lucide-react';
import RegisterForm from '../components/Auth/RegisterForm';

export default function Register() {
  const { isAdmin, user } = useAuth();

  // If not admin, redirect to unauthorized
  if (user && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-secondary-900 px-6 py-4 flex items-center">
          <UserPlus className="h-6 w-6 text-white mr-3" />
          <h1 className="text-xl font-semibold text-white">Cadastrar Novo Usuário</h1>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-start">
              <ShieldAlert className="h-5 w-5 text-primary-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-primary-800 font-medium">Importante</h3>
                <p className="text-primary-700 text-sm mt-1">
                  Você está criando um novo usuário do sistema. Este usuário terá acesso às funcionalidades
                  de acordo com a função selecionada. Certifique-se de fornecer as informações corretas.
                </p>
              </div>
            </div>
          </div>

          <RegisterForm 
            onSuccess={() => window.location.href = '/admin'}
          />
        </div>
      </div>
    </div>
  );
}