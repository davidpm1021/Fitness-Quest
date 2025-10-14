'use client';

import { useEffect, useRef, useState } from 'react';

export interface SpriteSheetProps {
  /** Path to sprite sheet image */
  src: string;
  /** Width of each frame in pixels */
  frameWidth: number;
  /** Height of each frame in pixels */
  frameHeight: number;
  /** Total number of frames in the sprite sheet */
  frameCount: number;
  /** Frames per second (default: 8) */
  fps?: number;
  /** Whether to loop the animation (default: true) */
  loop?: boolean;
  /** Scale multiplier for display size (default: 4 for 32px → 128px) */
  scale?: number;
  /** Control play/pause externally (default: true) */
  playing?: boolean;
  /** Callback when animation completes (non-looping) */
  onComplete?: () => void;
  /** Callback for each frame change */
  onFrameChange?: (frame: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Start from specific frame */
  startFrame?: number;
  /** Flip horizontally */
  flipX?: boolean;
  /** Flip vertically */
  flipY?: boolean;
}

/**
 * SpriteSheet Component
 *
 * Renders animated sprite sheets with precise control.
 * Designed for pixel-perfect rendering with nearest-neighbor scaling.
 *
 * @example
 * <SpriteSheet
 *   src="/sprites/hero-attack.png"
 *   frameWidth={32}
 *   frameHeight={32}
 *   frameCount={8}
 *   fps={12}
 *   scale={4}
 * />
 */
export default function SpriteSheet({
  src,
  frameWidth,
  frameHeight,
  frameCount,
  fps = 8,
  loop = true,
  scale = 4,
  playing = true,
  onComplete,
  onFrameChange,
  className = '',
  startFrame = 0,
  flipX = false,
  flipY = false,
}: SpriteSheetProps) {
  const [currentFrame, setCurrentFrame] = useState(startFrame);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Preload image
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error(`Failed to load sprite sheet: ${src}`);
    };
  }, [src]);

  // Animation loop
  useEffect(() => {
    if (!playing || !imageLoaded) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        const nextFrame = prev + 1;

        // Handle loop end
        if (nextFrame >= frameCount) {
          if (loop) {
            return 0;
          } else {
            if (onComplete) onComplete();
            return prev; // Stay on last frame
          }
        }

        if (onFrameChange) onFrameChange(nextFrame);
        return nextFrame;
      });
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [playing, imageLoaded, frameCount, fps, loop, onComplete, onFrameChange]);

  // Reset to start frame when src changes
  useEffect(() => {
    setCurrentFrame(startFrame);
  }, [src, startFrame]);

  // Calculate sprite position
  const offsetX = -(currentFrame * frameWidth);

  // Display dimensions
  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;

  return (
    <div
      className={`sprite-sheet-container ${className}`}
      style={{
        width: displayWidth,
        height: displayHeight,
        overflow: 'hidden',
        position: 'relative',
        imageRendering: 'pixelated', // Crisp pixel scaling
        WebkitImageRendering: 'pixelated' as any, // Vendor prefix for Safari
      } as React.CSSProperties}
    >
      <div
        className="sprite-sheet-inner"
        style={{
          width: frameWidth * frameCount * scale,
          height: frameHeight * scale,
          backgroundImage: imageLoaded ? `url(${src})` : 'none',
          backgroundSize: `${frameWidth * frameCount * scale}px ${frameHeight * scale}px`,
          backgroundPosition: `${offsetX * scale}px 0`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          transform: `scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`,
          transformOrigin: 'center',
        }}
      />

      {/* Loading placeholder */}
      {!imageLoaded && (
        <div
          className="sprite-loading"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: scale * 4,
          }}
        >
          ⏳
        </div>
      )}
    </div>
  );
}
