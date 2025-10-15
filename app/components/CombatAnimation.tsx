'use client';

import { useState, useEffect } from 'react';
import PixelCharacter from './PixelCharacter';
import DetailedPixelCharacter, { CharacterCustomization } from './DetailedPixelCharacter';
import FloatingDamageNumber from '@/components/game/FloatingDamageNumber';

interface CombatAnimationProps {
  playerName: string;
  monsterName: string;
  damage: number;
  hit: boolean;
  combatAction?: 'ATTACK' | 'DEFEND' | 'SUPPORT' | 'HEROIC_STRIKE';
  counterattack?: {
    damage: number;
    happened: boolean;
  };
  characterCustomization?: CharacterCustomization | null;
  onComplete?: () => void;
}

export default function CombatAnimation({
  playerName,
  monsterName,
  damage,
  hit,
  combatAction = 'ATTACK',
  counterattack,
  characterCustomization,
  onComplete,
}: CombatAnimationProps) {
  const [phase, setPhase] = useState<
    | 'intro'
    | 'ready'
    | 'charge'
    | 'attack'
    | 'impact'
    | 'hit-monster'
    | 'monster-react'
    | 'counterattack-warn'
    | 'counterattack'
    | 'hit-player'
    | 'victory'
    | 'defeat'
    | 'complete'
  >('intro');
  const [showDamage, setShowDamage] = useState(false);
  const [showCounterDamage, setShowCounterDamage] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);
  const [heroPosition, setHeroPosition] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [showSwordSlash, setShowSwordSlash] = useState(false);
  const [showShield, setShowShield] = useState(false);
  const [showHealParticles, setShowHealParticles] = useState(false);

  useEffect(() => {
    // EPIC Animation sequence - SLOWED DOWN for visibility
    const sequence = async () => {
      // INTRO: Characters appear
      setPhase('intro');
      await wait(1500);

      // READY: Battle stance
      setPhase('ready');
      await wait(2000);

      // CHARGE: Hero charges up
      setPhase('charge');
      await wait(2000);

      // ATTACK: Hero lunges forward
      setPhase('attack');
      setHeroPosition(200); // Slide forward

      // Show action-specific effects during attack
      if (combatAction === 'ATTACK' || combatAction === 'HEROIC_STRIKE') {
        setShowSwordSlash(true);
      } else if (combatAction === 'DEFEND') {
        setShowShield(true);
      } else if (combatAction === 'SUPPORT') {
        setShowHealParticles(true);
      }

      await wait(1000);

      if (hit) {
        // IMPACT: Massive hit effect
        setPhase('impact');
        setFlashEffect(true);
        setScreenShake(true);

        // HEROIC_STRIKE gets extra particles and longer shake
        if (combatAction === 'HEROIC_STRIKE') {
          createParticles(20);
          await wait(500);
        } else {
          createParticles(10);
          await wait(300);
        }

        setFlashEffect(false);
        setScreenShake(false);

        // Hide action-specific effects
        setShowSwordSlash(false);
        setShowShield(false);
        setShowHealParticles(false);

        // HIT MONSTER: Show damage
        setPhase('hit-monster');
        setShowDamage(true);
        await wait(2000);

        // MONSTER REACT: Monster staggers
        setPhase('monster-react');
        await wait(1500);
        setShowDamage(false);

        // Counterattack sequence?
        if (counterattack?.happened) {
          // WARNING: Monster prepares counterattack
          setPhase('counterattack-warn');
          await wait(2000);

          // COUNTERATTACK: Monster strikes back
          setPhase('counterattack');
          await wait(1200);

          // HIT PLAYER: Show damage to player
          setPhase('hit-player');
          setShowCounterDamage(true);
          setScreenShake(true);
          await wait(300);
          setScreenShake(false);
          await wait(2000);
          setShowCounterDamage(false);
          await wait(800);
        }

        // VICTORY: Hero victory pose
        setPhase('victory');
        setHeroPosition(0); // Return to position
        await wait(2500);
      } else {
        // MISS!
        setPhase('defeat');
        setHeroPosition(0); // Return to position
        await wait(2500);
      }

      setPhase('complete');
      if (onComplete) {
        await wait(1000);
        onComplete();
      }
    };

    sequence();
  }, [hit, damage, counterattack, onComplete]);

  const createParticles = (count: number) => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1000);
  };

  const heroState =
    phase === 'charge'
      ? 'idle'
      : phase === 'attack' || phase === 'impact'
        ? 'attack'
        : phase === 'hit-player'
          ? 'hit'
          : phase === 'victory'
            ? 'victory'
            : 'idle';

  const monsterState =
    phase === 'hit-monster' || phase === 'impact' || phase === 'monster-react'
      ? 'hit'
      : phase === 'counterattack-warn' || phase === 'counterattack'
        ? 'attack'
        : 'idle';

  return (
    <div className="relative w-full h-[500px] bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-950 rounded-lg overflow-hidden">
      {/* Flash effect on impact */}
      {flashEffect && (
        <div className="absolute inset-0 bg-white/40 z-50 animate-flash" />
      )}

      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)] animate-pulse-slow" />
      </div>

      {/* Lightning effects on charge */}
      {phase === 'charge' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-1 h-32 bg-gradient-to-b from-yellow-400 to-transparent animate-lightning" />
          <div className="absolute top-1/3 right-1/3 w-1 h-24 bg-gradient-to-b from-yellow-400 to-transparent animate-lightning animation-delay-200" />
        </div>
      )}

      {/* Combat area */}
      <div
        className={`relative h-full flex items-center justify-between px-16 transition-transform duration-200 ${
          screenShake ? 'animate-shake-intense' : ''
        }`}
      >
        {/* Hero */}
        <div
          className={`flex flex-col items-center gap-4 transition-all duration-500 ${
            phase === 'intro' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
          }`}
          style={{
            transform: `translateX(${heroPosition}px) ${phase === 'charge' ? 'scale(1.1)' : 'scale(1)'}`,
            transition: 'transform 0.5s ease-out',
          }}
        >
          {characterCustomization ? (
            <DetailedPixelCharacter
              customization={characterCustomization}
              size={240}
              animationState={heroState}
              className="drop-shadow-2xl"
            />
          ) : (
            <DetailedPixelCharacter
              customization={{
                bodyType: 'AVERAGE',
                skinColor: '#fbbf24',
                hairStyle: 'SHORT',
                hairColor: '#92400e',
                facialHair: 'NONE',
                outfit: 'ATHLETIC',
                outfitColor: '#3b82f6',
                accessoryColor: '#ffffff',
              }}
              size={240}
              animationState={heroState}
              className="drop-shadow-2xl"
            />
          )}
          <div className="text-white text-lg font-bold bg-black/70 px-4 py-2 rounded-lg border-2 border-blue-400">
            {playerName}
          </div>
          {showCounterDamage && counterattack && (
            <FloatingDamageNumber
              damage={counterattack.damage}
              isCritical={false}
              position={{ x: 25, y: 30 }}
            />
          )}
        </div>

        {/* Epic VS Text */}
        <div
          className={`text-6xl font-black text-white/40 transition-all duration-500 ${
            phase === 'ready' ? 'scale-150 text-white/60' : ''
          } ${phase === 'charge' ? 'animate-pulse-fast' : ''}`}
        >
          VS
        </div>

        {/* Monster */}
        <div
          className={`flex flex-col items-center gap-4 transition-all duration-500 ${
            phase === 'intro' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
          } ${phase === 'monster-react' ? 'animate-bounce-small' : ''}`}
        >
          <PixelCharacter
            type="monster"
            color="#ef4444"
            size={160}
            animationState={monsterState}
            className="drop-shadow-2xl"
          />
          <div className="text-white text-lg font-bold bg-black/70 px-4 py-2 rounded-lg border-2 border-red-400">
            {monsterName}
          </div>
          {showDamage && hit && (
            <FloatingDamageNumber
              damage={damage}
              isCritical={damage >= 15}
              position={{ x: 75, y: 30 }}
            />
          )}
          {showDamage && !hit && (
            <div className="absolute top-20 animate-float-up-big text-5xl font-black text-gray-400 drop-shadow-[0_0_10px_rgba(156,163,175,0.8)]">
              MISS!
            </div>
          )}
        </div>
      </div>

      {/* Particle effects */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute top-1/2 left-1/2 w-4 h-4 bg-yellow-400 rounded-full animate-particle"
          style={{
            transform: `translate(${particle.x}px, ${particle.y}px)`,
          }}
        />
      ))}

      {/* Sword Slash Effect (ATTACK / HEROIC_STRIKE) */}
      {showSwordSlash && (
        <div className="absolute top-1/2 left-1/3 w-64 h-2 bg-gradient-to-r from-transparent via-yellow-400 to-transparent transform -rotate-45 animate-slash" />
      )}

      {/* Shield Effect (DEFEND) */}
      {showShield && (
        <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 animate-shield-appear">
          <div className="text-8xl drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]">🛡️</div>
        </div>
      )}

      {/* Healing Particles (SUPPORT) */}
      {showHealParticles && (
        <>
          {[...Array(15)].map((_, i) => (
            <div
              key={`heal-${i}`}
              className="absolute top-1/2 left-1/3 w-3 h-3 bg-green-400 rounded-full animate-heal-particle"
              style={{
                animationDelay: `${i * 0.1}s`,
                left: `${30 + Math.random() * 10}%`,
              }}
            />
          ))}
        </>
      )}

      {/* Phase indicator - BIGGER */}
      <div
        className={`absolute top-8 left-1/2 -translate-x-1/2 text-white text-2xl font-black bg-black/80 px-8 py-4 rounded-xl border-4 transition-all duration-300 ${
          phase === 'impact'
            ? 'border-yellow-400 scale-125'
            : phase === 'counterattack'
              ? 'border-red-500 scale-125'
              : 'border-white/30'
        }`}
      >
        {phase === 'intro' && '🎮 BATTLE START!'}
        {phase === 'ready' && '⚔️ GET READY!'}
        {phase === 'charge' && (
          combatAction === 'HEROIC_STRIKE' ? '⚡ HEROIC STRIKE CHARGING!' :
          combatAction === 'DEFEND' ? '🛡️ DEFENSIVE STANCE!' :
          combatAction === 'SUPPORT' ? '💚 HEALING ENERGY!' :
          '⚡ CHARGING ATTACK!'
        )}
        {phase === 'attack' && (
          combatAction === 'HEROIC_STRIKE' ? '⚡ HEROIC STRIKE!' :
          combatAction === 'DEFEND' ? '🛡️ DEFENSIVE STRIKE!' :
          combatAction === 'SUPPORT' ? '💚 SUPPORT ATTACK!' :
          '💫 ATTACKING!'
        )}
        {phase === 'impact' && (
          combatAction === 'HEROIC_STRIKE' ? '💥 DEVASTATING HIT!' : '💥 CRITICAL HIT!'
        )}
        {phase === 'hit-monster' && hit && '🎯 DIRECT HIT!'}
        {phase === 'monster-react' && '😵 MONSTER STUNNED!'}
        {phase === 'counterattack-warn' && '⚠️ COUNTERATTACK INCOMING!'}
        {phase === 'counterattack' && '🔥 MONSTER STRIKES!'}
        {phase === 'hit-player' && '💔 YOU TOOK DAMAGE!'}
        {phase === 'victory' && '✨ VICTORY!'}
        {phase === 'defeat' && '❌ MISS!'}
        {phase === 'complete' && hit && '🏆 BATTLE WON!'}
        {phase === 'complete' && !hit && '😅 BETTER LUCK NEXT TIME!'}
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes shake-intense {
          0%,
          100% {
            transform: translate(0, 0) rotate(0deg);
          }
          10% {
            transform: translate(-15px, 5px) rotate(-2deg);
          }
          20% {
            transform: translate(15px, -5px) rotate(2deg);
          }
          30% {
            transform: translate(-15px, -5px) rotate(-1deg);
          }
          40% {
            transform: translate(15px, 5px) rotate(1deg);
          }
          50% {
            transform: translate(-10px, 0px) rotate(-0.5deg);
          }
          60% {
            transform: translate(10px, 0px) rotate(0.5deg);
          }
          70% {
            transform: translate(-5px, -3px) rotate(-0.3deg);
          }
          80% {
            transform: translate(5px, 3px) rotate(0.3deg);
          }
          90% {
            transform: translate(-3px, 0px) rotate(0deg);
          }
        }
        @keyframes float-up-big {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.5);
          }
          50% {
            transform: translateY(-40px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-120px) scale(1);
          }
        }
        @keyframes flash {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes pulse-fast {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }
        @keyframes pulse-slow {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        @keyframes bounce-small {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes lightning {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes particle {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx, 0), var(--ty, 0)) scale(0);
          }
        }
        @keyframes slash {
          0% {
            opacity: 0;
            transform: translateX(-100px) rotate(-45deg) scaleX(0);
          }
          50% {
            opacity: 1;
            transform: translateX(0) rotate(-45deg) scaleX(1);
          }
          100% {
            opacity: 0;
            transform: translateX(100px) rotate(-45deg) scaleX(0.5);
          }
        }
        @keyframes shield-appear {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes heal-particle {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-80px) scale(0);
          }
        }
        .animate-shake-intense {
          animation: shake-intense 0.4s ease-in-out;
        }
        .animate-float-up-big {
          animation: float-up-big 2s ease-out forwards;
        }
        .animate-flash {
          animation: flash 0.2s ease-in-out;
        }
        .animate-pulse-fast {
          animation: pulse-fast 0.5s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .animate-bounce-small {
          animation: bounce-small 0.6s ease-in-out;
        }
        .animate-lightning {
          animation: lightning 0.1s ease-in-out infinite;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animate-particle {
          animation: particle 1s ease-out forwards;
        }
        .animate-slash {
          animation: slash 0.6s ease-out forwards;
        }
        .animate-shield-appear {
          animation: shield-appear 0.6s ease-out forwards;
        }
        .animate-heal-particle {
          animation: heal-particle 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
