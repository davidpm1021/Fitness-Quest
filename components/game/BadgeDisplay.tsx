"use client";

import { BadgeType } from '@prisma/client';

interface Badge {
  badgeType: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  earnedAt: Date | null;
}

interface BadgeDisplayProps {
  badges: Badge[];
  title: string;
  compact?: boolean;
}

export function BadgeDisplay({ badges, title, compact = false }: BadgeDisplayProps) {
  if (badges.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <div
            key={badge.badgeType}
            className={`relative group ${
              badge.isUnlocked ? 'opacity-100' : 'opacity-30'
            }`}
            title={`${badge.name} - ${badge.description}`}
          >
            <div className="text-3xl">{badge.icon}</div>
            {!badge.isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-2xl opacity-60">🔒</div>
              </div>
            )}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {badge.name}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.badgeType}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${
                badge.isUnlocked
                  ? 'bg-white dark:bg-gray-800 border-indigo-300 dark:border-indigo-600 shadow-md hover:shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 opacity-60'
              }
            `}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="relative">
                <div className="text-4xl">{badge.icon}</div>
                {!badge.isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-3xl opacity-70">🔒</div>
                  </div>
                )}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {badge.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {badge.description}
                </div>
                {badge.isUnlocked && badge.earnedAt && (
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                    Earned {new Date(badge.earnedAt).toLocaleDateString()}
                  </div>
                )}
                {!badge.isUnlocked && (
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                    Not yet earned
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BadgeNotificationProps {
  badges: Array<{
    name: string;
    description: string;
    icon: string;
  }>;
  onClose: () => void;
}

export function BadgeNotification({ badges, onClose }: BadgeNotificationProps) {
  if (badges.length === 0) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-scale-in">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {badges.length === 1 ? 'New Badge Earned!' : 'New Badges Earned!'}
          </h2>
          <div className="space-y-3">
            {badges.map((badge, index) => (
              <div
                key={index}
                className="flex items-center justify-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg"
              >
                <div className="text-4xl">{badge.icon}</div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {badge.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {badge.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
}

interface BadgeProgressProps {
  earnedCount: number;
  totalCount: number;
}

export function BadgeProgress({ earnedCount, totalCount }: BadgeProgressProps) {
  const percentage = Math.round((earnedCount / totalCount) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-900 dark:text-white">
          Badge Collection
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          {earnedCount} / {totalCount}
        </span>
      </div>
      <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-center text-gray-600 dark:text-gray-400">
        {percentage}% Complete
      </div>
    </div>
  );
}
