"use client";

import { useState } from "react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { path: "/dashboard", label: "DASHBOARD", icon: "🏠" },
    { path: "/character", label: "CHARACTER", icon: "🎨" },
    { path: "/goals", label: "GOALS", icon: "🎯" },
    { path: "/party/dashboard", label: "PARTY", icon: "👥" },
    { path: "/check-in", label: "CHECK-IN", icon: "⚔️" },
    { path: "/skills", label: "SKILLS", icon: "🌟" },
    { path: "/badges", label: "BADGES", icon: "🏆" },
    { path: "/history", label: "HISTORY", icon: "📊" },
    { path: "/settings", label: "SETTINGS", icon: "⚙️" },
  ];

  const handleNavClick = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="relative z-50 bg-gradient-to-r from-gray-900 to-gray-800 border-b-4 border-yellow-500 shadow-[0_4px_0_0_rgba(0,0,0,0.3)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 relative">
            {/* Left side - Hamburger */}
            <div className="flex items-center">
              {/* Hamburger Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-yellow-400 hover:text-yellow-300 transition-colors p-2 -ml-2"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>

            {/* Center - Hero Name */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="font-pixel text-2xl md:text-3xl text-yellow-400 drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)] font-bold whitespace-nowrap">
                {user?.characterName || user?.displayName}
              </h1>
            </div>

            {/* Right side - Logout */}
            <div className="ml-auto">
              <PixelButton variant="danger" size="sm" onClick={logout}>
                ↩
              </PixelButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Slide-out Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed top-16 left-0 bottom-0 w-64 bg-gradient-to-b from-gray-900 to-gray-800 border-r-4 border-yellow-500 z-40 shadow-2xl overflow-y-auto">
            <div className="p-4">
              {/* User Info */}
              <div className="mb-6 pb-4 border-b-2 border-gray-700">
                <div className="text-yellow-400 font-pixel text-sm mb-1">
                  HERO
                </div>
                <div className="text-white font-retro text-lg">
                  {user?.displayName}
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.path;
                  return (
                    <button
                      key={link.path}
                      onClick={() => handleNavClick(link.path)}
                      className={`
                        w-full px-4 py-3 font-pixel text-sm rounded
                        transition-all text-left flex items-center gap-3
                        ${
                          isActive
                            ? "bg-yellow-500 text-gray-900 shadow-[3px_3px_0_0_rgba(0,0,0,0.3)]"
                            : "text-yellow-300 hover:text-yellow-100 hover:bg-gray-800"
                        }
                      `}
                    >
                      <span className="text-xl">{link.icon}</span>
                      <span>{link.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Logout at bottom */}
              <div className="mt-6 pt-4 border-t-2 border-gray-700">
                <PixelButton
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="w-full"
                >
                  ↩ LOGOUT
                </PixelButton>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
