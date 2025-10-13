'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import PixelButton from '@/components/ui/PixelButton';
import PixelInput from '@/components/ui/PixelInput';

export default function PartyOnboardingPage() {
  const router = useRouter();
  const { user, isLoading, token, refreshUser } = useAuth();
  const [choice, setChoice] = useState<'create' | 'join' | null>(null);
  const [partyName, setPartyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  async function handleCreateParty() {
    if (!partyName.trim()) {
      setError('Please enter a party name');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/parties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: partyName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create party');
      }

      await completeOnboarding();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create party');
      setSaving(false);
    }
  }

  async function handleJoinParty() {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/parties/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inviteCode: inviteCode.trim().toUpperCase(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join party');
      }

      await completeOnboarding();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join party');
      setSaving(false);
    }
  }

  async function completeOnboarding() {
    try {
      // Mark onboarding as complete
      await fetch('/api/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          onboardingStep: 'complete',
          onboardingCompletedAt: true,
        }),
      });

      // Refresh user context
      await refreshUser();

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to complete onboarding');
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center game-bg">
        <p className="text-white font-retro">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen game-bg pixel-grid-bg py-12 px-4">
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
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
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <OnboardingProgress currentStep="party" />

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3 font-pixel">
            👥 CREATE YOUR PARTY
          </h1>
          <p className="text-xl text-gray-300 font-retro mb-2">
            Start your adventure solo or invite friends to join you
          </p>
          <p className="text-md text-gray-400 font-retro">
            You can always invite teammates later with your unique party code
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/50 border-4 border-red-500 rounded-lg p-4">
            <p className="text-red-200 font-bold text-center">⚠️ {error}</p>
          </div>
        )}

        {!choice && (
          <div className="space-y-4 mb-8">
            {/* Create Party Option */}
            <button
              onClick={() => setChoice('create')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-4 border-purple-400 rounded-lg p-6 transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-3xl mb-2">🎪</div>
                  <h3 className="text-xl font-bold text-white font-pixel mb-1">
                    CREATE A NEW PARTY
                  </h3>
                  <p className="text-purple-100 font-retro text-sm">
                    Start solo or with friends - you&apos;ll get an invite code to share anytime
                  </p>
                </div>
                <div className="text-4xl text-white">→</div>
              </div>
            </button>

            {/* Join Party Option */}
            <button
              onClick={() => setChoice('join')}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 border-4 border-green-400 rounded-lg p-6 transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-3xl mb-2">🤝</div>
                  <h3 className="text-xl font-bold text-white font-pixel mb-1">
                    JOIN AN EXISTING PARTY
                  </h3>
                  <p className="text-green-100 font-retro text-sm">
                    Have an invite code? Join your friends&apos; adventure
                  </p>
                </div>
                <div className="text-4xl text-white">→</div>
              </div>
            </button>
          </div>
        )}

        {choice === 'create' && (
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border-4 border-purple-500/50 p-8 mb-8 animate-fade-in">
            <button
              onClick={() => setChoice(null)}
              className="mb-4 text-gray-400 hover:text-white font-retro text-sm"
            >
              ← Back to options
            </button>

            <h2 className="text-2xl font-bold text-white mb-4 font-pixel">
              CREATE YOUR PARTY
            </h2>

            <div className="space-y-4">
              <PixelInput
                label="PARTY NAME"
                id="partyName"
                name="partyName"
                type="text"
                required
                placeholder="e.g., The Fit Squad, Morning Warriors"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                helperText="Choose a name your friends will recognize"
                className="bg-gray-800 text-white"
              />

              <div className="p-4 bg-purple-900/30 border-2 border-purple-500/50 rounded-lg">
                <p className="text-purple-200 font-retro text-sm">
                  💡 <strong>Playing Solo?</strong> No problem! You&apos;ll start your adventure alone and receive an
                  invite code to share with friends anytime you want teammates.
                </p>
              </div>

              <PixelButton
                onClick={handleCreateParty}
                disabled={saving || !partyName.trim()}
                variant="success"
                size="lg"
                className="w-full"
              >
                {saving ? '⏳ CREATING...' : '✨ CREATE PARTY'}
              </PixelButton>
            </div>
          </div>
        )}

        {choice === 'join' && (
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border-4 border-green-500/50 p-8 mb-8 animate-fade-in">
            <button
              onClick={() => setChoice(null)}
              className="mb-4 text-gray-400 hover:text-white font-retro text-sm"
            >
              ← Back to options
            </button>

            <h2 className="text-2xl font-bold text-white mb-4 font-pixel">
              JOIN A PARTY
            </h2>

            <div className="space-y-4">
              <PixelInput
                label="INVITE CODE"
                id="inviteCode"
                name="inviteCode"
                type="text"
                required
                placeholder="e.g., ABC123"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                helperText="Enter the 6-character code your friend shared"
                className="bg-gray-800 text-white"
              />

              <div className="p-4 bg-green-900/30 border-2 border-green-500/50 rounded-lg">
                <p className="text-green-200 font-retro text-sm">
                  💡 <strong>Tip:</strong> Ask your friend for their party&apos;s invite code. It should
                  be 6 characters long.
                </p>
              </div>

              <PixelButton
                onClick={handleJoinParty}
                disabled={saving || !inviteCode.trim()}
                variant="success"
                size="lg"
                className="w-full"
              >
                {saving ? '⏳ JOINING...' : '🤝 JOIN PARTY'}
              </PixelButton>
            </div>
          </div>
        )}

        {!choice && (
          <div className="flex justify-between items-center mt-8">
            <PixelButton
              onClick={() => router.push('/onboarding/goals')}
              variant="secondary"
              size="md"
              disabled={saving}
            >
              ← BACK
            </PixelButton>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
