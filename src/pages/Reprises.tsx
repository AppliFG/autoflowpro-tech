import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Upload, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const reprises = [
  { id: 1, vehicule: "Dacia Sandero 2019", km: 65000, etat: "Bon", prixSouhaite: 8500, estimation: 7200, status: "a_analyser" },
  { id: 2, vehicule: "Ford Focus 2018", km: 82000, etat: "Correct", prixSouhaite: 9000, estimation: 7500, status: "offre_envoyee" },
  { id: 3, vehicule: "Opel Corsa 2020", km: 45000, etat: "Excellent", prixSouhaite: 11000, estimation: 10200, status: "acceptee" },
];

const statusMap: Record<string, { label: string; className: string }> = {
  a_analyser: { label: "À analyser", className: "bg-warning/15 text-warning border-warning/30" },
  offre_envoyee: { label: "Offre envoyée", className: "bg-info/15 text-info border-info/30" },
  acceptee: { label: "Acceptée", className: "bg-success/15 text-success border-success/30" },
  refusee: { label: "Refusée", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export default function Reprises() {
  return (
    <AppLayout title="Reprises véhicules">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold text-card-foreground mb-4">Formulaire de reprise</h3>
          <div className="space-y-3">
            {["Marque", "Modèle", "Année", "Kilométrage", "État"].map((label) => (
              <div key={label}>
                <label className="text-xs font-medium text-muted-foreground">{label}</label>
                <input className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Prix souhaité</label>
              <input type="number" className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1"><Camera className="h-4 w-4 mr-1" /> Photos</Button>
              <Button variant="outline" size="sm" className="flex-1"><Upload className="h-4 w-4 mr-1" /> Vidéo</Button>
            </div>
            <Button className="w-full" size="sm">Envoyer la demande</Button>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-foreground">Demandes de reprise</h3>
          {reprises.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-card-foreground">{r.vehicule}</h4>
                <Badge variant="outline" className={`text-[11px] ${statusMap[r.status].className}`}>
                  {statusMap[r.status].label}
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Km</p>
                  <p className="font-medium text-card-foreground">{r.km.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">État</p>
                  <p className="font-medium text-card-foreground">{r.etat}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Souhaité</p>
                  <p className="font-medium text-card-foreground">{r.prixSouhaite.toLocaleString()} €</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Estimation</p>
                  <p className="font-semibold text-primary">{r.estimation.toLocaleString()} €</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
