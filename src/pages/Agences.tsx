import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building2, Search, Users, Clock, CheckCircle, XCircle, AlertTriangle, Pencil, Trash2, Eye } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

interface Agency {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  siret: string | null;
  logo_url: string | null;
  owner_user_id: string | null;
  install_date: string;
  subscription_active: boolean;
  subscription_plan: string | null;
  subscription_started_at: string | null;
  created_at: string;
}

function getTrialInfo(installDate: string, subscriptionActive: boolean) {
  const now = new Date();
  const install = new Date(installDate);
  const daysElapsed = differenceInDays(now, install);
  const daysRemaining = Math.max(0, 30 - daysElapsed);
  const isExpired = daysRemaining === 0 && !subscriptionActive;
  const isTrialActive = daysRemaining > 0 && !subscriptionActive;
  return { daysRemaining, isExpired, isTrialActive, daysElapsed };
}

export default function Agences() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editPlan, setEditPlan] = useState("");
  const [editSubActive, setEditSubActive] = useState(false);

  const { data: agencies = [], isLoading } = useQuery({
    queryKey: ["agencies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Agency[];
    },
  });

  const updateAgencyMutation = useMutation({
    mutationFn: async ({ id, subscription_active, subscription_plan }: { id: string; subscription_active: boolean; subscription_plan: string | null }) => {
      const updatePayload: any = { subscription_active, subscription_plan };
      if (subscription_active && !agencies.find(a => a.id === id)?.subscription_started_at) {
        updatePayload.subscription_started_at = new Date().toISOString();
      }
      const { error } = await supabase.from("agencies").update(updatePayload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      toast.success("Agence mise à jour");
      setShowEditDialog(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteAgencyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agencies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      toast.success("Agence supprimée");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = agencies.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.email || "").toLowerCase().includes(search.toLowerCase());
    
    if (filterStatus === "all") return matchSearch;
    
    const { isExpired, isTrialActive } = getTrialInfo(a.install_date, a.subscription_active);
    if (filterStatus === "subscribed") return matchSearch && a.subscription_active;
    if (filterStatus === "trial") return matchSearch && isTrialActive;
    if (filterStatus === "expired") return matchSearch && isExpired;
    return matchSearch;
  });

  const stats = {
    total: agencies.length,
    subscribed: agencies.filter(a => a.subscription_active).length,
    trial: agencies.filter(a => { const { isTrialActive } = getTrialInfo(a.install_date, a.subscription_active); return isTrialActive; }).length,
    expired: agencies.filter(a => { const { isExpired } = getTrialInfo(a.install_date, a.subscription_active); return isExpired; }).length,
  };

  const openEdit = (agency: Agency) => {
    setSelectedAgency(agency);
    setEditPlan(agency.subscription_plan || "");
    setEditSubActive(agency.subscription_active);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!selectedAgency) return;
    updateAgencyMutation.mutate({
      id: selectedAgency.id,
      subscription_active: editSubActive,
      subscription_plan: editPlan || null,
    });
  };

  return (
    <AppLayout title="Panneau d'administration — Agences">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("all")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total agences</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("subscribed")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.subscribed}</p>
              <p className="text-xs text-muted-foreground">Abonnées</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("trial")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.trial}</p>
              <p className="text-xs text-muted-foreground">En essai</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("expired")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.expired}</p>
              <p className="text-xs text-muted-foreground">Expirées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher une agence..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="subscribed">Abonnées</SelectItem>
            <SelectItem value="trial">En essai</SelectItem>
            <SelectItem value="expired">Expirées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Agencies List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-8 text-center">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold text-card-foreground mb-1">Aucune agence trouvée</h3>
          <p className="text-sm text-muted-foreground">
            {agencies.length === 0
              ? "Aucune agence n'est encore inscrite. Les agences apparaîtront ici après avoir complété l'onboarding."
              : "Aucun résultat pour ce filtre."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((agency) => {
            const { daysRemaining, isExpired, isTrialActive } = getTrialInfo(agency.install_date, agency.subscription_active);
            return (
              <Card key={agency.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {agency.logo_url ? (
                        <img src={agency.logo_url} alt="" className="h-10 w-10 rounded-lg object-contain border bg-background shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{agency.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {agency.email || "—"} · Inscrite le {format(new Date(agency.created_at), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {agency.subscription_active ? (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Abonnée {agency.subscription_plan ? `(${agency.subscription_plan})` : ""}
                        </Badge>
                      ) : isTrialActive ? (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Essai — {daysRemaining}j restants
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Expiré
                        </Badge>
                      )}

                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setSelectedAgency(agency); setShowDetail(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(agency)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { if (confirm(`Supprimer l'agence "${agency.name}" ?`)) deleteAgencyMutation.mutate(agency.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedAgency?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedAgency && (() => {
            const { daysRemaining, isExpired, isTrialActive } = getTrialInfo(selectedAgency.install_date, selectedAgency.subscription_active);
            return (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Email</span><p className="font-medium">{selectedAgency.email || "—"}</p></div>
                  <div><span className="text-muted-foreground">Téléphone</span><p className="font-medium">{selectedAgency.phone || "—"}</p></div>
                  <div><span className="text-muted-foreground">SIRET</span><p className="font-medium">{selectedAgency.siret || "—"}</p></div>
                  <div><span className="text-muted-foreground">Adresse</span><p className="font-medium">{selectedAgency.address || "—"}</p></div>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date d'installation</span>
                    <span className="font-medium">{format(new Date(selectedAgency.install_date), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut</span>
                    {selectedAgency.subscription_active ? (
                      <Badge className="bg-green-600 text-white">Abonnée</Badge>
                    ) : isTrialActive ? (
                      <Badge variant="secondary">{daysRemaining}j d'essai restants</Badge>
                    ) : (
                      <Badge variant="destructive">Expiré</Badge>
                    )}
                  </div>
                  {selectedAgency.subscription_plan && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium">{selectedAgency.subscription_plan}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Modifier l'abonnement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Agence</Label>
              <p className="text-sm font-medium">{selectedAgency?.name}</p>
            </div>
            <div className="space-y-2">
              <Label>Statut abonnement</Label>
              <Select value={editSubActive ? "active" : "inactive"} onValueChange={v => setEditSubActive(v === "active")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Abonné</SelectItem>
                  <SelectItem value="inactive">Non abonné</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="entreprise">Entreprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Annuler</Button>
            <Button onClick={handleSaveEdit} disabled={updateAgencyMutation.isPending}>
              {updateAgencyMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
