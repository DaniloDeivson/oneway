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
import Register from './pages/Register';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<AuthGuard requiredPermission="dashboard"><Layout /></AuthGuard>}>
            <Route index element={
              <AuthGuard requiredPermission="dashboard">
                <Dashboard />
              </AuthGuard>
            } />
            <Route path="frota" element={
              <AuthGuard requiredPermission="fleet">
                <Fleet />
              </AuthGuard>
            } />
            <Route path="custos" element={
              <AuthGuard requiredPermission="costs">
                <Costs />
              </AuthGuard>
            } />
            <Route path="manutencao" element={
              <AuthGuard requiredPermission="maintenance">
                <Maintenance />
              </AuthGuard>
            } />
            <Route path="estoque" element={
              <AuthGuard requiredPermission="inventory">
                <Inventory />
              </AuthGuard>
            } />
            <Route path="contratos" element={
              <AuthGuard requiredPermission="contracts">
                <Contracts />
              </AuthGuard>
            } />
            <Route path="inspecoes" element={
              <AuthGuard requiredPermission="inspections">
                <Inspections />
              </AuthGuard>
            } />
            <Route path="multas" element={
              <AuthGuard requiredPermission="fines">
                <Fines />
              </AuthGuard>
            } />
            <Route path="fornecedores" element={
              <AuthGuard requiredPermission="suppliers">
                <Suppliers />
              </AuthGuard>
            } />
            <Route path="compras" element={
              <AuthGuard requiredPermission="purchases">
                <PurchaseOrders />
              </AuthGuard>
            } />
            <Route path="estatisticas" element={
              <AuthGuard requiredPermission="statistics">
                <Statistics />
              </AuthGuard>
            } />
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
              <AuthGuard requiredPermission="admin">
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