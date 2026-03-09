import AppLayout from "@/components/AppLayout";
import { Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProspectDialog from "@/components/ProspectDialog";

const columns = [
  { id: "Nouveau", title: "Nouveau", color: "bg-info" },
  { id: "Contacté", title: "Contacté", color: "bg-primary" },
  { id: "RDV fixé", title: "RDV fixé", color: "bg-warning" },
  { id: "Négociation", title: "Négociation", color: "bg-accent" },
  { id: "Réservé", title: "Réservé", color: "bg-success" },
  { id: "Vendu", title: "Vendu", color: "bg-muted-foreground" },
];

export default function CRM() {
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: prospects = [] } = useQuery({
    queryKey: ["prospects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prospects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const totalActive = prospects.filter((p: any) => p.status !== "Vendu").length;

  return (
    <AppLayout title="CRM — Pipeline commercial">
      <ProspectDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["prospects"] })}
      />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{totalActive} prospects actifs</p>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Nouveau prospect
        </Button>
      </div>

      {/* Mobile: stacked columns */}
      <div className="sm:hidden space-y-4">
        {columns.map((col) => {
          const colProspects = prospects.filter((p: any) => p.status === col.id);
          if (colProspects.length === 0) return null;
          return (
            <div key={col.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                <span className="ml-auto text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{colProspects.length}</span>
              </div>
              <div className="space-y-2">
                {colProspects.map((p: any) => (
                  <div key={p.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-sm text-card-foreground">{p.full_name}</p>
                      <Badge variant="outline" className="text-[10px] shrink-0">{col.title}</Badge>
                    </div>
                    {p.vehicle_interest && (
                      <p className="text-xs text-muted-foreground mt-1">{p.vehicle_interest}</p>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {p.phone && <a href={`tel:${p.phone}`} className="text-primary">{p.phone}</a>}
                      {p.email && <span className="truncate">{p.email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {prospects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">Aucun prospect</div>
        )}
      </div>

      {/* Desktop: kanban columns */}
      <div className="hidden sm:flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colProspects = prospects.filter((p: any) => p.status === col.id);
          return (
            <div key={col.id} className="min-w-[260px] w-[260px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                <span className="ml-auto text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{colProspects.length}</span>
              </div>
              {colProspects.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Aucun prospect
                </div>
              ) : (
                <div className="space-y-2">
                  {colProspects.map((p: any) => (
                    <div key={p.id} className="rounded-lg border border-border bg-card p-3 shadow-sm">
                      <p className="font-medium text-sm text-card-foreground">{p.full_name}</p>
                      {p.vehicle_interest && (
                        <p className="text-xs text-muted-foreground mt-0.5">{p.vehicle_interest}</p>
                      )}
                      <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                        {p.phone && <span>{p.phone}</span>}
                        {p.email && <span className="truncate">{p.email}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
