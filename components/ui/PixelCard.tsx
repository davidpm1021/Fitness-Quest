import React from 'react';

interface PixelCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'hero' | 'monster' | 'stat';
  glowColor?: string;
}

export default function PixelCard({
  children,
  className = '',
  variant = 'default',
  glowColor,
}: PixelCardProps) {
  const baseClasses = 'relative rounded-lg overflow-hidden';

  // Pixel corner decorations
  const cornerSize = 'w-3 h-3';
  const cornerClasses = 'absolute bg-gray-800 dark:bg-gray-200';

  const variants = {
    default: 'bg-white dark:bg-gray-800 border-4 border-gray-800 dark:border-gray-200',
    hero: 'bg-gradient-to-br from-blue-500 to-blue-700 border-4 border-blue-900 text-white',
    monster: 'bg-gradient-to-br from-red-500 to-red-700 border-4 border-red-900 text-white',
    stat: 'bg-gradient-to-br from-purple-500 to-purple-700 border-4 border-purple-900 text-white',
  };

  const glowEffect = glowColor ? `shadow-[0_0_20px_${glowColor}]` : '';

  return (
    <div className={`${baseClasses} ${variants[variant]} ${glowEffect} ${className}`}>
      {/* Pixel corners - top left */}
      <div className={`${cornerClasses} ${cornerSize} top-0 left-0`} />
      {/* Top right */}
      <div className={`${cornerClasses} ${cornerSize} top-0 right-0`} />
      {/* Bottom left */}
      <div className={`${cornerClasses} ${cornerSize} bottom-0 left-0`} />
      {/* Bottom right */}
      <div className={`${cornerClasses} ${cornerSize} bottom-0 right-0`} />

      {/* Inner border glow effect */}
      <div className="absolute inset-[4px] rounded-sm border-2 border-white/10 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 p-6">{children}</div>
    </div>
  );
}
