import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import { 
  Settings, 
  Store, 
  Percent, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  Save, 
  Check,
  Lock,
  Smartphone,
  Phone,
  MapPin,
  Sparkles
} from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('smartdine_admin_settings');
      return saved ? JSON.parse(saved) : {
        restaurantName: 'SmartDine Royal Palace',
        tagline: 'Authentic Royal Indian Dining Experience',
        phone: '+91 98765 43210',
        address: 'Heritage Palace Arcade, MG Road, Pune, Maharashtra 411001',
        gstNumber: '27AABCS1429B1Z8',
        gstRate: 5,
        serviceCharge: 0,
        currency: '₹',
        openTime: '11:00',
        closeTime: '23:30',
        upiMerchantId: 'smartdine@icici',
        acceptCash: true,
        acceptUpi: true,
        acceptCard: true,
        autoAcceptOrders: true
      };
    } catch {
      return {
        restaurantName: 'SmartDine Royal Palace',
        tagline: 'Authentic Royal Indian Dining Experience',
        phone: '+91 98765 43210',
        address: 'Heritage Palace Arcade, MG Road, Pune, Maharashtra 411001',
        gstNumber: '27AABCS1429B1Z8',
        gstRate: 5,
        serviceCharge: 0,
        currency: '₹',
        openTime: '11:00',
        closeTime: '23:30',
        upiMerchantId: 'smartdine@icici',
        acceptCash: true,
        acceptUpi: true,
        acceptCard: true,
        autoAcceptOrders: true
      };
    }
  });

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('smartdine_admin_settings', JSON.stringify(settings));
    toast.success('⚙️ Restaurant Settings Saved Successfully!');
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950 font-sans text-slate-100">
      <Sidebar mode="admin" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto overflow-x-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <Settings className="w-7 h-7 text-orange-500" />
              <span>Restaurant Settings & Configuration</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage restaurant identity, GST tax rates, operating hours & payment gateway settings
            </p>
          </div>

          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-lg shadow-orange-600/20 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Save className="w-4 h-4" />
            <span>Save All Settings</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* 1. Restaurant Profile */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Store className="w-4 h-4 text-orange-400" />
              <span>Restaurant Identity & Contact</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Restaurant Name</label>
                <input
                  type="text"
                  value={settings.restaurantName}
                  onChange={(e) => handleChange('restaurantName', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-semibold text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Official Contact Phone</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">GST / Tax Identification No.</label>
                <input
                  type="text"
                  value={settings.gstNumber}
                  onChange={(e) => handleChange('gstNumber', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 font-bold mb-1">Physical Restaurant Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Tax & Operating Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Tax Settings */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Percent className="w-4 h-4 text-emerald-400" />
                <span>GST Tax & Billing Rate</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">GST Tax Rate (% on food bill)</label>
                  <input
                    type="number"
                    min="0"
                    max="28"
                    value={settings.gstRate}
                    onChange={(e) => handleChange('gstRate', Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Default 5% (2.5% SGST + 2.5% CGST for restaurant dining)</p>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Service Charge (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={settings.serviceCharge}
                    onChange={(e) => handleChange('serviceCharge', Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Dining Service Operating Hours</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Kitchen Opens</label>
                  <input
                    type="time"
                    value={settings.openTime}
                    onChange={(e) => handleChange('openTime', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Kitchen Closes</label>
                  <input
                    type="time"
                    value={settings.closeTime}
                    onChange={(e) => handleChange('closeTime', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="col-span-2 pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoAcceptOrders}
                      onChange={(e) => handleChange('autoAcceptOrders', e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-0"
                    />
                    <span className="text-slate-300 font-bold">Auto-accept customer orders in kitchen</span>
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* 3. Payment Channels */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <CreditCard className="w-4 h-4 text-blue-400" />
              <span>Payment Channel Methods</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">UPI Merchant VPA (Dynamic QR)</label>
                <input
                  type="text"
                  value={settings.upiMerchantId}
                  onChange={(e) => handleChange('upiMerchantId', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2 pt-4">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.acceptCash}
                    onChange={(e) => handleChange('acceptCash', e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600"
                  />
                  <span className="text-slate-300 font-bold">Enable Cash Counter Settlements</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.acceptUpi}
                    onChange={(e) => handleChange('acceptUpi', e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600"
                  />
                  <span className="text-slate-300 font-bold">Enable UPI Dynamic QR & Payment Apps</span>
                </label>
              </div>
            </div>
          </div>

        </form>

      </main>
    </div>
  );
}
