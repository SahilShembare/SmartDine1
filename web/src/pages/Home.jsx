import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center overflow-hidden bg-slate-950 px-4">
      
      {/* Background Image: Professional Luxury Restaurant Interior with Warm Ambient Lighting */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1544025162-d76694265947?w=1920&auto=format&fit=crop&q=85"
          alt="Professional Luxury Restaurant Dining Ambiance"
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
        />
        {/* Cinematic dark overlay for crystal-clear readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/80"></div>
      </div>

      {/* Main Centered Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 py-8">
        
        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] font-sans">
          Welcome To SmartDine
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-slate-100/90 font-medium tracking-wide drop-shadow-md max-w-2xl mx-auto">
          QR Based Smart Restaurant Ordering System
        </p>

        {/* 2 Main Action Option Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
          
          {/* Option 1: Login (Amber / Yellow button) */}
          <button
            onClick={() => navigate('/login?mode=login')}
            className="w-full sm:w-auto min-w-[140px] px-8 py-3 rounded-full bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-[0_4px_25px_rgba(251,191,36,0.45)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            <span>Login</span>
          </button>

          {/* Option 2: Create New Account (Emerald Green button) */}
          <button
            onClick={() => navigate('/login?mode=register')}
            className="w-full sm:w-auto px-8 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm tracking-wide shadow-[0_4px_25px_rgba(16,185,129,0.45)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Account</span>
          </button>

        </div>

      </div>

    </div>
  );
}
