import React from 'react';

interface PixelBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PixelBadge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: PixelBadgeProps) {
  const variants = {
    default: 'bg-gray-600 text-white border-gray-700',
    success: 'bg-green-600 text-white border-green-700',
    danger: 'bg-red-600 text-white border-red-700',
    warning: 'bg-yellow-600 text-white border-yellow-700',
    info: 'bg-blue-600 text-white border-blue-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`
        inline-block font-bold uppercase tracking-wider
        border-2 rounded-sm
        shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
