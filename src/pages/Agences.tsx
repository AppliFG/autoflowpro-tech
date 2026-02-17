import AppLayout from "@/components/AppLayout";
import { Info } from "lucide-react";

export default function Agences() {
  return (
    <AppLayout title="Gestion multi-agences">
      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
        <Info className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-semibold text-card-foreground mb-2">Multi-agences non configuré</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Cette fonctionnalité sera disponible avec un abonnement multi-agences. Vous pourrez gérer plusieurs points de vente, affecter des utilisateurs et suivre les performances par agence.
        </p>
      </div>
    </AppLayout>
  );
}
