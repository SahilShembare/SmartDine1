import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

import DashboardOverview from '../components/admin/DashboardOverview';
import KitchenUpdates from '../components/admin/KitchenUpdates';
import MenuManagement from '../components/admin/MenuManagement';
import TableManagement from '../components/admin/TableManagement';
import CustomerManagement from '../components/admin/CustomerManagement';
import PaymentManagement from '../components/admin/PaymentManagement';
import ReportManagement from '../components/admin/ReportManagement';
import SalesAnalysis from '../components/admin/SalesAnalysis';
import AIAssistant from '../components/admin/AIAssistant';
import SettingsManagement from '../components/admin/SettingsManagement';

export default function AdminDashboard({ initialTab = 'dashboard' }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial tab from props or URL pathname
  const getTabFromPath = () => {
    const path = location.pathname.replace('/admin', '').replace('/', '').trim();
    if (!path) return initialTab || 'dashboard';
    if (path === 'orders') return 'kitchen';
    if (path === 'analytics') return 'reports';
    if (path === 'categories') return 'menu';
    return path;
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [autoOpenAddMenu, setAutoOpenAddMenu] = useState(false);

  // Sync state when URL route changes
  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  // Handle Tab Switch
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'dashboard') {
      navigate('/admin');
    } else {
      navigate(`/admin/${tabId}`);
    }
  };

  const handleOpenAddMenuItem = () => {
    setAutoOpenAddMenu(true);
    handleTabChange('menu');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      
      {/* 1. LEFT SIDEBAR */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* 2. TOP HEADER */}
        <AdminHeader
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          setMobileOpen={setMobileOpen}
        />

        {/* 3. DYNAMIC CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardOverview 
              onNavigateTab={handleTabChange}
              onOpenAddMenuItem={handleOpenAddMenuItem}
            />
          )}

          {(activeTab === 'kitchen' || activeTab === 'orders') && (
            <KitchenUpdates />
          )}

          {activeTab === 'menu' && (
            <MenuManagement autoOpenAdd={autoOpenAddMenu} />
          )}

          {activeTab === 'tables' && (
            <TableManagement />
          )}

          {activeTab === 'customers' && (
            <CustomerManagement />
          )}

          {activeTab === 'payments' && (
            <PaymentManagement />
          )}

          {activeTab === 'reports' && (
            <ReportManagement />
          )}

          {activeTab === 'sales-analysis' && (
            <SalesAnalysis />
          )}

          {activeTab === 'ai' && (
            <AIAssistant />
          )}

          {activeTab === 'settings' && (
            <SettingsManagement />
          )}
        </main>
      </div>

    </div>
  );
}
