import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { ToastProvider } from "@/lib/context/ToastContext";
import DatabaseStatusChecker from "@/components/DatabaseStatusChecker";
import FloatingPartyWidget from "@/components/party/FloatingPartyWidget";

export const metadata: Metadata = {
  title: "Fitness Quest",
  description: "Collaborative fitness accountability with D&D-inspired mechanics",
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>
            <DatabaseStatusChecker>
              {children}
              <FloatingPartyWidget />
            </DatabaseStatusChecker>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
