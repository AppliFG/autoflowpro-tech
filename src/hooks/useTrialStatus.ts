import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TrialStatus {
  loading: boolean;
  isTrialActive: boolean;
  daysRemaining: number;
  installDate: Date | null;
  hasSubscription: boolean;
}

export function useTrialStatus(): TrialStatus {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [installDate, setInstallDate] = useState<Date | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        // Check install date
        const { data: installData } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "install_date")
          .maybeSingle();

        if (installData?.value) {
          setInstallDate(new Date(installData.value));
        }

        // Check subscription status
        const { data: subData } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "subscription_active")
          .maybeSingle();

        setHasSubscription(subData?.value === "true");
      } catch {
        // Default: trial active
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  const now = new Date();
  const daysElapsed = installDate
    ? Math.floor((now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const daysRemaining = Math.max(0, 30 - daysElapsed);
  const isTrialActive = hasSubscription || !installDate || daysRemaining > 0;

  return { loading, isTrialActive, daysRemaining, installDate, hasSubscription };
}
