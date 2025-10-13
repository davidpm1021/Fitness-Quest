'use client';

import React from 'react';

interface StatDisplayProps {
  label: string;
  value: string | number;
  icon?: string;
  variant?: 'hp' | 'defense' | 'streak' | 'level' | 'default';
  size?: 'sm' | 'md' | 'lg';
}

export default function StatDisplay({
  label,
  value,
  icon,
  variant = 'default',
  size = 'md',
}: StatDisplayProps) {
  const variants = {
    hp: 'bg-gradient-to-br from-red-600 to-red-800 border-red-700',
    defense: 'bg-gradient-to-br from-blue-600 to-blue-800 border-blue-700',
    streak: 'bg-gradient-to-br from-orange-600 to-orange-800 border-orange-700',
    level: 'bg-gradient-to-br from-purple-600 to-purple-800 border-purple-700',
    default: 'bg-gradient-to-br from-gray-600 to-gray-800 border-gray-700',
  };

  const sizes = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const valueSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <div
      className={`
        relative rounded-lg border-4 ${variants[variant]} ${sizes[size]}
        shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]
        text-white font-bold
      `}
    >
      {/* Pixel corners */}
      <div className="absolute top-0 left-0 w-2 h-2 bg-white/20" />
      <div className="absolute top-0 right-0 w-2 h-2 bg-white/20" />
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-white/20" />
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-white/20" />

      {/* Inner glow */}
      <div className="absolute inset-[4px] rounded-sm border border-white/10" />

      {/* Content */}
      <div className="relative z-10 text-center">
        {icon && <div className="text-3xl mb-1">{icon}</div>}
        <div className={`uppercase tracking-wider ${textSizes[size]} text-white/80`}>
          {label}
        </div>
        <div className={`${valueSizes[size]} font-black mt-1 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]`}>
          {value}
        </div>
      </div>

      {/* Scanline effect */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none rounded-md"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />
    </div>
  );
}
