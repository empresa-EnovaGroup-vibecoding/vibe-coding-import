import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Hook to manage premium feature gating with membership modal.
 * Checks the user's subscription_status from their profile.
 */
export function usePremiumGate() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscriptionStatus(null);
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_status, trial_ends_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        const row = data as unknown as { subscription_status: string; trial_ends_at: string };
        const status = row.subscription_status;
        const trialEnds = new Date(row.trial_ends_at);
        if (status === "active") {
          setSubscriptionStatus("active");
        } else if (status === "trial" && trialEnds > new Date()) {
          setSubscriptionStatus("trial");
        } else {
          setSubscriptionStatus("expired");
        }
      }
      setLoading(false);
    };

    fetchStatus();

    // Listen for realtime changes to re-check status
    const channel = supabase
      .channel("profile-subscription")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        () => { fetchStatus(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  const hasPremium = subscriptionStatus === "active" || subscriptionStatus === "trial";

  const checkPremiumAccess = useCallback((): boolean => {
    if (hasPremium) return true;
    openModal();
    return false;
  }, [hasPremium, openModal]);

  return {
    showModal,
    openModal,
    closeModal,
    checkPremiumAccess,
    hasPremium,
    subscriptionStatus,
    loading,
  };
}
