"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  type = "info",
  duration = 3000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  function handleClose() {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  }

  const typeStyles = {
    success: {
      bg: "bg-green-900/90 border-green-500",
      icon: "✓",
      iconBg: "bg-green-600",
    },
    error: {
      bg: "bg-red-900/90 border-red-500",
      icon: "✖",
      iconBg: "bg-red-600",
    },
    warning: {
      bg: "bg-yellow-900/90 border-yellow-500",
      icon: "⚠",
      iconBg: "bg-yellow-600",
    },
    info: {
      bg: "bg-blue-900/90 border-blue-500",
      icon: "ℹ",
      iconBg: "bg-blue-600",
    },
  };

  const style = typeStyles[type];

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50
        ${style.bg}
        border-4 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.4)]
        p-4 flex items-center gap-4 min-w-[320px] max-w-md
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
    >
      {/* Icon */}
      <div
        className={`
          ${style.iconBg}
          w-10 h-10 rounded-full
          flex items-center justify-center
          font-pixel text-xl text-white
          shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]
        `}
      >
        {style.icon}
      </div>

      {/* Message */}
      <div className="flex-1 font-retro text-white text-sm">
        {message}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="text-white hover:text-gray-300 font-pixel text-xl transition-colors"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}
