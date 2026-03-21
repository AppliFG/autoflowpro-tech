import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "commercial" | "comptable" | "dev" | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: AppRole;
  roleLoading: boolean;
  mustChangePassword: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  role: null,
  roleLoading: true,
  mustChangePassword: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const fetchRole = async (userId: string, retries = 3) => {
    setRoleLoading(true);
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
      if (data?.role) {
        setRole(data.role as AppRole);
        setRoleLoading(false);
        return;
      }
      if (retries > 0) {
        setTimeout(() => fetchRole(userId, retries - 1), 1000);
        return;
      }
      setRole(null);
    } catch {
      if (retries > 0) {
        setTimeout(() => fetchRole(userId, retries - 1), 1000);
        return;
      }
      setRole(null);
    }
    setRoleLoading(false);
  };

  const fetchMustChangePassword = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("user_id", userId)
        .single();
      setMustChangePassword(data?.must_change_password ?? false);
    } catch {
      setMustChangePassword(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user?.id) {
          setTimeout(() => fetchRole(session.user.id), 0);
          fetchMustChangePassword(session.user.id);
        } else {
          setRole(null);
          setRoleLoading(false);
          setMustChangePassword(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user?.id) {
        fetchRole(session.user.id);
        fetchMustChangePassword(session.user.id);
      } else {
        setRoleLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, role, roleLoading, mustChangePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
