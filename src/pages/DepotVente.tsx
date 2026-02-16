import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Clock, AlertTriangle } from "lucide-react";

const mandats = [
  { id: 1, vehicule: "Renault Captur 2022", proprietaire: "Jean Duval", prixSouhaite: 18000, prixConseille: 17500, commission: 8, dateDebut: "01/01/2026", dateFin: "01/04/2026", status: "actif" },
  { id: 2, vehicule: "Citroën C3 2021", proprietaire: "Marie Lambert", prixSouhaite: 12500, prixConseille: 12000, commission: 10, dateDebut: "15/12/2025", dateFin: "15/03/2026", status: "actif" },
  { id: 3, vehicule: "Fiat 500 2020", proprietaire: "Paul Martin", prixSouhaite: 11000, prixConseille: 10500, commission: 1000, dateDebut: "01/11/2025", dateFin: "01/02/2026", status: "expire" },
];

export default function DepotVente() {
  return (
    <AppLayout title="Dépôt-vente">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{mandats.filter(m => m.status === "actif").length} mandats actifs</p>
        <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Nouveau mandat</Button>
      </div>

      <div className="grid gap-4">
        {mandats.map((m) => (
          <div key={m.id} className={`rounded-xl border bg-card p-5 shadow-sm ${m.status === "expire" ? "border-destructive/30" : "border-border"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-card-foreground">{m.vehicule}</h3>
                  {m.status === "expire" && (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[11px]">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Expiré
                    </Badge>
                  )}
                  {m.status === "actif" && (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[11px]">Actif</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Propriétaire : {m.proprietaire}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {m.dateDebut} → {m.dateFin}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Prix souhaité</p>
                <p className="text-sm font-semibold text-card-foreground">{m.prixSouhaite.toLocaleString()} €</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Prix conseillé</p>
                <p className="text-sm font-semibold text-card-foreground">{m.prixConseille.toLocaleString()} €</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Commission</p>
                <p className="text-sm font-semibold text-primary">{m.commission > 100 ? `${m.commission} €` : `${m.commission}%`}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Net vendeur</p>
                <p className="text-sm font-semibold text-success">
                  {m.commission > 100
                    ? `${(m.prixConseille - m.commission).toLocaleString()} €`
                    : `${Math.round(m.prixConseille * (1 - m.commission / 100)).toLocaleString()} €`
                  }
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
