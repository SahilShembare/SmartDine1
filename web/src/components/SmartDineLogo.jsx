import React from 'react';

/**
 * SmartDineLogo - Indian Restaurant Theme
 * SMART (Golden Yellow #F4B942 or Cream #FFF8ED) + DINE (Warm Orange #E8752A)
 */
export default function SmartDineLogo({ size = 'md', showIcon = true, showText = true, className = '', light = false }) {
  const sizeConfig = {
    xs: { text: 'text-sm', icon: 'w-6 h-6', iconBorder: 'border', gap: 'gap-1.5' },
    sm: { text: 'text-base', icon: 'w-7 h-7', iconBorder: 'border', gap: 'gap-2' },
    md: { text: 'text-xl', icon: 'w-10 h-10', iconBorder: 'border-2', gap: 'gap-2.5' },
    lg: { text: 'text-2xl', icon: 'w-14 h-14', iconBorder: 'border-2', gap: 'gap-3' },
    xl: { text: 'text-3xl', icon: 'w-20 h-20', iconBorder: 'border-[3px]', gap: 'gap-3' },
    hero: { text: 'text-4xl sm:text-5xl md:text-6xl', icon: 'w-24 h-24 sm:w-28 sm:h-28', iconBorder: 'border-4', gap: 'gap-4' },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      {showIcon && (
        <img
          src="/logo.png"
          alt="SMART DINE - Premium Restaurant Dining"
          className={`${config.icon} rounded-full object-cover ${config.iconBorder} border-[#F4B942] shadow-[0_0_12px_rgba(244,185,66,0.4)] hover:scale-105 transition-transform duration-200`}
        />
      )}
      {showText && (
        <span
          className={`${config.text} font-black uppercase tracking-[0.08em] drop-shadow-sm`}
          style={{ fontFamily: "'Outfit', 'Poppins', sans-serif" }}
        >
          <span className="text-[#F4B942]">SMART</span>
          {' '}
          <span className="text-[#E8752A]">DINE</span>
        </span>
      )}
    </div>
  );
}
