"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import PageLayout from "@/components/layout/PageLayout";
import PixelButton from "@/components/ui/PixelButton";
import PixelPanel from "@/components/ui/PixelPanel";
import PixelInput from "@/components/ui/PixelInput";
import PixelBadge from "@/components/ui/PixelBadge";

interface UserSettings {
  email: string;
  username: string;
  displayName: string;
  timezone: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, token, refreshUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    email: "",
    username: "",
    displayName: "",
    timezone: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      setSettings({
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        timezone: user.timezone || "UTC",
      });
      setLoading(false);
    }
  }, [user]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Settings saved successfully!");
        // Refresh user data in context
        await refreshUser();
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/user/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordSection(false);
      } else {
        toast.error(data.error || "Failed to change password");
      }
    } catch (err) {
      toast.error("Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center game-bg pixel-grid-bg">
        <p className="text-white font-retro text-xl">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PageLayout title="⚙️ ACCOUNT SETTINGS" showBackButton={true}>
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Account Information */}
          <PixelPanel variant="dialog" title="👤 ACCOUNT INFORMATION">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <PixelInput
                label="EMAIL ADDRESS"
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings({ ...settings, email: e.target.value })
                }
                helperText="Used for login and notifications"
                required
              />

              <PixelInput
                label="USERNAME"
                type="text"
                value={settings.username}
                onChange={(e) =>
                  setSettings({ ...settings, username: e.target.value })
                }
                helperText="Your unique identifier"
                required
              />

              <PixelInput
                label="DISPLAY NAME"
                type="text"
                value={settings.displayName}
                onChange={(e) =>
                  setSettings({ ...settings, displayName: e.target.value })
                }
                helperText="How your name appears to other party members"
                required
              />

              <div>
                <label className="block font-bold text-sm uppercase tracking-wider mb-2 text-white">
                  TIMEZONE
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) =>
                    setSettings({ ...settings, timezone: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-4 border-gray-800 dark:border-gray-600 rounded-sm font-retro text-lg text-gray-900 dark:text-white shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="America/Phoenix">Arizona</option>
                  <option value="America/Anchorage">Alaska</option>
                  <option value="Pacific/Honolulu">Hawaii</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Europe/Berlin">Berlin</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Shanghai">Shanghai</option>
                  <option value="Australia/Sydney">Sydney</option>
                </select>
                <p className="mt-2 font-retro text-sm text-blue-200">
                  Used for check-in windows and morning reports
                </p>
              </div>

              <PixelButton
                type="submit"
                disabled={saving}
                variant="success"
                size="lg"
                className="w-full"
              >
                {saving ? "⏳ SAVING..." : "💾 SAVE CHANGES"}
              </PixelButton>
            </form>
          </PixelPanel>

          {/* Password Section */}
          <PixelPanel variant="dialog" title="🔒 PASSWORD">
            {!showPasswordSection ? (
              <div className="text-center py-6">
                <p className="font-retro text-lg text-gray-300 mb-6">
                  Keep your account secure with a strong password
                </p>
                <PixelButton
                  onClick={() => setShowPasswordSection(true)}
                  variant="warning"
                  size="lg"
                >
                  🔑 CHANGE PASSWORD
                </PixelButton>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <PixelInput
                  label="CURRENT PASSWORD"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  required
                />

                <PixelInput
                  label="NEW PASSWORD"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  helperText="At least 8 characters"
                  required
                />

                <PixelInput
                  label="CONFIRM NEW PASSWORD"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />

                <div className="flex gap-4">
                  <PixelButton
                    type="button"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                    }}
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                  >
                    ✖ CANCEL
                  </PixelButton>
                  <PixelButton
                    type="submit"
                    disabled={saving}
                    variant="success"
                    size="lg"
                    className="flex-1"
                  >
                    {saving ? "⏳ CHANGING..." : "✓ CHANGE PASSWORD"}
                  </PixelButton>
                </div>
              </form>
            )}
          </PixelPanel>

          {/* Danger Zone */}
          <PixelPanel variant="menu">
            <div className="border-4 border-red-600 rounded-lg p-6 bg-red-900/20">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-pixel text-xl text-red-400">
                      ⚠️ DANGER ZONE
                    </h3>
                    <PixelBadge variant="danger" size="sm">
                      PERMANENT
                    </PixelBadge>
                  </div>
                  <p className="font-retro text-gray-300">
                    Delete your account and all associated data
                  </p>
                </div>
                <PixelButton
                  onClick={() => router.push("/settings/delete-account")}
                  variant="danger"
                  size="lg"
                >
                  🗑️ DELETE ACCOUNT
                </PixelButton>
              </div>
            </div>
          </PixelPanel>
        </div>
      </main>
    </PageLayout>
  );
}
