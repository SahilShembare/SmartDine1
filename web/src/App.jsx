import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { TableOrderProvider } from './context/TableOrderContext';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import ProtectedRoute from './components/ProtectedRoute';

// Customer & Public Pages
import Home from './pages/Home';
import CustomerWebMenu from './pages/CustomerWebMenu';
import CustomerWebCart from './pages/CustomerWebCart';
import CustomerWebTrack from './pages/CustomerWebTrack';
import CustomerProfile from './pages/CustomerProfile';
import CustomerWebBill from './pages/CustomerWebBill';
import Login from './pages/Login';
import ScanTable from './pages/ScanTable';

// Admin SaaS Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminAICommandCenter from './pages/AdminAICommandCenter';
import AdminOrders from './pages/AdminOrders';
import AdminTables from './pages/AdminTables';
import AdminMenu from './pages/AdminMenu';
import AdminCategories from './pages/AdminCategories';
import AdminPayments from './pages/AdminPayments';
import AdminCustomers from './pages/AdminCustomers';
import AdminCoupons from './pages/AdminCoupons';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminNotifications from './pages/AdminNotifications';
import AdminSettings from './pages/AdminSettings';

// Kitchen Monitor
import KitchenDashboard from './pages/KitchenDashboard';

function AppContent() {
  const location = useLocation();
  const isAdminDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/kitchen');
  const isHomePage = location.pathname === '/';
  const isLoginPage = location.pathname === '/login';
  const isScanPage = location.pathname === '/scan';
  const hideBottomNav = isAdminDashboard || isHomePage || isLoginPage || isScanPage;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {!isAdminDashboard && <Navbar />}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0F172A',
            color: '#F8FAFC',
            border: '1px solid #334155',
            borderRadius: '14px',
            fontSize: '14px',
            fontWeight: '600',
            padding: '12px 18px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          },
        }}
      />
      <div className={hideBottomNav ? "flex-1" : "flex-1 pb-16 sm:pb-0"}>
        <Routes>
                {/* Public & Customer Dine-in Ordering Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<CustomerWebMenu />} />
                <Route path="/cart" element={<CustomerWebCart />} />
                <Route path="/track/:orderId" element={<CustomerWebTrack />} />
                <Route path="/bill" element={<CustomerWebBill />} />
                <Route path="/profile" element={<CustomerProfile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/scan" element={<ScanTable />} />

                {/* 10 Protected SaaS Admin Console Routes */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/ai" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminAICommandCenter />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/orders" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminOrders />
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
                  path="/admin/payments" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminPayments />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/customers" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminCustomers />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/coupons" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminCoupons />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/analytics" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminAnalytics />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/notifications" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminNotifications />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/settings" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminSettings />
                    </ProtectedRoute>
                  } 
                />

                {/* Kitchen Display Station */}
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
            
            {/* Native Mobile Bottom Navigation Bar (Customer View only) */}
            {!hideBottomNav && <MobileNav />}
          </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <TableOrderProvider>
          <AppContent />
        </TableOrderProvider>
      </AuthProvider>
    </Router>
  );
}
