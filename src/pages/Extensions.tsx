import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Puzzle, Check } from "lucide-react";

const extensions = [
  { id: 1, nom: "Connecteur Leboncoin", prix: "19 €/mois", description: "Publication automatique sur Leboncoin", active: true },
  { id: 2, nom: "Connecteur AutoScout24", prix: "19 €/mois", description: "Publication automatique sur AutoScout24", active: true },
  { id: 3, nom: "Connecteur LaCentrale", prix: "19 €/mois", description: "Publication automatique sur LaCentrale", active: false },
  { id: 4, nom: "Signature électronique", prix: "9 €/mois", description: "Signature numérique des mandats et bons", active: false },
  { id: 5, nom: "Exports comptables", prix: "14 €/mois", description: "Export vers logiciels comptables", active: false },
  { id: 6, nom: "SMS & WhatsApp", prix: "29 €/mois", description: "Notifications et relances par SMS", active: false },
  { id: 7, nom: "IA Assistant", prix: "39 €/mois", description: "Rédaction d'annonces et réponses IA", active: false },
  { id: 8, nom: "White-label", prix: "49 €/mois", description: "Logo, domaine et couleurs personnalisés", active: false },
];

export default function Extensions() {
  return (
    <AppLayout title="Extensions & Add-ons">
      <p className="text-sm text-muted-foreground mb-6">Activez des fonctionnalités supplémentaires pour votre agence</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {extensions.map((ext) => (
          <div key={ext.id} className={`rounded-xl border bg-card p-5 shadow-sm ${ext.active ? "border-primary/30" : "border-border"}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Puzzle className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-card-foreground text-sm">{ext.nom}</h3>
              </div>
              {ext.active && (
                <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[10px]">
                  <Check className="h-3 w-3 mr-0.5" /> Actif
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">{ext.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-card-foreground">{ext.prix}</span>
              <Button variant={ext.active ? "outline" : "default"} size="sm">
                {ext.active ? "Désactiver" : "Activer"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
