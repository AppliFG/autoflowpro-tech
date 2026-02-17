import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const statusMap: Record<string, { label: string; className: string }> = {
  Nouvelle: { label: "Nouvelle", className: "bg-warning/15 text-warning border-warning/30" },
  "En cours": { label: "En cours", className: "bg-info/15 text-info border-info/30" },
  Acceptée: { label: "Acceptée", className: "bg-success/15 text-success border-success/30" },
  Refusée: { label: "Refusée", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export default function Reprises() {
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
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : reprises.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Aucune demande de reprise</div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Demandes de reprise ({reprises.length})</h3>
          {reprises.map((r) => {
            const status = statusMap[r.status] || statusMap["Nouvelle"];
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-card-foreground">{r.full_name}</h4>
                    <p className="text-xs text-muted-foreground">{r.registration}</p>
                  </div>
                  <Badge variant="outline" className={`text-[11px] ${status.className}`}>
                    {status.label}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Km</p>
                    <p className="font-medium text-card-foreground">{r.mileage.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Téléphone</p>
                    <p className="font-medium text-card-foreground">{r.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Email</p>
                    <p className="font-medium text-card-foreground truncate">{r.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Montant souhaité</p>
                    <p className="font-medium text-card-foreground">
                      {r.desired_amount ? `${Number(r.desired_amount).toLocaleString()} €` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Photos</p>
                    <p className="font-medium text-card-foreground">{(r.photo_urls || []).length} photo(s)</p>
                  </div>
                </div>
                {(r.photo_urls || []).length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {(r.photo_urls as string[]).map((url, i) => (
                      <img key={i} src={url} alt="" className="h-16 w-20 object-cover rounded-md border border-border" />
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
