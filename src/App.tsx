import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Fleet } from './pages/Fleet';
import { Costs } from './pages/Costs';
import { Maintenance } from './pages/Maintenance';
import { Inventory } from './pages/Inventory';
import { Contracts } from './pages/Contracts';
import { Inspections } from './pages/Inspections';
import { Employees } from './pages/Employees';
import { Fines } from './pages/Fines';
import { Suppliers } from './pages/Suppliers';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { Admin } from './pages/Admin';
import { Statistics } from './pages/Statistics';
import { Unauthorized } from './pages/Unauthorized';
import { AuthGuard } from './components/UI/AuthGuard';
import { Finance } from './pages/Finance';
import Notas from './pages/Notas';
import Login from './pages/Login';
import Cobranca from './pages/Cobranca';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
            <Route index element={<Dashboard />} />
            <Route path="frota" element={<Fleet />} />
            <Route path="custos" element={
              <AuthGuard managerOrAdminOnly>
                <Costs />
              </AuthGuard>
            } />
            <Route path="manutencao" element={<Maintenance />} />
            <Route path="estoque" element={<Inventory />} />
            <Route path="contratos" element={<Contracts />} />
            <Route path="inspecoes" element={<Inspections />} />
            <Route path="multas" element={<Fines />} />
            <Route path="fornecedores" element={<Suppliers />} />
            <Route path="compras" element={<PurchaseOrders />} />
            <Route path="estatisticas" element={<Statistics />} />
            <Route path="financeiro" element={
              <AuthGuard requiredPermission="finance">
                <Finance />
              </AuthGuard>
            } />
            <Route path="notas" element={
              <AuthGuard requiredPermission="finance">
                <Notas />
              </AuthGuard>
            } />
            <Route path="cobranca" element={
              <AuthGuard requiredPermission="finance">
                <Cobranca />
              </AuthGuard>
            } />
            <Route path="admin" element={
              <AuthGuard adminOnly>
                <Admin />
              </AuthGuard>
            } />
            <Route path="funcionarios" element={
              <AuthGuard requiredPermission="employees">
                <Employees />
              </AuthGuard>
            } />
            <Route path="unauthorized" element={<Unauthorized />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#fff',
            color: '#1e293b',
            borderRadius: '0.375rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          success: {
            iconTheme: {
              primary: '#16a34a',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#dc2626',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default App;