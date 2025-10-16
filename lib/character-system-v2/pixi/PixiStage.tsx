"use client";

import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';

/**
 * PixiStage Props
 */
export interface PixiStageProps {
  /** Width of the canvas in pixels */
  width: number;

  /** Height of the canvas in pixels */
  height: number;

  /** Background color (hex string, e.g., "#1a1a1a") */
  backgroundColor?: string;

  /** Enable antialiasing (default: false for pixel art) */
  antialias?: boolean;

  /** Children to render (PixiJS sprites, containers, etc.) */
  children?: React.ReactNode;

  /** Optional className for the canvas container */
  className?: string;

  /** Callback when the PixiJS app is ready */
  onAppReady?: (app: Application) => void;

  /** Optional resolution multiplier (defaults to window.devicePixelRatio) */
  resolution?: number;

  /** Enable auto-density for high-DPI displays (default: true) */
  autoDensity?: boolean;
}

/**
 * PixiStage Component
 *
 * A React wrapper around the PixiJS Application.
 * Provides a canvas for rendering PixiJS content with proper configuration
 * for crisp pixel art rendering.
 *
 * @example
 * ```tsx
 * <PixiStage width={800} height={600} backgroundColor="#1a1a1a">
 *   {app => (
 *     // Render PixiJS content here
 *   )}
 * </PixiStage>
 * ```
 */
export default function PixiStage({
  width,
  height,
  backgroundColor = '#1a1a1a',
  antialias = false,
  children,
  className = '',
  onAppReady,
  resolution,
  autoDensity = true,
}: PixiStageProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create PixiJS application
    const app = new Application();

    // Initialize the app
    (async () => {
      // Convert hex string to number for PixiJS v8
      const bgColor = backgroundColor || '#1a1a1a';
      const bgColorNumber = parseInt(bgColor.replace('#', ''), 16);

      await app.init({
        width,
        height,
        background: bgColorNumber, // PixiJS v8 uses 'background' instead of 'backgroundColor'
        antialias,
        resolution: resolution ?? window.devicePixelRatio,
        autoDensity,
        // Prefer WebGL, but fallback to WebGPU if needed
        preference: 'webgl',
        // Round pixels to avoid sub-pixel rendering (PixiJS v8 config)
        roundPixels: true,
      });

      // Append canvas to container
      if (canvasRef.current && app.canvas) {
        // Ensure canvas has proper CSS for visibility
        app.canvas.style.display = 'block';
        app.canvas.style.width = `${width}px`;
        app.canvas.style.height = `${height}px`;
        canvasRef.current.appendChild(app.canvas);
      }

      // Store app reference
      appRef.current = app;

      // PixiJS v8: Set up manual render loop
      // Start the ticker and add render call
      app.ticker.add(() => {
        app.renderer.render(app.stage);
      });
      app.ticker.start();

      setIsReady(true);

      // Notify parent component
      if (onAppReady) {
        onAppReady(app);
      }

      console.log('[PixiStage] App initialized and started:', {
        width: app.renderer.width,
        height: app.renderer.height,
        stageChildren: app.stage.children.length,
        tickerStarted: app.ticker.started,
      });
    })();

    // Cleanup on unmount
    return () => {
      if (appRef.current) {
        // Stop the ticker before destroying
        appRef.current.ticker.stop();
        appRef.current.destroy(true, {
          children: true,
          texture: true,
          textureSource: true,
        });
        appRef.current = null;
      }
    };
  }, [width, height, backgroundColor, antialias, resolution, autoDensity, onAppReady]);

  // Update canvas size if props change
  useEffect(() => {
    if (appRef.current && appRef.current.renderer) {
      appRef.current.renderer.resize(width, height);
    }
  }, [width, height]);

  return (
    <div
      ref={canvasRef}
      className={`pixi-stage-container ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {!isReady && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: backgroundColor || '#1a1a1a',
            color: '#ffffff',
            fontFamily: 'monospace',
          }}
        >
          Loading PixiJS...
        </div>
      )}
      {isReady && appRef.current && typeof children === 'function'
        ? children(appRef.current)
        : null}
    </div>
  );
}

/**
 * Hook to access the PixiJS Application instance
 * Use this within children of PixiStage
 */
export function usePixiApp() {
  // This will be implemented when we add a context provider
  // For now, users should access the app via the render prop
  throw new Error('usePixiApp must be used within a PixiStage component');
}
