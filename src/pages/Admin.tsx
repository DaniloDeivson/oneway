import React, { useState } from 'react';
import AdminDashboard from '../components/Admin/AdminDashboard';
import { Card, CardHeader, CardContent } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { useCleanup } from '../hooks/useCleanup';
import { Loader2, Trash2, RefreshCw, Database, AlertTriangle } from 'lucide-react';

export const Admin: React.FC = () => {
  const { loading, results, cleanupAllData, insertSampleData } = useCleanup();
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<Record<string, number> | null>(null);

  const handleCleanup = async () => {
    if (confirm('ATENÇÃO: Esta ação irá excluir TODOS os dados do sistema, exceto usuários. Esta ação é irreversível. Deseja continuar?')) {
      const results = await cleanupAllData();
      setCleanupResults(results);
      setShowCleanupConfirm(false);
    }
  };

  const handleInsertSampleData = async () => {
    if (confirm('Deseja inserir dados de exemplo no sistema?')) {
      await insertSampleData();
    }
  };

  return (
    <div className="space-y-6">
      <AdminDashboard />
      
      {/* Data Management Section */}
      <Card>
        <CardHeader className="p-4 lg:p-6 bg-secondary-50">
          <div className="flex items-center">
            <Database className="h-6 w-6 text-secondary-600 mr-3" />
            <h2 className="text-xl font-semibold text-secondary-900">Gerenciamento de Dados</h2>
          </div>
        </CardHeader>
        <CardContent className="p-4 lg:p-6">
          {showCleanupConfirm ? (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-error-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-error-800 text-lg">Confirmação de Limpeza de Dados</h3>
                  <p className="text-error-700 mt-2">
                    Esta ação irá excluir TODOS os dados do sistema, incluindo:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-error-700 space-y-1">
                    <li>Veículos</li>
                    <li>Clientes</li>
                    <li>Contratos</li>
                    <li>Multas</li>
                    <li>Inspeções</li>
                    <li>Ordens de serviço</li>
                    <li>Peças e movimentações de estoque</li>
                    <li>Custos e cobranças</li>
                    <li>Pedidos de compra</li>
                  </ul>
                  <p className="font-bold text-error-800 mt-3">
                    Esta ação é PERMANENTE e NÃO pode ser desfeita!
                  </p>
                  
                  <div className="flex space-x-3 mt-4">
                    <Button 
                      variant="secondary" 
                      onClick={() => setShowCleanupConfirm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      variant="error" 
                      onClick={handleCleanup}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Confirmar Limpeza
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-secondary-50 p-4 rounded-lg">
                <h3 className="font-semibold text-secondary-900 mb-2">Preparação para Produção</h3>
                <p className="text-secondary-600 mb-4">
                  Utilize estas ferramentas para limpar dados de teste e preparar o sistema para uso em produção.
                  A limpeza de dados mantém a estrutura e lógica do sistema, removendo apenas os registros.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="error" 
                    onClick={() => setShowCleanupConfirm(true)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Todos os Dados
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    onClick={handleInsertSampleData}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Inserir Dados de Exemplo
                  </Button>
                </div>
              </div>
              
              {cleanupResults && (
                <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                  <h3 className="font-semibold text-success-800 mb-3">Limpeza Concluída com Sucesso</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.entries(cleanupResults).map(([table, count]) => (
                      <div key={table} className="bg-white p-3 rounded border border-success-100">
                        <p className="text-sm text-secondary-600">{table}:</p>
                        <p className="font-medium">{count} registros removidos</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;