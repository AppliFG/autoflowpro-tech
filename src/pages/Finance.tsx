import AppLayout from "@/components/AppLayout";
import KpiCard from "@/components/KpiCard";
import { Euro, TrendingDown, TrendingUp, Wallet, FileText, Download, CheckCircle2, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const paymentStatuses = ["En attente", "Payée", "Annulée"];

const statusConfig: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
  "En attente": { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  "Payée": { variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
  "Annulée": { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

export default function Finance() {
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["finance-stats"],
    queryFn: async () => {
      const { data: vehicles } = await supabase.from("vehicles").select("selling_price, purchase_price, status");
      if (!vehicles) return { ca: 0, marge: 0, depenses: 0, tresorerie: 0 };

      const vendus = vehicles.filter((v) => v.status === "Vendu");
      const ca = vendus.reduce((s, v) => s + (Number(v.selling_price) || 0), 0);
      const coutVendus = vendus.reduce((s, v) => s + (Number(v.purchase_price) || 0), 0);
      const marge = ca - coutVendus;

      return { ca, marge, depenses: 0, tresorerie: marge };
    },
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, vehicles(brand, model, registration)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

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

  const s = stats || { ca: 0, marge: 0, depenses: 0, tresorerie: 0 };

  return (
    <AppLayout title="Finance & Gestion">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="CA Mensuel" value={`${s.ca.toLocaleString("fr-FR")} €`} icon={<Euro className="h-5 w-5" />} />
        <KpiCard title="Marge nette" value={`${s.marge.toLocaleString("fr-FR")} €`} icon={<TrendingUp className="h-5 w-5" />} variant={s.marge > 0 ? "success" : "default"} />
        <KpiCard title="Dépenses" value={`${s.depenses.toLocaleString("fr-FR")} €`} icon={<TrendingDown className="h-5 w-5" />} />
        <KpiCard title="Trésorerie" value={`${s.tresorerie.toLocaleString("fr-FR")} €`} icon={<Wallet className="h-5 w-5" />} />
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
