"use client";

import { ReactNode } from "react";
import AuthenticatedNav from "./AuthenticatedNav";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  backPath?: string;
  requireAuth?: boolean;
}

/**
 * Global page layout component that provides:
 * - Consistent dark game background with starfield animation
 * - Optional navigation bar
 * - Proper z-index layering
 *
 * Use this component to wrap all page content for consistent styling.
 */
export default function PageLayout({
  children,
  title,
  showBackButton = false,
  backPath = "/dashboard",
  requireAuth = true,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen game-bg pixel-grid-bg">
      {/* Animated starfield background - globally consistent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: i % 5 === 0 ? "3px" : "2px",
              height: i % 5 === 0 ? "3px" : "2px",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Navigation bar (if authenticated page) */}
      {requireAuth && (
        <AuthenticatedNav
          title={title}
          showBackButton={showBackButton}
          backPath={backPath}
        />
      )}

      {/* Page content - always above background */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
