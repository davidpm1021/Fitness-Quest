"use client";

import { useEffect, useState } from "react";
import PixelPanel from "./ui/PixelPanel";
import PixelButton from "./ui/PixelButton";

interface DatabaseStatus {
  isChecking: boolean;
  isHealthy: boolean;
  isWakingUp: boolean;
  retryCount: number;
  error?: string;
}

const MAX_RETRIES = 10; // Maximum 10 retries (10 minutes with 1-minute intervals)
const RETRY_INTERVAL = 60000; // 60 seconds in milliseconds

export default function DatabaseStatusChecker({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<DatabaseStatus>({
    isChecking: true,
    isHealthy: false,
    isWakingUp: false,
    retryCount: 0,
  });

  const checkDatabaseHealth = async () => {
    try {
      const response = await fetch("/api/health", {
        method: "GET",
        cache: "no-store",
      });

      if (response.ok) {
        // Database is healthy
        setStatus({
          isChecking: false,
          isHealthy: true,
          isWakingUp: false,
          retryCount: 0,
        });
      } else {
        // Database is down or waking up
        setStatus((prev) => ({
          isChecking: false,
          isHealthy: false,
          isWakingUp: true,
          retryCount: prev.retryCount,
          error: `Database is waking up (Status: ${response.status})`,
        }));
      }
    } catch (error) {
      // Network or connection error
      setStatus((prev) => ({
        isChecking: false,
        isHealthy: false,
        isWakingUp: true,
        retryCount: prev.retryCount,
        error: "Unable to connect to the database",
      }));
    }
  };

  const retryConnection = () => {
    setStatus((prev) => ({
      ...prev,
      isChecking: true,
      retryCount: prev.retryCount + 1,
    }));
  };

  // Initial health check on mount
  useEffect(() => {
    checkDatabaseHealth();
  }, []);

  // Auto-retry logic when database is waking up
  useEffect(() => {
    if (status.isWakingUp && status.retryCount < MAX_RETRIES) {
      const timer = setTimeout(() => {
        retryConnection();
      }, RETRY_INTERVAL);

      return () => clearTimeout(timer);
    }
  }, [status.isWakingUp, status.retryCount]);

  // Re-check when retry count increases
  useEffect(() => {
    if (status.isChecking && status.retryCount > 0) {
      checkDatabaseHealth();
    }
  }, [status.retryCount, status.isChecking]);

  // If database is healthy, render the app
  if (status.isHealthy) {
    return <>{children}</>;
  }

  // If checking for the first time, show simple loading
  if (status.isChecking && status.retryCount === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <PixelPanel title="Loading..." variant="default">
          <div className="text-center py-8">
            <p className="font-pixel text-lg text-gray-300 mb-4">
              Connecting to Fitness Quest...
            </p>
            <div className="animate-pulse text-blue-400 text-4xl">⚔️</div>
          </div>
        </PixelPanel>
      </div>
    );
  }

  // Database is waking up - show retry UI
  const nextRetrySeconds = RETRY_INTERVAL / 1000;
  const hasReachedMaxRetries = status.retryCount >= MAX_RETRIES;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full">
        <PixelPanel title="⏳ Database Waking Up" variant="warning">
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">☕</div>
              <p className="font-pixel text-lg text-yellow-300 mb-2">
                The database is waking up from sleep mode
              </p>
              <p className="font-retro text-sm text-gray-400">
                This happens on the free tier after 5 minutes of inactivity.
                {!hasReachedMaxRetries && " It usually takes 30-60 seconds."}
              </p>
            </div>

            <div className="bg-gray-800 p-4 rounded border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-retro text-sm text-gray-400">Status:</span>
                {status.isChecking ? (
                  <span className="font-pixel text-sm text-blue-400 animate-pulse">
                    Checking...
                  </span>
                ) : (
                  <span className="font-pixel text-sm text-yellow-400">
                    Waiting
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-retro text-sm text-gray-400">
                  Retry Attempts:
                </span>
                <span className="font-pixel text-sm text-white">
                  {status.retryCount} / {MAX_RETRIES}
                </span>
              </div>
            </div>

            {!hasReachedMaxRetries && (
              <div className="text-center">
                <p className="font-retro text-xs text-gray-500 mb-3">
                  {status.isChecking
                    ? "Checking connection..."
                    : `Next automatic retry in ${nextRetrySeconds} seconds`}
                </p>
                <PixelButton
                  onClick={() => {
                    setStatus((prev) => ({ ...prev, isChecking: true }));
                    checkDatabaseHealth();
                  }}
                  variant="secondary"
                  disabled={status.isChecking}
                >
                  {status.isChecking ? "Checking..." : "Retry Now"}
                </PixelButton>
              </div>
            )}

            {hasReachedMaxRetries && (
              <div className="text-center">
                <div className="p-4 bg-red-900/30 border-2 border-red-500 rounded-lg">
                  <h3 className="font-pixel text-lg text-red-300 mb-4">
                    ⚠️ Connection Timeout
                  </h3>
                  <p className="font-retro text-sm text-red-300 mb-4">
                    Unable to connect after {MAX_RETRIES} attempts. The database
                    may be experiencing issues.
                  </p>
                  <PixelButton
                    onClick={() => {
                      setStatus({
                        isChecking: true,
                        isHealthy: false,
                        isWakingUp: false,
                        retryCount: 0,
                      });
                    }}
                    variant="primary"
                  >
                    Start Over
                  </PixelButton>
                </div>
              </div>
            )}

            {status.error && (
              <div className="text-center">
                <p className="font-retro text-xs text-gray-500 italic">
                  {status.error}
                </p>
              </div>
            )}
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
