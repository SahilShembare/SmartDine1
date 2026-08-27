import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TableOrderProvider } from './context/TableOrderContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import CustomerWebMenu from './pages/CustomerWebMenu';
import CustomerWebCart from './pages/CustomerWebCart';
import CustomerWebTrack from './pages/CustomerWebTrack';
import AdminDashboard from './pages/AdminDashboard';
import AdminMenu from './pages/AdminMenu';
import AdminCategories from './pages/AdminCategories';
import AdminTables from './pages/AdminTables';
import KitchenDashboard from './pages/KitchenDashboard';
import Login from './pages/Login';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <TableOrderProvider>
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
            <Navbar />
            <div className="flex-1">
              <Routes>
                {/* Public & Customer Ordering Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<CustomerWebMenu />} />
                <Route path="/cart" element={<CustomerWebCart />} />
                <Route path="/track/:orderId" element={<CustomerWebTrack />} />
                <Route path="/login" element={<Login />} />

                {/* Protected Staff Routes */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/menu" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminMenu />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/categories" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminCategories />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/tables" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminTables />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/kitchen" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'kitchen']}>
                      <KitchenDashboard />
                    </ProtectedRoute>
                  } 
                />

                {/* Fallback */}
                <Route path="*" element={<Home />} />
              </Routes>
            </div>
          </div>
        </TableOrderProvider>
      </AuthProvider>
    </Router>
  );
}
