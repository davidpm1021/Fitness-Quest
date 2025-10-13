"use client";

import React, { useState } from 'react';

interface PixelPasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function PixelPasswordInput({
  label,
  error,
  helperText,
  className = '',
  ...props
}: PixelPasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label className="block font-bold text-sm uppercase tracking-wider mb-2 text-gray-900 dark:text-white">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          className={`
            w-full px-4 py-3 pr-14
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

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          <span className="text-2xl select-none">
            {showPassword ? '👁️' : '🔒'}
          </span>
        </button>
      </div>

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
