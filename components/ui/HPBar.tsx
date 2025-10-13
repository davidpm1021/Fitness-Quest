'use client';

import React from 'react';

interface HPBarProps {
  current: number;
  max: number;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  animated?: boolean;
  label?: string;
  showLabel?: boolean;
  showMilestones?: boolean; // Show milestone markers at 75%, 50%, 25%
  variant?: 'player' | 'enemy';
}

export default function HPBar({
  current,
  max,
  size = 'md',
  showText = true,
  animated = true,
  label = 'HP',
  showLabel = true,
  showMilestones = false,
  variant = 'player',
}: HPBarProps) {
  const percentage = Math.min(Math.max((current / max) * 100, 0), 100);
  const isLowHealth = percentage <= 25;
  const isCriticalHealth = percentage <= 10;

  // Color based on HP percentage
  const getColor = () => {
    if (variant === 'enemy') {
      // Enemy HP bar - red/orange colors
      if (percentage > 60) return 'bg-red-500';
      if (percentage > 30) return 'bg-orange-500';
      return 'bg-red-700';
    }
    // Player HP bar - green/yellow/red
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const sizes = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="w-full">
      {/* Label */}
      {showLabel && label && (
        <div className={`flex justify-between mb-1 ${textSizes[size]} font-bold`}>
          <span className="text-gray-700 dark:text-gray-300">{label}</span>
          {showText && (
            <span className="text-gray-600 dark:text-gray-400">
              {current}/{max}
            </span>
          )}
        </div>
      )}

      {/* HP Bar Container */}
      <div
        className={`
          relative w-full ${sizes[size]}
          bg-gray-800 dark:bg-gray-900
          border-4 border-gray-900 dark:border-gray-700
          rounded-sm overflow-hidden
          shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
          ${isCriticalHealth ? 'animate-shake' : isLowHealth ? 'animate-pulse' : ''}
        `}
      >
        {/* Pixel grid overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(255,255,255,0.1) 2px,
                rgba(255,255,255,0.1) 4px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(255,255,255,0.1) 2px,
                rgba(255,255,255,0.1) 4px
              )
            `,
          }}
        />

        {/* HP Fill */}
        <div
          className={`
            relative h-full ${getColor()}
            ${animated ? 'transition-all duration-500 ease-out' : ''}
            shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.3)]
          `}
          style={{ width: `${percentage}%` }}
        >
          {/* Animated shimmer effect */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
            style={{
              animation: 'shimmer 2s infinite',
            }}
          />
        </div>

        {/* Empty HP indicator pattern */}
        {percentage < 100 && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 4px,
                rgba(255,255,255,0.05) 4px,
                rgba(255,255,255,0.05) 8px
              )`,
            }}
          />
        )}

        {/* Milestone markers */}
        {showMilestones && (
          <>
            {[75, 50, 25].map((milestone) => (
              <div
                key={milestone}
                className="absolute top-0 bottom-0 w-1 bg-yellow-400 opacity-60 z-10"
                style={{ left: `${milestone}%` }}
                title={`${milestone}% milestone`}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs font-pixel text-yellow-400 whitespace-nowrap drop-shadow-[1px_1px_0_rgba(0,0,0,0.8)]">
                  {milestone === percentage.toFixed(0) ? '🎯' : ''}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
