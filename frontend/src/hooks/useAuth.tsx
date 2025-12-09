"use client";

import { useEffect, useState, useContext } from "react";
import { User } from "firebase/auth";
import { AuthContext } from "@/components/auth/AuthInitializer";

import { UserProfile } from "@/lib/api-client";

export function useAuth() {
  // Use global context to avoid re-initializing auth state and "flicker"
  const { user: contextUser, loading: contextLoading } =
    useContext(AuthContext);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (contextUser) {
        setProfileLoading(true);
        try {
          const { fetchCurrentUser } = await import("@/lib/api-client");
          const userProfile = await fetchCurrentUser();
          console.log("[useAuth] Fetched Profile:", userProfile);
          setProfile(userProfile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile(null);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfile(null);
      }
    }

    if (!contextLoading) {
      loadProfile();
    }
  }, [contextUser, contextLoading]);

  const isAdmin = profile?.role === "ADMIN";
  const isManager = profile?.role === "MANAGER" || isAdmin;

  return {
    user: contextUser,
    profile,
    loading: contextLoading || profileLoading,
    isAdmin,
    isManager,
  };
}
