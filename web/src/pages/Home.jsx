import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogIn, 
  UserPlus, 
  ChefHat, 
  LayoutDashboard,
  QrCode,
  UtensilsCrossed,
  Sparkles
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden bg-slate-950">
      
      {/* Background Image with Dark Vignette Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&auto=format&fit=crop&q=80"
          alt="Restaurant Dining Area"
          className="w-full h-full object-cover object-center scale-105 animate-in fade-in duration-1000"
        />
        {/* Dark gradient overlays to ensure text contrast and match the screenshot */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/85"></div>
      </div>

      {/* Empty Top spacer for flex balance */}
      <div className="relative z-10"></div>

      {/* Main Centered Content (Exactly matching screenshot) */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 py-12">
        
        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] font-sans">
          Welcome To SmartDine
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-slate-100/90 font-medium tracking-wide drop-shadow-md max-w-2xl mx-auto">
          QR Based Smart Restaurant Ordering System
        </p>

        {/* 2 Main Action Option Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
          
          {/* Option 1: Login (Yellow / Amber rounded button) */}
          <button
            onClick={() => navigate('/login?mode=login')}
            className="w-full sm:w-auto min-w-[140px] px-7 py-3 rounded-full bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-[0_4px_20px_rgba(251,191,36,0.4)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            <span>Login</span>
          </button>

          {/* Option 2: Create New Account (Green rounded button) */}
          <button
            onClick={() => navigate('/login?mode=register')}
            className="w-full sm:w-auto px-7 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm tracking-wide shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Account</span>
          </button>

        </div>

      </div>

      {/* Bottom Footer / Staff Access Shortcuts */}
      <div className="relative z-10 p-4 sm:p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300/80">
          
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Contactless Dining • Scan QR Code to Order Instantly</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/menu?table=01"
              className="text-amber-300 hover:text-amber-200 font-semibold underline flex items-center gap-1 transition"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Direct Digital Menu</span>
            </Link>

            <span className="text-slate-600">|</span>

            <Link
              to="/login?role=kitchen"
              className="text-slate-300 hover:text-white transition flex items-center gap-1"
            >
              <ChefHat className="w-3.5 h-3.5 text-amber-400" />
              <span>Kitchen</span>
            </Link>

            <span className="text-slate-600">|</span>

            <Link
              to="/login?role=admin"
              className="text-slate-300 hover:text-white transition flex items-center gap-1"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin</span>
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}
