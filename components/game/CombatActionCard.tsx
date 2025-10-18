"use client";

import PixelPanel from "@/components/ui/PixelPanel";

interface CombatActionCardProps {
  action: "ATTACK" | "DEFEND" | "SUPPORT" | "HEROIC_STRIKE";
  selected: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  description: string;
  details: string[];
  disabled?: boolean;
  focusRequired?: number;
  currentFocus?: number;
}

export default function CombatActionCard({
  action,
  selected,
  onClick,
  icon,
  title,
  description,
  details,
  disabled = false,
  focusRequired,
  currentFocus,
}: CombatActionCardProps) {
  const isLocked = focusRequired && currentFocus !== undefined && currentFocus < focusRequired;
  const cannotUse = disabled || isLocked;

  const getActionColor = () => {
    switch (action) {
      case "ATTACK":
        return "border-red-500 hover:bg-red-900/20";
      case "DEFEND":
        return "border-blue-500 hover:bg-blue-900/20";
      case "SUPPORT":
        return "border-green-500 hover:bg-green-900/20";
      case "HEROIC_STRIKE":
        return "border-yellow-500 hover:bg-yellow-900/20";
      default:
        return "border-gray-500";
    }
  };

  const getIconColor = () => {
    switch (action) {
      case "ATTACK":
        return "text-red-400";
      case "DEFEND":
        return "text-blue-400";
      case "SUPPORT":
        return "text-green-400";
      case "HEROIC_STRIKE":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div
      onClick={cannotUse ? undefined : onClick}
      className={`
        relative rounded-lg border-4 p-4 transition-all cursor-pointer
        bg-gray-800/80 backdrop-blur-sm
        ${selected ? "ring-4 ring-white scale-105" : "scale-100"}
        ${cannotUse ? "opacity-50 cursor-not-allowed" : ""}
        ${getActionColor()}
        ${!cannotUse && "hover:scale-105"}
      `}
    >
      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute top-2 right-2 bg-gray-900/90 rounded-lg px-2 py-1 border-2 border-red-500">
          <span className="font-pixel text-xs text-red-400">
            🔒 {focusRequired} FOCUS
          </span>
        </div>
      )}

      {/* Icon and title */}
      <div className="text-center mb-3">
        <div className={`text-5xl mb-2 ${getIconColor()}`}>{icon}</div>
        <h3 className="font-pixel text-lg text-white">{title}</h3>
      </div>

      {/* Description */}
      <p className="font-retro text-sm text-white text-center mb-4">
        {description}
      </p>

      {/* Details list */}
      <ul className="space-y-2">
        {details.map((detail, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-yellow-400 flex-shrink-0">•</span>
            <span className="font-retro text-xs text-gray-200 flex-1">
              {detail}
            </span>
          </li>
        ))}
      </ul>

      {/* Focus cost indicator */}
      {focusRequired && !isLocked && (
        <div className="mt-3 pt-3 border-t-2 border-gray-700 text-center">
          <span className="font-pixel text-xs text-yellow-300">
            ⭐ Costs {focusRequired} Focus
          </span>
        </div>
      )}

      {/* Selected indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 bg-green-500 rounded-full w-8 h-8 flex items-center justify-center border-4 border-gray-900">
          <span className="text-xl">✓</span>
        </div>
      )}
    </div>
  );
}
