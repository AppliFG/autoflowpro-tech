import { useState } from "react";
import {
  ExternalLink, Eye, EyeOff, Check, X, Search, Shield, Plug, PlugZap,
  ChevronDown, ChevronUp, AlertCircle, Settings2, Lock, Unlock, Trash2, Power
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  ConnecteurConfig,
  ConnecteurCategorie,
  CATEGORIE_LABELS,
  CATEGORIE_ICONS,
  CONNECTEURS_DISPONIBLES,
} from "@/types/connecteurs";

export default function ParametresConnecteurs() {
  const { toast } = useToast();
  const [connecteurs, setConnecteurs] = useState<ConnecteurConfig[]>(CONNECTEURS_DISPONIBLES);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategorie, setFilterCategorie] = useState<ConnecteurCategorie | "all">("all");

  // Mettre à jour les credentials d'un connecteur
  const updateCredential = (id: string, field: string, value: string) => {
    setConnecteurs(prev => prev.map(c => {
      if (c.id !== id) return c;
      const isCustom = !["login", "password", "apiToken", "apiKey", "apiSecret", "clientId", "accountId"].includes(field);
      if (isCustom) {
        return { ...c, credentials: { ...c.credentials, customFields: { ...(c.credentials.customFields || {}), [field]: value } } };
      }
      return { ...c, credentials: { ...c.credentials, [field]: value } };
    }));
  };

  // Sauvegarder (marquer comme connecté)
  const saveConnecteur = (id: string) => {
    setConnecteurs(prev => prev.map(c => {
      if (c.id !== id) return c;
      const hasCredentials = c.authType === "api_token"
        ? !!c.credentials.apiToken
        : !!(c.credentials.login && c.credentials.password);
      return { ...c, connecte: hasCredentials };
    }));
    toast({ title: "Configuration sauvegardée" });
  };

  // Déconnecter (vider les credentials)
  const disconnectConnecteur = (id: string) => {
    setConnecteurs(prev => prev.map(c =>
      c.id === id ? { ...c, connecte: false, credentials: {} } : c
    ));
    toast({ title: "Connecteur déconnecté" });
  };

  // Toggle actif/inactif
  const toggleActif = (id: string) => {
    setConnecteurs(prev => prev.map(c =>
      c.id === id ? { ...c, actif: !c.actif } : c
    ));
  };

  // Toggle visibilité mot de passe
  const toggleShowPassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtrer
  const filteredConnecteurs = connecteurs.filter(c => {
    if (filterCategorie !== "all" && c.categorie !== filterCategorie) return false;
    if (searchQuery && !c.nom.toLowerCase().includes(searchQuery.toLowerCase()) && !c.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Grouper par catégorie
  const categories = [...new Set(filteredConnecteurs.map(c => c.categorie))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Plug className="h-6 w-6 text-blue-600" />
          Fournisseurs & Connecteurs
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Configurez vos accès fournisseurs. Chaque société utilisant AutoFlow Pro peut connecter ses propres comptes. Aucune modification technique requise.
        </p>
      </div>

      {/* Barre de recherche + filtre */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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

      {/* Compteur */}
      <div className="flex gap-4 text-sm text-gray-500">
        <span>{connecteurs.filter(c => c.connecte).length} connecté{connecteurs.filter(c => c.connecte).length > 1 ? "s" : ""}</span>
        <span>{connecteurs.filter(c => c.actif).length} actif{connecteurs.filter(c => c.actif).length > 1 ? "s" : ""}</span>
        <span>{connecteurs.length} disponible{connecteurs.length > 1 ? "s" : ""}</span>
      </div>

      {/* Liste par catégorie */}
      {categories.map(categorie => (
        <div key={categorie} className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <span>{CATEGORIE_ICONS[categorie]}</span>
            {CATEGORIE_LABELS[categorie]}
          </h3>

          {filteredConnecteurs.filter(c => c.categorie === categorie).map(connecteur => (
            <div key={connecteur.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${connecteur.connecte ? "border-emerald-200" : connecteur.actif ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
              {/* En-tête */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-11 w-11 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: `${connecteur.couleur}15` }}>
                    {connecteur.logo}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{connecteur.nom}</span>
                      {connecteur.connecte ? (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] gap-1"><Check className="h-2.5 w-2.5" />Connecté</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Non configuré</Badge>
                      )}
                      {connecteur.abonnementRequis && (
                        <Badge variant="secondary" className="text-[10px]">{connecteur.abonnementLabel}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-lg">{connecteur.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a href={connecteur.siteUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600"><ExternalLink className="h-4 w-4" /></Button>
                  </a>
                  <Switch checked={connecteur.actif} onCheckedChange={() => toggleActif(connecteur.id)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={() => setExpandedId(expandedId === connecteur.id ? null : connecteur.id)}>
                    {expandedId === connecteur.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Formulaire de configuration (déplié) */}
              {expandedId === connecteur.id && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
                  {/* Fonctionnalités */}
                  <div className="flex flex-wrap gap-1.5">
                    {connecteur.fonctionnalites.map((f, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
                    ))}
                  </div>

                  {/* Champs d'authentification selon le type */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Lock className="h-4 w-4" />
                      Identifiants de connexion
                    </div>

                    {connecteur.authType === "api_token" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600">Token API</Label>
                        <div className="flex gap-2">
                          <Input
                            type={showPasswords[connecteur.id] ? "text" : "password"}
                            placeholder="Collez votre token API ici..."
                            value={connecteur.credentials.apiToken || ""}
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
                        {/* Account ID si nécessaire (ex: Partslink24) */}
                        {connecteur.credentials.customFields && "accountId" in (connecteur.credentials.customFields || {}) && (
                          <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-xs text-gray-600">ID compte / Numéro client</Label>
                            <Input
                              placeholder="Votre identifiant de compte..."
                              value={connecteur.credentials.customFields?.accountId || connecteur.credentials.accountId || ""}
                              onChange={(e) => updateCredential(connecteur.id, "accountId", e.target.value)}
                              className="font-mono text-sm"
                            />
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Login / Email</Label>
                          <Input
                            placeholder="Votre login ou email..."
                            value={connecteur.credentials.login || ""}
                            onChange={(e) => updateCredential(connecteur.id, "login", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Mot de passe</Label>
                          <div className="flex gap-2">
                            <Input
                              type={showPasswords[connecteur.id] ? "text" : "password"}
                              placeholder="Votre mot de passe..."
                              value={connecteur.credentials.password || ""}
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
                          <Label className="text-xs text-gray-600">Clé API</Label>
                          <Input
                            type={showPasswords[connecteur.id] ? "text" : "password"}
                            placeholder="Votre clé API..."
                            value={connecteur.credentials.apiKey || ""}
                            onChange={(e) => updateCredential(connecteur.id, "apiKey", e.target.value)}
                            className="font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Secret API</Label>
                          <div className="flex gap-2">
                            <Input
                              type={showPasswords[connecteur.id] ? "text" : "password"}
                              placeholder="Votre secret..."
                              value={connecteur.credentials.apiSecret || ""}
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

                  {/* Actions */}
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
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs text-red-600 hover:text-red-700" onClick={() => disconnectConnecteur(connecteur.id)}>
                          <Trash2 className="h-3 w-3" />Déconnecter
                        </Button>
                      )}
                    </div>
                    <Button size="sm" onClick={() => saveConnecteur(connecteur.id)} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                      <Check className="h-3.5 w-3.5" />
                      {connecteur.connecte ? "Mettre à jour" : "Enregistrer"}
                    </Button>
                  </div>

                  {/* Info sécurité */}
                  <div className="flex items-start gap-2 text-[10px] text-gray-400">
                    <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>Vos identifiants sont stockés de manière sécurisée et ne sont jamais partagés avec d'autres utilisateurs de la plateforme.</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Info SaaS */}
      <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
        <span>
          <strong>Mode SaaS :</strong> Chaque société utilisant AutoFlow Pro configure indépendamment ses propres accès fournisseurs ici. Les identifiants sont isolés entre les comptes. 
          Certaines fonctionnalités nécessitent un abonnement auprès du fournisseur concerné — AutoFlow Pro ne facture pas de supplément pour l'intégration.
        </span>
      </div>
    </div>
  );
}
