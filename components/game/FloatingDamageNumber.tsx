"use client";

import { useEffect, useState } from "react";

interface FloatingDamageNumberProps {
  damage: number;
  isCritical?: boolean;
  position?: { x: number; y: number };
  onComplete?: () => void;
}

export default function FloatingDamageNumber({
  damage,
  isCritical = false,
  position = { x: 50, y: 50 },
  onComplete,
}: FloatingDamageNumberProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 animate-float-up"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className={`
          font-pixel text-6xl font-bold
          drop-shadow-[4px_4px_0_rgba(0,0,0,0.8)]
          ${isCritical ? 'text-yellow-400 animate-bounce' : 'text-red-500'}
        `}
      >
        {isCritical && '⭐ '}
        -{damage}
        {isCritical && ' ⭐'}
      </div>
      {isCritical && (
        <div className="text-center font-pixel text-xl text-yellow-300 mt-2 animate-pulse">
          CRITICAL!
        </div>
      )}
    </div>
  );
}
