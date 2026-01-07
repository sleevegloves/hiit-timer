"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getProfile, createProfile, updateProfile, isUsernameAvailable } from "@/lib/profiles";
import { Profile } from "@/lib/database.types";

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (profile: Profile) => void;
}

export function ProfileSetupModal({ isOpen, onClose, onProfileUpdated }: ProfileSetupModalProps) {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingProfile, setExistingProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (isOpen && user?.id) {
      // Load existing profile if any
      getProfile(user.id).then((profile) => {
        if (profile) {
          setExistingProfile(profile);
          setUsername(profile.username || "");
          setDisplayName(profile.display_name || "");
          setBio(profile.bio || "");
        }
      });
    }
  }, [isOpen, user?.id]);

  // Debounced username availability check
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    // Skip check if username hasn't changed from existing
    if (existingProfile?.username === username.toLowerCase()) {
      setUsernameAvailable(true);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      const available = await isUsernameAvailable(username);
      setUsernameAvailable(available);
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, existingProfile?.username]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }

    if (usernameAvailable === false) {
      setError("Username is already taken");
      return;
    }

    setLoading(true);
    setError(null);

    let result: Profile | null;
    if (existingProfile) {
      result = await updateProfile(user.id, {
        username,
        display_name: displayName || username,
        bio: bio || undefined,
      });
    } else {
      result = await createProfile(user.id, username, displayName || username);
      if (result && bio) {
        result = await updateProfile(user.id, { bio });
      }
    }

    if (result) {
      onProfileUpdated?.(result);
      onClose();
    } else {
      setError("Failed to save profile. Username may be taken.");
    }

    setLoading(false);
  };

  const isEditing = !!existingProfile?.username;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-background border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isEditing ? "Edit Profile" : "Set Up Your Profile"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditing ? "Update your public profile" : "Choose a username to join the community"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                required
                minLength={3}
                maxLength={30}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-card border-2 border-border text-foreground focus:outline-none focus:border-accent transition-colors"
                placeholder="username"
              />
              {username.length >= 3 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingUsername ? (
                    <svg className="w-5 h-5 text-muted-foreground animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : usernameAvailable ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : usernameAvailable === false ? (
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : null}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Letters, numbers, and underscores only
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Display Name <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-xl bg-card border-2 border-border text-foreground focus:outline-none focus:border-accent transition-colors"
              placeholder="Your Name"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Bio <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-card border-2 border-border text-foreground focus:outline-none focus:border-accent transition-colors resize-none"
              placeholder="Tell others about yourself..."
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
            >
              {isEditing ? "Cancel" : "Skip for now"}
            </button>
            <button
              type="submit"
              disabled={loading || (username.length >= 3 && usernameAvailable === false)}
              className="flex-1 py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

