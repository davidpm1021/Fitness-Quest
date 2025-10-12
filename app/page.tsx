import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
          Fitness Quest
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Collaborative fitness accountability with D&D-inspired mechanics
        </p>

        <div className="flex gap-4 justify-center mb-8">
          <Link
            href="/register"
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
          >
            Log In
          </Link>
        </div>

        <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Development Progress
          </h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>✅ Sprint 0: Foundation & Setup</p>
            <p>✅ Sprint 1: User Management</p>
            <p>✅ Sprint 2: Goals & Parties</p>
            <p className="text-gray-500 dark:text-gray-500">⏳ Sprint 3: Combat Core (Next)</p>
          </div>
        </div>
      </div>
    </main>
  );
}
