"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile } from "@/actions/user";

interface UserProfileData {
  name: string | null;
  email: string;
  image: string | null;
}

interface UserProfileContextType {
  profile: UserProfileData | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined
);

export function UserProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, status } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastFetchedUserId = useRef<string | null>(null);

  const fetchProfile = useCallback(async () => {
    // If explicitly unauthenticated, clear profile
    if (status === "unauthenticated") {
      setProfile(null);
      setIsLoading(false);
      lastFetchedUserId.current = null;
      return;
    }

    // Skip if already fetched for this user (prevents double fetch when auth status updates)
    if (user?.id && lastFetchedUserId.current === user.id) {
      setIsLoading(false);
      return;
    }

    // Fetch immediately even if status is "loading" (Parallel Fetching)

    try {
      const result = await getUserProfile();
      if (result.user) {
        setProfile({
          name: result.user.name,
          email: result.user.email,
          image: result.user.image,
        });
        lastFetchedUserId.current = result.user.id || user?.id || "fetched";
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, status]);

  // Fetch profile on mount and when session changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    await fetchProfile();
  }, [fetchProfile]);

  const value = useMemo(
    () => ({ profile, isLoading, refreshProfile }),
    [profile, isLoading, refreshProfile]
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
