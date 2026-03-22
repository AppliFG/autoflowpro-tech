import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ConnecteurConfig,
  ConnecteurCredentials,
  CONNECTEURS_DISPONIBLES,
} from "@/types/connecteurs";

// ═══════════════════════════════════════════════════════
// Hook useConnecteurs — Persistance Supabase
// Les credentials sont sauvegardés en base et persistent
// entre les pages et les sessions.
// ═══════════════════════════════════════════════════════

interface ConnecteurDB {
  id: string;
  user_id: string;
  connecteur_id: string;
  credentials: ConnecteurCredentials;
  actif: boolean;
  connecte: boolean;
  created_at: string;
  updated_at: string;
}

export function useConnecteurs() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [connecteurs, setConnecteurs] = useState<ConnecteurConfig[]>(CONNECTEURS_DISPONIBLES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const userId = user?.id ?? null;

  const getDefaultConnecteurs = useCallback(
    () => CONNECTEURS_DISPONIBLES.map((c) => ({ ...c, credentials: {} })),
    []
  );

  // Charger les connecteurs depuis Supabase
  const loadConnecteurs = useCallback(async () => {
    if (!userId) {
      setConnecteurs(getDefaultConnecteurs());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("connecteurs_config")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.error("Erreur chargement connecteurs:", error);
        console.warn("Fallback connecteurs par défaut (credentials vides)");
        setConnecteurs(getDefaultConnecteurs());
        return;
      }

      const dbConnecteurs = (data || []) as unknown as ConnecteurDB[];

      // Fusionner : données Supabase + liste par défaut
      const merged = CONNECTEURS_DISPONIBLES.map((defaultConn) => {
        const saved = dbConnecteurs.find((db) => db.connecteur_id === defaultConn.id);
        if (saved) {
          return {
            ...defaultConn,
            credentials: saved.credentials || {},
            actif: saved.actif,
            connecte: saved.connecte,
          };
        }
        return { ...defaultConn };
      });

      // Ajouter les connecteurs custom (ajoutés par l'utilisateur, pas dans CONNECTEURS_DISPONIBLES)
      const customConnecteurs = dbConnecteurs
        .filter((db) => !CONNECTEURS_DISPONIBLES.find((d) => d.id === db.connecteur_id))
        .map((db) => ({
          id: db.connecteur_id,
          nom: (db.credentials as any)?.nom || db.connecteur_id,
          description: (db.credentials as any)?.description || "",
          categorie: (db.credentials as any)?.categorie || "autre",
          logo: "⚙️",
          couleur: "#6B7280",
          siteUrl: (db.credentials as any)?.siteUrl || "",
          authType: (db.credentials as any)?.authType || "login_password",
          credentials: db.credentials,
          actif: db.actif,
          connecte: db.connecte,
          abonnementRequis: false,
          abonnementLabel: "",
          docsUrl: "",
          fonctionnalites: [],
        } as ConnecteurConfig));

      setConnecteurs([...merged, ...customConnecteurs]);
    } catch (err) {
      console.error("Erreur useConnecteurs:", err);
      console.warn("Fallback connecteurs par défaut (credentials vides)");
      setConnecteurs(getDefaultConnecteurs());
    } finally {
      setLoading(false);
    }
  }, [userId, getDefaultConnecteurs]);

  // Recharger quand userId change
  useEffect(() => {
    loadConnecteurs();
  }, [loadConnecteurs]);

  // ─── SAUVEGARDER un connecteur (UPSERT) ───
  const saveConnecteur = useCallback(
    async (connecteurId: string, credentials: ConnecteurCredentials, actif: boolean) => {
      if (!userId) {
        toast({ title: "Non connecté", variant: "destructive" });
        return false;
      }

      // Déterminer si "connecté" (credentials renseignés)
      const hasToken = !!credentials.apiToken;
      const hasLogin = !!(credentials.login && credentials.password);
      const connecte = hasToken || hasLogin;

      setSaving(true);
      try {
        const { error } = await supabase
          .from("connecteurs_config")
          .upsert(
            {
              user_id: userId,
              connecteur_id: connecteurId,
              credentials: credentials as any,
              actif: actif,
              connecte: connecte,
            } as any,
            { onConflict: "user_id,connecteur_id" }
          );

        if (error) {
          console.error("Erreur sauvegarde:", error);
          toast({ title: "Erreur de sauvegarde", description: error.message, variant: "destructive" });
          return false;
        }

        // Mettre à jour le state local immédiatement (optimistic update)
        setConnecteurs((prev) =>
          prev.map((c) =>
            c.id === connecteurId
              ? { ...c, credentials, actif, connecte }
              : c
          )
        );

        toast({ title: "Configuration sauvegardée" });
        return true;
      } catch (err: any) {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [userId, toast]
  );

  // ─── TOGGLE actif/inactif ───
  const toggleConnecteur = useCallback(
    async (connecteurId: string, actif: boolean) => {
      if (!userId) return false;

      const current = connecteurs.find((c) => c.id === connecteurId);
      if (!current) return false;

      setSaving(true);
      try {
        const { error } = await supabase
          .from("connecteurs_config")
          .upsert(
            {
              user_id: userId,
              connecteur_id: connecteurId,
              credentials: current.credentials as any,
              actif: actif,
              connecte: current.connecte,
            } as any,
            { onConflict: "user_id,connecteur_id" }
          );

        if (error) {
          console.error("Erreur toggle:", error);
          return false;
        }

        setConnecteurs((prev) =>
          prev.map((c) => (c.id === connecteurId ? { ...c, actif } : c))
        );

        return true;
      } catch {
        return false;
      } finally {
        setSaving(false);
      }
    },
    [userId, connecteurs]
  );

  // ─── DÉCONNECTER (vider credentials) ───
  const disconnectConnecteur = useCallback(
    async (connecteurId: string) => {
      if (!userId) return false;

      setSaving(true);
      try {
        const { error } = await supabase
          .from("connecteurs_config")
          .upsert(
            {
              user_id: userId,
              connecteur_id: connecteurId,
              credentials: {} as any,
              actif: false,
              connecte: false,
            } as any,
            { onConflict: "user_id,connecteur_id" }
          );

        if (error) {
          console.error("Erreur déconnexion:", error);
          return false;
        }

        setConnecteurs((prev) =>
          prev.map((c) =>
            c.id === connecteurId
              ? { ...c, credentials: {}, actif: false, connecte: false }
              : c
          )
        );

        toast({ title: "Connecteur déconnecté" });
        return true;
      } catch {
        return false;
      } finally {
        setSaving(false);
      }
    },
    [userId, toast]
  );

  // ─── SUPPRIMER un connecteur ───
  const deleteConnecteur = useCallback(
    async (connecteurId: string) => {
      if (!userId) return false;

      setSaving(true);
      try {
        const { error } = await supabase
          .from("connecteurs_config")
          .delete()
          .eq("user_id", userId)
          .eq("connecteur_id", connecteurId);

        if (error) {
          console.error("Erreur suppression:", error);
          return false;
        }

        const isDefault = CONNECTEURS_DISPONIBLES.find((d) => d.id === connecteurId);
        if (isDefault) {
          setConnecteurs((prev) =>
            prev.map((c) =>
              c.id === connecteurId
                ? { ...isDefault, credentials: {}, actif: false, connecte: false }
                : c
            )
          );
        } else {
          setConnecteurs((prev) => prev.filter((c) => c.id !== connecteurId));
        }

        toast({ title: "Connecteur supprimé" });
        return true;
      } catch {
        return false;
      } finally {
        setSaving(false);
      }
    },
    [userId, toast]
  );

  // ─── AJOUTER un connecteur custom ───
  const addConnecteur = useCallback(
    async (config: {
      nom: string;
      siteUrl: string;
      authType: string;
      categorie: string;
      description?: string;
    }) => {
      if (!userId) return false;

      const connecteurId = `custom-${Date.now()}`;
      const credentials: any = {
        nom: config.nom,
        siteUrl: config.siteUrl,
        authType: config.authType,
        categorie: config.categorie,
        description: config.description || "",
      };

      setSaving(true);
      try {
        const { error } = await supabase
          .from("connecteurs_config")
          .insert({
            user_id: userId,
            connecteur_id: connecteurId,
            credentials: credentials,
            actif: false,
            connecte: false,
          } as any);

        if (error) {
          console.error("Erreur ajout:", error);
          toast({ title: "Erreur", description: error.message, variant: "destructive" });
          return false;
        }

        const newConn: ConnecteurConfig = {
          id: connecteurId,
          nom: config.nom,
          description: config.description || "",
          categorie: config.categorie as any,
          logo: "⚙️",
          couleur: "#6B7280",
          siteUrl: config.siteUrl,
          authType: config.authType as any,
          credentials: credentials,
          actif: false,
          connecte: false,
          abonnementRequis: false,
          abonnementLabel: "",
          docsUrl: "",
          fonctionnalites: [],
        };

        setConnecteurs((prev) => [...prev, newConn]);
        toast({ title: "Fournisseur ajouté", description: config.nom });
        return true;
      } catch (err: any) {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [userId, toast]
  );

  // ─── HELPERS ───
  const getCredentials = useCallback(
    (connecteurId: string): ConnecteurCredentials | null => {
      const c = connecteurs.find((x) => x.id === connecteurId);
      if (!c || !c.actif || !c.connecte) return null;
      return c.credentials;
    },
    [connecteurs]
  );

  const isReady = useCallback(
    (connecteurId: string): boolean => {
      const c = connecteurs.find((x) => x.id === connecteurId);
      return !!c && c.actif && c.connecte;
    },
    [connecteurs]
  );

  return {
    connecteurs,
    loading,
    saving,
    saveConnecteur,
    toggleConnecteur,
    disconnectConnecteur,
    deleteConnecteur,
    addConnecteur,
    getCredentials,
    isReady,
    reload: loadConnecteurs,
  };
}
