"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import PixelButton from "@/components/ui/PixelButton";
import PixelBadge from "@/components/ui/PixelBadge";

interface AuthenticatedNavProps {
  title?: string;
  showBackButton?: boolean;
  backPath?: string;
}

export default function AuthenticatedNav({
  title,
  showBackButton = false,
  backPath = "/dashboard",
}: AuthenticatedNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = [
    { path: "/dashboard", label: "DASHBOARD", icon: "🏠" },
    { path: "/character", label: "CHARACTER", icon: "🎨" },
    { path: "/goals", label: "GOALS", icon: "🎯" },
    { path: "/party/dashboard", label: "PARTY", icon: "👥" },
    { path: "/check-in", label: "CHECK-IN", icon: "⚔️" },
    { path: "/badges", label: "BADGES", icon: "🏆" },
    { path: "/settings", label: "SETTINGS", icon: "⚙️" },
  ];

  return (
    <nav className="relative z-10 bg-gradient-to-r from-gray-900 to-gray-800 border-b-4 border-yellow-500 shadow-[0_4px_0_0_rgba(0,0,0,0.3)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Left side - Title/Logo */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button
                onClick={() => router.push(backPath)}
                className="text-purple-300 hover:text-white font-retro transition-colors"
              >
                ← BACK
              </button>
            )}
            <h1 className="font-pixel text-xl md:text-2xl text-yellow-400 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
              {title || "FITNESS QUEST"}
            </h1>
            {!title && (
              <PixelBadge variant="info" size="sm">
                BETA
              </PixelBadge>
            )}
          </div>

          {/* Center - Navigation Links (hidden on mobile) */}
          <div className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => router.push(link.path)}
                  className={`
                    px-3 py-2 font-pixel text-xs rounded
                    transition-all
                    ${
                      isActive
                        ? "bg-yellow-500 text-gray-900 shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]"
                        : "text-yellow-300 hover:text-yellow-100 hover:bg-gray-800"
                    }
                  `}
                >
                  {link.icon} {link.label}
                </button>
              );
            })}
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-white font-retro text-sm">
              <span className="text-gray-400">HERO:</span> {user?.displayName}
            </div>
            <PixelButton variant="danger" size="sm" onClick={logout}>
              ↩ LOGOUT
            </PixelButton>
          </div>
        </div>

        {/* Mobile navigation (shown on small screens) */}
        <div className="lg:hidden flex items-center gap-2 pb-3 overflow-x-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => router.push(link.path)}
                className={`
                  px-3 py-2 font-pixel text-xs rounded whitespace-nowrap
                  transition-all flex-shrink-0
                  ${
                    isActive
                      ? "bg-yellow-500 text-gray-900 shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]"
                      : "text-yellow-300 hover:text-yellow-100 hover:bg-gray-800"
                  }
                `}
              >
                {link.icon} {link.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
