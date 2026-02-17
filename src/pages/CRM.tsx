import AppLayout from "@/components/AppLayout";
import { Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const columns = [
  { id: "nouveau", title: "Nouveau", color: "bg-info" },
  { id: "contacte", title: "Contacté", color: "bg-primary" },
  { id: "rdv", title: "RDV fixé", color: "bg-warning" },
  { id: "negociation", title: "Négociation", color: "bg-accent" },
  { id: "reserve", title: "Réservé", color: "bg-success" },
  { id: "vendu", title: "Vendu", color: "bg-muted-foreground" },
];

export default function CRM() {
  return (
    <AppLayout title="CRM — Pipeline commercial">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">0 prospects actifs</p>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Nouveau prospect
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.id} className="min-w-[260px] w-[260px] flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <span className="ml-auto text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">0</span>
            </div>
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Aucun prospect
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center mt-6">
        <Info className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-semibold text-card-foreground mb-2">CRM non configuré</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Le module CRM complet avec gestion des prospects sera disponible prochainement. Vous pourrez suivre votre pipeline commercial de bout en bout.
        </p>
      </div>
    </AppLayout>
  );
}
