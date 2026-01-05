"use client";

import { useAuth } from "@/components/AuthProvider";
import { AuthModal } from "@/components/AuthModal";
import { useState } from "react";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-accent/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">HIIT Timer</h1>
            <p className="text-muted-foreground">
              High-intensity interval training timer with customizable workouts
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm text-muted-foreground">Private Beta</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sign in to access the timer and save your custom workouts.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-3 px-6 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-all"
            >
              Sign In to Continue
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            This app is currently in private testing.
          </p>
        </div>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return <>{children}</>;
}
