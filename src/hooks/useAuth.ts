import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  user_id: string;
  whop_id: string | null;
  tier: "free" | "basic" | "elite" | "blackout" | "lifetime";
  device_fingerprint: string | null;
  daily_cis_used: number;
  daily_sidebet_used: number;
  total_cis_runs: number;
  xp: number;
  rank: string;
  last_reset_date: string;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const getUsageLimits = () => {
    if (!profile) return { daily_cis: 5, daily_sidebet: 1 };
    
    switch (profile.tier) {
      case "lifetime":
      case "blackout":
        return { daily_cis: -1, daily_sidebet: -1 };
      case "elite":
        return { daily_cis: -1, daily_sidebet: -1 };
      case "basic":
        return { daily_cis: -1, daily_sidebet: 5 };
      default:
        return { daily_cis: 5, daily_sidebet: 1 };
    }
  };

  const canUseCIS = () => {
    if (!profile) return false;
    const limits = getUsageLimits();
    return limits.daily_cis === -1 || profile.daily_cis_used < limits.daily_cis;
  };

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    getUsageLimits,
    canUseCIS,
    refetchProfile: () => user && fetchProfile(user.id),
  };
};