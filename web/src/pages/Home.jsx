import React from 'react';
import { Link } from 'react-router-dom';
import { useTableOrder } from '../context/TableOrderContext';
import { 
  UtensilsCrossed, 
  QrCode, 
  ChefHat, 
  LayoutDashboard, 
  ArrowRight, 
  Sparkles, 
  Smartphone, 
  Flame, 
  Clock,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function Home() {
  const { currentTable } = useTableOrder();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col justify-between">
      
      {/* Hero Section */}
      <section className="relative px-4 pt-12 pb-20 max-w-6xl mx-auto text-center space-y-8">
        
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation QR Restaurant Ordering Ecosystem</span>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Smart Ordering. <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
              Faster Service. Better Dining.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Scan your table QR code to explore digital menus, place orders instantly, and track cooking progress in real-time from mobile or browser.
          </p>
        </div>

        {/* Action Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6 text-left max-w-4xl mx-auto">
          
          {/* Customer Menu */}
          <Link
            to={currentTable ? `/menu?table=${currentTable}` : '/menu?table=01'}
            className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-orange-950/20 border border-slate-800 hover:border-orange-500/50 shadow-xl transition-all group duration-200"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-white group-hover:text-orange-400 transition flex items-center justify-between">
              <span>Customer QR Menu</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Explore food dishes, customize ingredients, place table orders, and watch live tracking.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-orange-400 font-bold">
              <span>{currentTable ? `Active: Table ${currentTable}` : 'Test Scan (Table 01)'}</span>
              <span>Launch →</span>
            </div>
          </Link>

          {/* Kitchen Live */}
          <Link
            to="/kitchen"
            className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 hover:border-amber-500/50 shadow-xl transition-all group duration-200"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <ChefHat className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-white group-hover:text-amber-400 transition flex items-center justify-between">
              <span>Kitchen Live Station</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Real-time multi-stage Kanban queue (Pending, Accepted, Cooking, Ready) with sound chimes.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-amber-400 font-bold">
              <span>Live Order Stream</span>
              <span>Open Kitchen →</span>
            </div>
          </Link>

          {/* Admin Management */}
          <Link
            to="/admin"
            className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950/20 border border-slate-800 hover:border-purple-500/50 shadow-xl transition-all group duration-200"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-white group-hover:text-purple-400 transition flex items-center justify-between">
              <span>Admin Management</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Revenue analytics, food menu CRUD, table QR generator, printable standees & categories.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-purple-400 font-bold">
              <span>Admin Controls</span>
              <span>Manage →</span>
            </div>
          </Link>

        </div>

        {/* Feature Highlights Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto pt-6">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <Zap className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <span className="text-xs font-bold text-slate-200">Zero Wait Time</span>
            <p className="text-[10px] text-slate-500">Direct order to kitchen</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <Smartphone className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-xs font-bold text-slate-200">App + Web Fallback</span>
            <p className="text-[10px] text-slate-500">Works on all devices</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <Clock className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-xs font-bold text-slate-200">Live Status Stepper</span>
            <p className="text-[10px] text-slate-500">Real-time sync</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <ShieldCheck className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <span className="text-xs font-bold text-slate-200">Locked Table Session</span>
            <p className="text-[10px] text-slate-500">Accurate bill per table</p>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>© 2026 SMART DINE Ecosystem • React Native + Expo • Firebase Firestore • Netlify</p>
      </footer>

    </div>
  );
}
