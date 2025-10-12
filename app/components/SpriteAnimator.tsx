'use client';

import { useEffect, useState } from 'react';

interface SpriteAnimatorProps {
  sprite: string; // URL to sprite sheet
  frameWidth: number; // Width of each frame in pixels
  frameHeight: number; // Height of each frame in pixels
  frameCount: number; // Total number of frames
  fps?: number; // Frames per second (default 10)
  loop?: boolean; // Whether to loop animation (default true)
  scale?: number; // Scale multiplier (default 2)
  playing?: boolean; // Control play/pause (default true)
  onComplete?: () => void; // Callback when animation completes
  className?: string;
}

export default function SpriteAnimator({
  sprite,
  frameWidth,
  frameHeight,
  frameCount,
  fps = 10,
  loop = true,
  scale = 2,
  playing = true,
  onComplete,
  className = '',
}: SpriteAnimatorProps) {
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    if (!playing) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        const nextFrame = prev + 1;

        if (nextFrame >= frameCount) {
          if (loop) {
            return 0;
          } else {
            if (onComplete) onComplete();
            return prev; // Stay on last frame
          }
        }

        return nextFrame;
      });
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [playing, frameCount, fps, loop, onComplete]);

  const offsetX = -(currentFrame * frameWidth);

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{
        width: frameWidth * scale,
        height: frameHeight * scale,
        imageRendering: 'pixelated', // Keeps sprites crisp
      }}
    >
      <div
        style={{
          width: frameWidth * frameCount * scale,
          height: frameHeight * scale,
          backgroundImage: `url(${sprite})`,
          backgroundSize: `${frameWidth * frameCount * scale}px ${frameHeight * scale}px`,
          backgroundPosition: `${offsetX * scale}px 0`,
          backgroundRepeat: 'no-repeat',
        }}
      />
    </div>
  );
}
