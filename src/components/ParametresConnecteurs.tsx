import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plug, ExternalLink, Search, Eye, EyeOff, Save, Unplug, Info, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CONNECTEURS, CATEGORY_LABELS, type ConnecteurConfig, type ConnecteurCredentials } from "@/types/connecteurs";

export default function ParametresConnecteurs() {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, ConnecteurCredentials>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredentials();
  }, []);

  const callEdgeFunction = async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Non connecté");

    const res = await supabase.functions.invoke("manage-connector-credentials", {
      body,
    });
    if (res.error) throw new Error(res.error.message);
    return res.data;
  };

  const loadCredentials = async () => {
    try {
      const result = await callEdgeFunction({ method: "list" });
      const creds: Record<string, ConnecteurCredentials> = {};
      for (const item of result.data || []) {
        creds[item.connector_id] = {
          connecteur_id: item.connector_id,
          enabled: item.enabled,
          token: item.token,
          login: item.login,
          password: item.password,
        };
      }
      setCredentials(creds);
    } catch (err: any) {
      // Silently fail on load (user might not be logged in yet)
      console.error("Failed to load connector credentials:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCred = (id: string): ConnecteurCredentials =>
    credentials[id] || { connecteur_id: id, enabled: false };

  const updateCred = (id: string, field: string, value: any) => {
    setCredentials((prev) => ({
      ...prev,
      [id]: { ...getCred(id), [field]: value },
    }));
  };

  const saveConnector = async (c: ConnecteurConfig) => {
    setSaving(c.id);
    try {
      const cred = getCred(c.id);
      const credentialData: Record<string, string> = {};
      if (c.authType === "token") {
        credentialData.token = cred.token || "";
      } else {
        credentialData.login = cred.login || "";
        credentialData.password = cred.password || "";
      }

      await callEdgeFunction({
        method: "save",
        connector_id: c.id,
        enabled: cred.enabled,
        credentials: credentialData,
      });
      toast.success(`${c.name} enregistré (chiffré)`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  };

  const disconnect = async (c: ConnecteurConfig) => {
    try {
      await callEdgeFunction({ method: "delete", connector_id: c.id });
      setCredentials((prev) => {
        const next = { ...prev };
        delete next[c.id];
        return next;
      });
      toast.success(`${c.name} déconnecté`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const categories = [...new Set(CONNECTEURS.map((c) => c.category))];
  const filtered = CONNECTEURS.filter((c) => {
    if (filterCat && c.category !== filterCat) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = categories.reduce((acc, cat) => {
    const items = filtered.filter((c) => c.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, ConnecteurConfig[]>);

  const connectorCount = CONNECTEURS.length;

  return (
    <div className="space-y-4">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{connectorCount} connecteurs disponibles en {categories.length} catégories</p>
        <Badge variant="outline" className="text-xs gap-1">
          <ShieldCheck className="h-3 w-3" />Chiffrement AES-256
        </Badge>
      </div>

      {/* Search & filter */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un connecteur..." className="pl-9" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <Button variant={filterCat === null ? "default" : "outline"} size="sm" onClick={() => setFilterCat(null)}>Tous</Button>
          {categories.map((cat) => (
            <Button key={cat} variant={filterCat === cat ? "default" : "outline"} size="sm" onClick={() => setFilterCat(cat)}>
              {CATEGORY_LABELS[cat]}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Chargement des connecteurs...</div>
      ) : (
        <>
          {/* Connectors by category */}
          {Object.entries(grouped).map(([cat, connectors]) => (
            <div key={cat}>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">{CATEGORY_LABELS[cat]} ({connectors.length})</h4>
              <div className="space-y-3">
                {connectors.map((c) => {
                  const cred = getCred(c.id);
                  const isConnected = cred.enabled && (c.authType === "token" ? !!cred.token : !!cred.login);
                  return (
                    <div key={c.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-lg ${c.color} flex items-center justify-center`}>
                            <Plug className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-card-foreground">{c.name}</span>
                              {c.requiresSubscription && <Badge variant="outline" className="text-[9px]">Abonnement requis</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{c.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isConnected ? "default" : "secondary"} className="text-[10px]">
                            {isConnected ? "Connecté" : "Non configuré"}
                          </Badge>
                          <Switch checked={cred.enabled} onCheckedChange={(v) => updateCred(c.id, "enabled", v)} />
                        </div>
                      </div>

                      {/* Credentials form */}
                      <div className="space-y-2">
                        {c.authType === "token" ? (
                          <div>
                            <Label className="text-xs">Token API</Label>
                            <div className="flex gap-2">
                              <Input
                                type={showPasswords[c.id] ? "text" : "password"}
                                value={cred.token || ""}
                                onChange={(e) => updateCred(c.id, "token", e.target.value)}
                                placeholder="Votre token API..."
                                className="flex-1 text-xs"
                              />
                              <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => setShowPasswords((p) => ({ ...p, [c.id]: !p[c.id] }))}>
                                {showPasswords[c.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Identifiant</Label>
                              <Input value={cred.login || ""} onChange={(e) => updateCred(c.id, "login", e.target.value)} placeholder="Votre identifiant" className="text-xs" />
                            </div>
                            <div>
                              <Label className="text-xs">Mot de passe</Label>
                              <div className="flex gap-1">
                                <Input
                                  type={showPasswords[c.id] ? "text" : "password"}
                                  value={cred.password || ""}
                                  onChange={(e) => updateCred(c.id, "password", e.target.value)}
                                  placeholder="Votre mot de passe"
                                  className="flex-1 text-xs"
                                />
                                <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => setShowPasswords((p) => ({ ...p, [c.id]: !p[c.id] }))}>
                                  {showPasswords[c.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.features.map((f) => (
                          <Badge key={f} variant="secondary" className="text-[9px] font-normal">{f}</Badge>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                        <div className="flex gap-2">
                          <a href={c.siteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />Site officiel
                          </a>
                          <a href={c.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                            Documentation
                          </a>
                        </div>
                        <div className="flex gap-1.5">
                          {isConnected && (
                            <Button variant="outline" size="sm" onClick={() => disconnect(c)} className="text-destructive text-xs">
                              <Unplug className="h-3 w-3 mr-1" />Déconnecter
                            </Button>
                          )}
                          <Button size="sm" onClick={() => saveConnector(c)} disabled={saving === c.id} className="text-xs">
                            <Save className="h-3 w-3 mr-1" />{saving === c.id ? "..." : "Enregistrer"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* SaaS note */}
      <div className="rounded-lg bg-muted/50 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <p className="font-semibold text-card-foreground mb-1">Architecture SaaS multi-tenant sécurisée</p>
          <p>Vos identifiants fournisseurs sont chiffrés côté serveur (AES-256-GCM) avant d'être stockés en base de données. Ils sont isolés par compte utilisateur et ne sont jamais accessibles en clair dans la base. Seul votre compte peut les lire.</p>
        </div>
      </div>
    </div>
  );
}
