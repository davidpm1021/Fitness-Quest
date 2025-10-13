import React from 'react';

interface PixelPanelProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  variant?: 'default' | 'dialog' | 'menu';
}

export default function PixelPanel({
  children,
  title,
  className = '',
  variant = 'default',
}: PixelPanelProps) {
  const variants = {
    default: 'bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900',
    dialog: 'bg-gradient-to-b from-blue-900 to-blue-950',
    menu: 'bg-gradient-to-b from-purple-900 to-purple-950',
  };

  return (
    <div className={`relative ${className}`}>
      {/* Outer border */}
      <div className="absolute inset-0 bg-gray-900 dark:bg-gray-700 rounded-lg" />

      {/* Inner panel */}
      <div className={`relative m-1 rounded-md ${variants[variant]} p-6`}>
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-yellow-400" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-yellow-400" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-yellow-400" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-yellow-400" />

        {/* Title bar */}
        {title && (
          <div className="mb-4 pb-4 border-b-4 border-gray-700 dark:border-gray-600">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-wider text-center">
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>

        {/* Pixel noise texture overlay */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none rounded-md"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='6.5' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
          }}
        />
      </div>
    </div>
  );
}
