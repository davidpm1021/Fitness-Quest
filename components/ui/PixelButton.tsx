import React from 'react';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function PixelButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: PixelButtonProps) {
  const baseClasses = 'font-bold uppercase tracking-wider transition-all duration-100 relative overflow-hidden';

  // Enhanced pixel art border effect with 3D look
  const pixelBorder = 'shadow-[0_0_0_3px_rgba(0,0,0,0.4),0_0_0_6px_currentColor,6px_6px_0_0_rgba(0,0,0,0.4)]';

  const variants = {
    primary: 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600 active:bg-blue-700',
    secondary: 'bg-gray-500 text-white border-gray-600 hover:bg-gray-600 active:bg-gray-700',
    success: 'bg-green-500 text-white border-green-600 hover:bg-green-600 active:bg-green-700',
    danger: 'bg-red-500 text-white border-red-600 hover:bg-red-600 active:bg-red-700',
    warning: 'bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600 active:bg-yellow-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer hover:translate-y-[-3px] hover:shadow-[0_0_0_3px_rgba(0,0,0,0.4),0_0_0_6px_currentColor,8px_8px_0_0_rgba(0,0,0,0.4)] active:translate-y-[3px] active:shadow-[0_0_0_3px_rgba(0,0,0,0.4),0_0_0_6px_currentColor,2px_2px_0_0_rgba(0,0,0,0.4)]';

  return (
    <button
      className={`
        ${baseClasses}
        ${pixelBorder}
        ${variants[variant]}
        ${sizes[size]}
        ${disabledClasses}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {/* Pixel shimmer effect */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      <span className="relative z-10">{children}</span>
    </button>
  );
}
