import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, Mail, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import TradeInDialog from "@/components/TradeInDialog";

const statusMap: Record<string, { label: string; className: string }> = {
  Nouvelle: { label: "Nouvelle", className: "bg-warning/15 text-warning border-warning/30" },
  "En cours": { label: "En cours", className: "bg-info/15 text-info border-info/30" },
  Acceptée: { label: "Acceptée", className: "bg-success/15 text-success border-success/30" },
  Refusée: { label: "Refusée", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export default function Reprises() {
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: reprises = [], isLoading } = useQuery({
    queryKey: ["trade-ins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trade_ins")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <AppLayout title="Reprises véhicules">
      <TradeInDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["trade-ins"] })}
      />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{reprises.length} demande{reprises.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> <span className="hidden sm:inline">Nouvelle reprise</span><span className="sm:hidden">Ajouter</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : reprises.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Aucune demande de reprise</div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {reprises.map((r) => {
            const status = statusMap[r.status] || statusMap["Nouvelle"];
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-card-foreground text-sm sm:text-base">{r.full_name}</h4>
                    <p className="text-xs text-muted-foreground">{r.registration}</p>
                  </div>
                  <Badge variant="outline" className={`text-[11px] shrink-0 ${status.className}`}>
                    {status.label}
                  </Badge>
                </div>

                {/* Mobile: stacked layout */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Km</p>
                    <p className="font-medium text-card-foreground">{r.mileage.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                      <Phone className="h-2.5 w-2.5 sm:hidden" /> Téléphone
                    </p>
                    <p className="font-medium text-card-foreground text-xs sm:text-sm">{r.phone}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                      <Mail className="h-2.5 w-2.5 sm:hidden" /> Email
                    </p>
                    <p className="font-medium text-card-foreground truncate text-xs sm:text-sm">{r.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Montant souhaité</p>
                    <p className="font-medium text-card-foreground">
                      {r.desired_amount ? `${Number(r.desired_amount).toLocaleString()} €` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                      <Camera className="h-2.5 w-2.5 sm:hidden" /> Photos
                    </p>
                    <p className="font-medium text-card-foreground">{(r.photo_urls || []).length} photo(s)</p>
                  </div>
                </div>

                {(r.photo_urls || []).length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {(r.photo_urls as string[]).map((url, i) => (
                      <img key={i} src={url} alt="" className="h-14 w-18 sm:h-16 sm:w-20 object-cover rounded-md border border-border shrink-0" />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
