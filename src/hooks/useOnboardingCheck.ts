import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useOnboardingCheck() {
  const { session, loading: authLoading, role, roleLoading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading || roleLoading || !session) {
      setChecking(false);
      return;
    }

    // Only admins trigger onboarding
    if (role !== "admin") {
      setNeedsOnboarding(false);
      setChecking(false);
      return;
    }

    (async () => {
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "onboarding_completed")
          .maybeSingle();

        setNeedsOnboarding(!data || data.value !== "true");
      } catch {
        setNeedsOnboarding(true);
      } finally {
        setChecking(false);
      }
    })();
  }, [session, authLoading, role, roleLoading]);

  const markComplete = () => setNeedsOnboarding(false);

  return { needsOnboarding, checking, markComplete };
}
