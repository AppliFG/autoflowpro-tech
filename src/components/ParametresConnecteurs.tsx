import { useState } from "react";
import {
  ExternalLink, Eye, EyeOff, Check, X, Search, Shield, Plug, PlugZap,
  ChevronDown, ChevronUp, AlertCircle, Settings2, Lock, Unlock, Trash2, Power, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useConnecteurs } from "@/hooks/useConnecteurs";
import {
  ConnecteurConfig,
  ConnecteurCategorie,
  ConnecteurCredentials,
  CATEGORIE_LABELS,
  CATEGORIE_ICONS,
} from "@/types/connecteurs";

export default function ParametresConnecteurs() {
  const { toast } = useToast();
  const { connecteurs, loading, saveConnecteur, toggleConnecteur, deleteConnecteur, saving } = useConnecteurs();

  // Local credential edits (only while form is expanded)
  const [localEdits, setLocalEdits] = useState<Record<string, ConnecteurCredentials>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategorie, setFilterCategorie] = useState<ConnecteurCategorie | "all">("all");

  const getEditableCreds = (c: ConnecteurConfig): ConnecteurCredentials => {
    return localEdits[c.id] ?? c.credentials;
  };

  const updateCredential = (id: string, field: string, value: string) => {
    setLocalEdits(prev => {
      const current = prev[id] ?? connecteurs.find(c => c.id === id)?.credentials ?? {};
      const isCustom = !["login", "password", "apiToken", "apiKey", "apiSecret", "clientId", "accountId"].includes(field);
      if (isCustom) {
        return { ...prev, [id]: { ...current, customFields: { ...(current.customFields || {}), [field]: value } } };
      }
      return { ...prev, [id]: { ...current, [field]: value } };
    });
  };

  const handleSave = async (id: string) => {
    const creds = localEdits[id] ?? connecteurs.find(c => c.id === id)?.credentials ?? {};
    try {
      await saveConnecteur(id, creds, true);
      setLocalEdits(prev => { const n = { ...prev }; delete n[id]; return n; });
      toast({ title: "Configuration sauvegardée ✓" });
    } catch {
      toast({ title: "Erreur de sauvegarde", variant: "destructive" });
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      await saveConnecteur(id, {}, false);
      setLocalEdits(prev => { const n = { ...prev }; delete n[id]; return n; });
      toast({ title: "Connecteur déconnecté" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleToggle = async (id: string, actif: boolean) => {
    try {
      await toggleConnecteur(id, actif);
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const toggleShowPassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setLocalEdits(prev => { const n = { ...prev }; delete n[id]; return n; });
    } else {
      setExpandedId(id);
    }
  };

  const filteredConnecteurs = connecteurs.filter(c => {
    if (filterCategorie !== "all" && c.categorie !== filterCategorie) return false;
    if (searchQuery && !c.nom.toLowerCase().includes(searchQuery.toLowerCase()) && !c.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const categories = [...new Set(filteredConnecteurs.map(c => c.categorie))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement des connecteurs...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Plug className="h-6 w-6 text-primary" />
          Fournisseurs & Connecteurs
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configurez vos accès fournisseurs. Chaque société utilisant AutoFlow Pro peut connecter ses propres comptes. Aucune modification technique requise.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un fournisseur..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button variant={filterCategorie === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterCategorie("all")}>Tous</Button>
          {Object.entries(CATEGORIE_LABELS)
            .filter(([key]) => key !== "facturation")
            .map(([key, label]) => (
            <Button key={key} variant={filterCategorie === key ? "default" : "outline"} size="sm" onClick={() => setFilterCategorie(key as ConnecteurCategorie)} className="gap-1">
              <span>{CATEGORIE_ICONS[key as ConnecteurCategorie]}</span>
              <span className="hidden md:inline">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{connecteurs.filter(c => c.connecte).length} connecté{connecteurs.filter(c => c.connecte).length > 1 ? "s" : ""}</span>
        <span>{connecteurs.filter(c => c.actif).length} actif{connecteurs.filter(c => c.actif).length > 1 ? "s" : ""}</span>
        <span>{connecteurs.length} disponible{connecteurs.length > 1 ? "s" : ""}</span>
      </div>

      {categories.map(categorie => (
        <div key={categorie} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <span>{CATEGORIE_ICONS[categorie]}</span>
            {CATEGORIE_LABELS[categorie]}
          </h3>

          {filteredConnecteurs.filter(c => c.categorie === categorie).map(connecteur => {
            const creds = getEditableCreds(connecteur);
            return (
            <div key={connecteur.id} className={`bg-card border rounded-xl overflow-hidden transition-all ${connecteur.connecte ? "border-emerald-200" : connecteur.actif ? "border-border" : "border-border/50 opacity-60"}`}>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-11 w-11 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: `${connecteur.couleur}15` }}>
                    {connecteur.logo}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{connecteur.nom}</span>
                      {connecteur.connecte ? (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] gap-1"><Check className="h-2.5 w-2.5" />Connecté</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Non configuré</Badge>
                      )}
                      {connecteur.abonnementRequis && (
                        <Badge variant="secondary" className="text-[10px]">{connecteur.abonnementLabel}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-lg">{connecteur.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a href={connecteur.siteUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><ExternalLink className="h-4 w-4" /></Button>
                  </a>
                  <Switch checked={connecteur.actif} onCheckedChange={(checked) => handleToggle(connecteur.id, checked)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleExpand(connecteur.id)}>
                    {expandedId === connecteur.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {expandedId === connecteur.id && (
                <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {connecteur.fonctionnalites.map((f, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
                    ))}
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Lock className="h-4 w-4" />
                      Identifiants de connexion
                    </div>

                    {connecteur.authType === "api_token" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Token API</Label>
                        <div className="flex gap-2">
                          <Input
                            type={showPasswords[connecteur.id] ? "text" : "password"}
                            placeholder="Collez votre token API ici..."
                            value={creds.apiToken || ""}
                            onChange={(e) => updateCredential(connecteur.id, "apiToken", e.target.value)}
                            className="flex-1 font-mono text-sm"
                          />
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => toggleShowPassword(connecteur.id)}>
                            {showPasswords[connecteur.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    )}

                    {connecteur.authType === "login_password" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Login / Email</Label>
                          <Input
                            placeholder="Votre login ou email..."
                            value={creds.login || ""}
                            onChange={(e) => updateCredential(connecteur.id, "login", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Mot de passe</Label>
                          <div className="flex gap-2">
                            <Input
                              type={showPasswords[connecteur.id] ? "text" : "password"}
                              placeholder="Votre mot de passe..."
                              value={creds.password || ""}
                              onChange={(e) => updateCredential(connecteur.id, "password", e.target.value)}
                              className="flex-1 text-sm"
                            />
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => toggleShowPassword(connecteur.id)}>
                              {showPasswords[connecteur.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {connecteur.authType === "api_key_secret" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Clé API</Label>
                          <Input
                            type={showPasswords[connecteur.id] ? "text" : "password"}
                            placeholder="Votre clé API..."
                            value={creds.apiKey || ""}
                            onChange={(e) => updateCredential(connecteur.id, "apiKey", e.target.value)}
                            className="font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Secret API</Label>
                          <div className="flex gap-2">
                            <Input
                              type={showPasswords[connecteur.id] ? "text" : "password"}
                              placeholder="Votre secret..."
                              value={creds.apiSecret || ""}
                              onChange={(e) => updateCredential(connecteur.id, "apiSecret", e.target.value)}
                              className="flex-1 font-mono text-sm"
                            />
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => toggleShowPassword(connecteur.id)}>
                              {showPasswords[connecteur.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {connecteur.docsUrl && (
                        <a href={connecteur.docsUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                            <ExternalLink className="h-3 w-3" />Documentation
                          </Button>
                        </a>
                      )}
                      {connecteur.connecte && (
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => handleDisconnect(connecteur.id)}>
                          <Trash2 className="h-3 w-3" />Déconnecter
                        </Button>
                      )}
                    </div>
                    <Button size="sm" onClick={() => handleSave(connecteur.id)} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      {connecteur.connecte ? "Mettre à jour" : "Enregistrer"}
                    </Button>
                  </div>

                  <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>Vos identifiants sont stockés de manière sécurisée et ne sont jamais partagés avec d'autres utilisateurs de la plateforme.</span>
                  </div>
                </div>
              )}
            </div>
          );})}
        </div>
      ))}

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg p-3">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <span>
          <strong>Mode SaaS :</strong> Chaque société utilisant AutoFlow Pro configure indépendamment ses propres accès fournisseurs ici. Les identifiants sont isolés entre les comptes. 
          Certaines fonctionnalités nécessitent un abonnement auprès du fournisseur concerné — AutoFlow Pro ne facture pas de supplément pour l'intégration.
        </span>
      </div>
    </div>
  );
}
