import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ConnecteurConfig,
  ConnecteurCredentials,
  CONNECTEURS_DISPONIBLES,
} from "@/types/connecteurs";

interface ConnecteurRow {
  connecteur_id: string;
  credentials: Record<string, any>;
  actif: boolean;
}

const QUERY_KEY = "connecteurs-config";

export function useConnecteurs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch from connecteurs_config
  const { data: dbRows, isLoading } = useQuery({
    queryKey: [QUERY_KEY, user?.id],
    queryFn: async (): Promise<ConnecteurRow[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("connecteurs_config" as any)
        .select("connecteur_id, credentials, actif")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!user,
  });

  // Merge DB rows with defaults
  const connecteurs: ConnecteurConfig[] = CONNECTEURS_DISPONIBLES.map((def) => {
    const row = dbRows?.find((r) => r.connecteur_id === def.id);
    if (!row) return { ...def, actif: false, connecte: false, credentials: {} };
    const creds = (row.credentials || {}) as ConnecteurCredentials;
    const hasCredentials =
      def.authType === "api_token"
        ? !!creds.apiToken
        : !!(creds.login && creds.password);
    return {
      ...def,
      credentials: creds,
      actif: row.actif,
      connecte: hasCredentials,
    };
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY, user?.id] });

  // Save / upsert
  const saveConnecteurMutation = useMutation({
    mutationFn: async ({
      connecteurId,
      credentials,
      actif,
    }: {
      connecteurId: string;
      credentials: ConnecteurCredentials;
      actif: boolean;
    }) => {
      if (!user) throw new Error("Non connecté");
      const { error } = await supabase.from("connecteurs_config" as any).upsert(
        {
          user_id: user.id,
          connecteur_id: connecteurId,
          credentials: credentials as any,
          actif,
        },
        { onConflict: "user_id,connecteur_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  // Toggle actif only
  const toggleConnecteurMutation = useMutation({
    mutationFn: async ({
      connecteurId,
      actif,
    }: {
      connecteurId: string;
      actif: boolean;
    }) => {
      if (!user) throw new Error("Non connecté");
      // Get existing row or create
      const existing = dbRows?.find((r) => r.connecteur_id === connecteurId);
      const { error } = await supabase.from("connecteurs_config" as any).upsert(
        {
          user_id: user.id,
          connecteur_id: connecteurId,
          credentials: existing?.credentials || {},
          actif,
        },
        { onConflict: "user_id,connecteur_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  // Delete
  const deleteConnecteurMutation = useMutation({
    mutationFn: async (connecteurId: string) => {
      if (!user) throw new Error("Non connecté");
      const { error } = await supabase
        .from("connecteurs_config" as any)
        .delete()
        .eq("user_id", user.id)
        .eq("connecteur_id", connecteurId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  return {
    connecteurs,
    loading: isLoading,
    saveConnecteur: (
      connecteurId: string,
      credentials: ConnecteurCredentials,
      actif: boolean
    ) => saveConnecteurMutation.mutateAsync({ connecteurId, credentials, actif }),
    toggleConnecteur: (connecteurId: string, actif: boolean) =>
      toggleConnecteurMutation.mutateAsync({ connecteurId, actif }),
    deleteConnecteur: (connecteurId: string) =>
      deleteConnecteurMutation.mutateAsync(connecteurId),
    saving:
      saveConnecteurMutation.isPending ||
      toggleConnecteurMutation.isPending ||
      deleteConnecteurMutation.isPending,
  };
}
