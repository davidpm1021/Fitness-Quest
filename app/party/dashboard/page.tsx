"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import PageLayout from "@/components/layout/PageLayout";
import PixelButton from "@/components/ui/PixelButton";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelBadge from "@/components/ui/PixelBadge";
import HPBar from "@/components/ui/HPBar";
import ChatPanel from "@/components/party/ChatPanel";

interface PartyMember {
  id: string;
  currentHp: number;
  maxHp: number;
  currentDefense: number;
  currentStreak: number;
  level: number;
  xp: number;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
}

interface Party {
  id: string;
  name: string;
  inviteCode: string;
  members: PartyMember[];
  activeMonster: any;
}

export default function PartyDashboard() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const toast = useToast();
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteCode, setShowInviteCode] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && token) {
      fetchParty();
    }
  }, [user, token]);

  async function fetchParty() {
    try {
      const response = await fetch("/api/parties/my-party", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data.party) {
        setParty(data.data.party);
      } else {
        // No party, redirect to party setup
        router.push("/party");
      }
    } catch (err) {
      console.error("Error fetching party:", err);
    } finally {
      setLoading(false);
    }
  }

  function copyInviteCode() {
    if (party) {
      navigator.clipboard.writeText(party.inviteCode);
      toast.success("Invite code copied to clipboard!");
    }
  }

  function getHpPercentage(currentHp: number, maxHp: number): number {
    return (currentHp / maxHp) * 100;
  }

  function getHpColor(percentage: number): string {
    if (percentage > 66) return "bg-green-500";
    if (percentage > 33) return "bg-yellow-500";
    return "bg-red-500";
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center game-bg pixel-grid-bg">
        <p className="text-white font-retro text-xl">Loading...</p>
      </div>
    );
  }

  if (!user || !party) {
    return null;
  }

  return (
    <PageLayout title="🏰 PARTY DASHBOARD" showBackButton={true}>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Party Header */}
          <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="font-pixel text-4xl text-white drop-shadow-[3px_3px_0_rgba(0,0,0,0.5)]">
                🏰 {party.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <PixelBadge variant="info" size="md">
                  {party.members.length} MEMBER{party.members.length !== 1 ? "S" : ""}
                </PixelBadge>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <PixelButton
                onClick={() => router.push("/check-in")}
                variant="success"
                size="lg"
              >
                ⚔️ DAILY CHECK-IN
              </PixelButton>
              <PixelButton
                onClick={() => setShowInviteCode(!showInviteCode)}
                variant="primary"
                size="md"
              >
                {showInviteCode ? "🔒 HIDE CODE" : "📋 INVITE CODE"}
              </PixelButton>
            </div>
          </div>

          {showInviteCode && (
            <PixelPanel variant="dialog" className="mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="font-retro text-lg text-blue-200 mb-2">
                    Share this code with friends:
                  </p>
                  <code className="font-pixel text-3xl text-yellow-400 tracking-wider bg-gray-800 px-6 py-3 border-4 border-yellow-600 rounded-sm inline-block">
                    {party.inviteCode}
                  </code>
                </div>
                <PixelButton
                  onClick={copyInviteCode}
                  variant="warning"
                  size="md"
                >
                  📋 COPY CODE
                </PixelButton>
              </div>
            </PixelPanel>
          )}

          {/* Active Monster Section */}
          <div className="mb-8">
            <PixelPanel variant="menu" title="👹 ACTIVE MONSTER">
              {party.activeMonster ? (
                <div>
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-3">👹</div>
                    <h3 className="font-pixel text-2xl text-white mb-2">
                      {party.activeMonster.name}
                    </h3>
                    <p className="font-retro text-lg text-gray-300 max-w-2xl mx-auto">
                      {party.activeMonster.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <HPBar
                      current={party.activeMonster.currentHp}
                      max={party.activeMonster.maxHp}
                      size="lg"
                      label="MONSTER HP"
                      showMilestones={true}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-purple-800/50 border-4 border-purple-500 rounded-lg p-4 text-center">
                      <p className="font-retro text-sm text-purple-200 mb-1">
                        Type
                      </p>
                      <p className="font-pixel text-xl text-white">
                        {party.activeMonster.monsterType}
                      </p>
                    </div>
                    <div className="bg-blue-800/50 border-4 border-blue-500 rounded-lg p-4 text-center">
                      <p className="font-retro text-sm text-blue-200 mb-1">
                        Armor Class
                      </p>
                      <p className="font-pixel text-xl text-white">
                        {party.activeMonster.armorClass}
                      </p>
                    </div>
                    <div className="bg-red-800/50 border-4 border-red-500 rounded-lg p-4 text-center">
                      <p className="font-retro text-sm text-red-200 mb-1">
                        Counterattack
                      </p>
                      <p className="font-pixel text-xl text-white">
                        {party.activeMonster.counterattackChance}%
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">❓</div>
                  <p className="font-retro text-xl text-gray-300 mb-6">
                    No active monster
                  </p>
                  <PixelButton
                    onClick={() => router.push("/monsters")}
                    variant="primary"
                    size="lg"
                  >
                    ⚔️ SELECT A MONSTER
                  </PixelButton>
                </div>
              )}
            </PixelPanel>
          </div>

          {/* Party Members and Chat Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Party Members */}
            <div className="lg:col-span-2">
              <h3 className="font-pixel text-2xl text-white mb-6 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                ⚔️ PARTY MEMBERS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {party.members.map((member) => (
                  <PixelPanel key={member.id} variant="menu">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-600 border-4 border-blue-800 rounded-sm flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,0.4)]">
                        <span className="font-pixel text-lg text-white">
                          {member.user.displayName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-pixel text-sm text-white">
                            {member.user.displayName}
                          </h4>
                          <PixelBadge variant="success" size="sm">
                            LVL {member.level || 1}
                          </PixelBadge>
                        </div>
                        <p className="font-retro text-sm text-gray-400">
                          @{member.user.username}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <HPBar
                        current={member.currentHp}
                        max={member.maxHp}
                        size="sm"
                        label="HP"
                      />

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t-4 border-gray-700">
                        <div className="text-center">
                          <p className="font-retro text-xs text-gray-400 mb-1">
                            Defense
                          </p>
                          <p className="font-pixel text-lg text-blue-400">
                            +{member.currentDefense}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="font-retro text-xs text-gray-400 mb-1">
                            Streak
                          </p>
                          <p className="font-pixel text-lg text-orange-400">
                            {member.currentStreak}🔥
                          </p>
                        </div>
                      </div>
                    </div>
                  </PixelPanel>
                ))}
              </div>
            </div>

            {/* Chat Panel */}
            <div className="lg:col-span-1">
              <ChatPanel partyId={party.id} />
            </div>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}
