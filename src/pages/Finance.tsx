import { useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import KpiCard from "@/components/KpiCard";
import { Euro, TrendingDown, TrendingUp, Wallet, FileText, Download, CheckCircle2, Clock, XCircle, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const paymentStatuses = ["En attente", "Payée", "Annulée"];

const statusConfig: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
  "En attente": { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  "Payée": { variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
  "Annulée": { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export default function Finance() {
  const queryClient = useQueryClient();

  // Fetch vehicles with works for margin calculation
  const { data: vehiclesData } = useQuery({
    queryKey: ["finance-vehicles-works"],
    queryFn: async () => {
      const { data: vehicles } = await supabase.from("vehicles").select("id, selling_price, purchase_price, status");
      const { data: works } = await supabase.from("vehicle_works").select("vehicle_id, cost");
      return { vehicles: vehicles || [], works: works || [] };
    },
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, vehicles(brand, model, registration, purchase_price)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // KPI stats
  const stats = useMemo(() => {
    if (!vehiclesData) return { ca: 0, marge: 0, depenses: 0, tresorerie: 0 };
    const { vehicles, works } = vehiclesData;
    const vendus = vehicles.filter((v) => v.status === "vendu" || v.status === "Vendu");
    const ca = vendus.reduce((s, v) => s + (Number(v.selling_price) || 0), 0);
    const coutAchat = vendus.reduce((s, v) => s + (Number(v.purchase_price) || 0), 0);
    const venduIds = new Set(vendus.map((v) => v.id));
    const coutTravaux = works
      .filter((w) => venduIds.has(w.vehicle_id))
      .reduce((s, w) => s + (Number(w.cost) || 0), 0);
    const depenses = coutAchat + coutTravaux;
    const marge = ca - depenses;
    return { ca, marge, depenses, tresorerie: marge };
  }, [vehiclesData]);

  // Monthly chart data from invoices (non-cancelled)
  const chartData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const months: Record<string, { ca: number; cout: number }> = {};

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(year, now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = { ca: 0, cout: 0 };
    }

    for (const inv of invoices) {
      if (inv.payment_status === "Annulée") continue;
      const d = new Date(inv.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (months[key] !== undefined) {
        months[key].ca += Number(inv.amount) || 0;
        const purchasePrice = Number(inv.vehicles?.purchase_price) || 0;
        months[key].cout += purchasePrice;
      }
    }

    return Object.entries(months).map(([key, val]) => {
      const [, m] = key.split("-");
      return {
        mois: MONTH_LABELS[parseInt(m) - 1],
        CA: val.ca,
        Marge: val.ca - val.cout,
      };
    });
  }, [invoices]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { payment_status: status };
      if (status === "Payée") updates.payment_date = new Date().toISOString();
      if (status !== "Payée") updates.payment_date = null;
      const { error } = await supabase.from("invoices").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Statut mis à jour");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const s = stats;

  return (
    <AppLayout title="Finance & Gestion">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="CA Total" value={`${s.ca.toLocaleString("fr-FR")} €`} icon={<Euro className="h-5 w-5" />} />
        <KpiCard title="Marge nette" value={`${s.marge.toLocaleString("fr-FR")} €`} icon={<TrendingUp className="h-5 w-5" />} variant={s.marge > 0 ? "success" : "default"} />
        <KpiCard title="Dépenses" value={`${s.depenses.toLocaleString("fr-FR")} €`} icon={<TrendingDown className="h-5 w-5" />} />
        <KpiCard title="Trésorerie" value={`${s.tresorerie.toLocaleString("fr-FR")} €`} icon={<Wallet className="h-5 w-5" />} />
      </div>

      {/* Monthly Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl border border-border bg-card shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-card-foreground">Chiffre d'affaires mensuel</h2>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString("fr-FR")} €`, "CA"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  labelStyle={{ color: "hsl(var(--card-foreground))" }}
                />
                <Bar dataKey="CA" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-success" />
            <h2 className="font-semibold text-card-foreground">Marge mensuelle</h2>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString("fr-FR")} €`, "Marge"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  labelStyle={{ color: "hsl(var(--card-foreground))" }}
                />
                <Bar dataKey="Marge" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-card-foreground">Historique des factures</h2>
          </div>
          <Badge variant="outline">{invoices.length} facture{invoices.length !== 1 ? "s" : ""}</Badge>
        </div>

        {loadingInvoices ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>Aucune facture générée pour le moment.</p>
            <p className="text-xs mt-1">Générez une facture depuis la page Véhicules.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">N° Facture</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Véhicule</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Montant</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Statut</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Paiement</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => {
                  const cfg = statusConfig[inv.payment_status] || statusConfig["En attente"];
                  const vehicle = inv.vehicles;
                  return (
                    <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-card-foreground">{inv.client_nom}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-card-foreground">
                        {Number(inv.amount).toLocaleString("fr-FR")} €
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={cfg.variant} className="gap-1">
                          {cfg.icon} {inv.payment_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <Select
                          value={inv.payment_status}
                          onValueChange={(val) => updateStatus.mutate({ id: inv.id, status: val })}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentStatuses.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        {inv.pdf_url && (
                          <Button asChild variant="ghost" size="sm">
                            <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" title="Télécharger">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}