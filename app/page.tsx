import Link from "next/link";
import PixelButton from "@/components/ui/PixelButton";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelBadge from "@/components/ui/PixelBadge";
import HPBar from "@/components/ui/HPBar";

export default function Home() {
  return (
    <main className="min-h-screen game-bg pixel-grid-bg">
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: i % 5 === 0 ? '3px' : '2px',
              height: i % 5 === 0 ? '3px' : '2px',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* Title with retro effect */}
        <div className="text-center mb-12">
          <h1 className="font-pixel text-5xl md:text-7xl text-white mb-4 drop-shadow-[0_0_30px_rgba(59,130,246,1)] [text-shadow:4px_4px_0_rgba(0,0,0,0.5)]">
            FITNESS
            <br />
            <span className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,1)] animate-pixel-pulse">
              QUEST
            </span>
          </h1>
          <div className="flex justify-center gap-2 mt-4">
            <PixelBadge variant="info" size="sm">
              RPG
            </PixelBadge>
            <PixelBadge variant="success" size="sm">
              CO-OP
            </PixelBadge>
            <PixelBadge variant="warning" size="sm">
              FITNESS
            </PixelBadge>
          </div>
        </div>

        {/* Main panel */}
        <PixelPanel variant="dialog" className="max-w-4xl w-full mb-8">
          <div className="text-center text-white">
            <p className="font-retro text-2xl mb-6 leading-relaxed">
              TEAM UP WITH FRIENDS TO DEFEAT MONSTERS
              <br />
              BY CRUSHING YOUR FITNESS GOALS
            </p>

            {/* Features showcase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
              <div className="bg-blue-800/50 p-4 rounded border-2 border-blue-400">
                <div className="text-4xl mb-2">⚔️</div>
                <div className="font-bold text-lg mb-1">D&D Combat</div>
                <div className="text-sm text-blue-200">
                  Roll dice, deal damage, defeat monsters together
                </div>
              </div>
              <div className="bg-green-800/50 p-4 rounded border-2 border-green-400">
                <div className="text-4xl mb-2">❤️</div>
                <div className="font-bold text-lg mb-1">Support Team</div>
                <div className="text-sm text-green-200">
                  Heal friends, send encouragement, build defense
                </div>
              </div>
              <div className="bg-purple-800/50 p-4 rounded border-2 border-purple-400">
                <div className="text-4xl mb-2">🎯</div>
                <div className="font-bold text-lg mb-1">Your Goals</div>
                <div className="text-sm text-purple-200">
                  Track weight, cardio, strength, sleep & more
                </div>
              </div>
            </div>

            {/* Demo HP Bar */}
            <div className="my-6 max-w-md mx-auto">
              <HPBar current={75} max={100} size="md" label="PARTY HP" />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link href="/register">
                <PixelButton variant="warning" size="lg">
                  ▶ START QUEST
                </PixelButton>
              </Link>
              <Link href="/login">
                <PixelButton variant="primary" size="lg">
                  ↩ CONTINUE
                </PixelButton>
              </Link>
            </div>
          </div>
        </PixelPanel>


        {/* Footer */}
        <div className="mt-8 text-center text-white/80 font-retro text-lg">
          <p className="drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
            COLLABORATIVE FITNESS • NO COMPETITION • JUST SUPPORT
          </p>
        </div>
      </div>
    </main>
  );
}
