import React from 'react';

interface PixelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function PixelInput({
  label,
  error,
  helperText,
  className = '',
  ...props
}: PixelInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block font-bold text-sm uppercase tracking-wider mb-2 text-gray-900 dark:text-white">
          {label}
        </label>
      )}

      <input
        className={`
          w-full px-4 py-3
          bg-white dark:bg-gray-800
          border-4 ${error ? 'border-red-500' : 'border-gray-800 dark:border-gray-600'}
          rounded-sm
          font-retro text-lg
          text-gray-900 dark:text-white
          placeholder-gray-400
          shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]
          transition-all duration-150
          focus:outline-none
          focus:border-blue-500
          focus:shadow-[4px_4px_0_0_rgba(59,130,246,0.4)]
          focus:translate-y-[-2px]
          disabled:opacity-50
          disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />

      {error && (
        <p className="mt-2 text-sm font-bold text-red-500 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
}
