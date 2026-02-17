import AppLayout from "@/components/AppLayout";
import StatusBadge, { VehicleStatus } from "@/components/StatusBadge";
import { Megaphone, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const statusDbToUi: Record<string, VehicleStatus> = {
  "En stock": "preparation",
  "En préparation": "preparation",
  "En ligne": "en_ligne",
  "Réservé": "reserve",
  "Vendu": "vendu",
  "Déposé": "depose",
  "Attente de réception": "attente_reception",
};

function margeIndicator(marge: number) {
  if (marge > 2000) return "bg-success";
  if (marge >= 1500) return "bg-warning";
  return "bg-destructive";
}

function joursIndicator(jours: number) {
  if (jours > 60) return "bg-destructive";
  if (jours > 40) return "bg-warning";
  return "bg-success";
}

export default function Stock() {
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["stock-intelligent"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*");
      if (error) throw error;
      return (data || []).map((v) => {
        const prixAchat = Number(v.purchase_price) || 0;
        const prixVente = Number(v.selling_price) || 0;
        const marge = prixVente - prixAchat;
        const jours = Math.floor((Date.now() - new Date(v.created_at).getTime()) / 86400000);
        return {
          id: v.id,
          vehicule: `${v.brand} ${v.model}`,
          prixVente,
          marge,
          jours,
          status: statusDbToUi[v.status] || "preparation",
        };
      });
    },
  });

  return (
    <AppLayout title="Stock intelligent">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-success" /> Marge &gt; 2 000 €
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-warning" /> Marge &lt; 1 500 €
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive" /> &gt; 60 jours
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : vehicles.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
          <Info className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold text-card-foreground mb-2">Aucun véhicule en stock</h3>
          <p className="text-sm text-muted-foreground">Ajoutez des véhicules pour voir les indicateurs de performance du stock.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div key={v.id} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-card-foreground text-sm">{v.vehicule}</h3>
                <StatusBadge status={v.status} />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Prix</p>
                  <p className="font-semibold text-card-foreground">{v.prixVente.toLocaleString()} €</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${margeIndicator(v.marge)}`} />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Marge</p>
                    <p className="font-semibold text-card-foreground">{v.marge.toLocaleString()} €</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${joursIndicator(v.jours)}`} />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">En stock</p>
                    <p className="font-semibold text-card-foreground">{v.jours}j</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
