import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Puzzle, Info } from "lucide-react";

const extensions = [
  { id: 1, nom: "Connecteur Leboncoin", prix: "19 €/mois", description: "Publication automatique sur Leboncoin" },
  { id: 2, nom: "Connecteur AutoScout24", prix: "19 €/mois", description: "Publication automatique sur AutoScout24" },
  { id: 3, nom: "Connecteur LaCentrale", prix: "19 €/mois", description: "Publication automatique sur LaCentrale" },
  { id: 4, nom: "Signature électronique", prix: "9 €/mois", description: "Signature numérique des mandats et bons" },
  { id: 5, nom: "Exports comptables", prix: "14 €/mois", description: "Export vers logiciels comptables" },
  { id: 6, nom: "SMS & Telegram", prix: "29 €/mois", description: "Notifications et relances par SMS et Telegram" },
  { id: 7, nom: "IA Assistant", prix: "39 €/mois", description: "Rédaction d'annonces et réponses IA" },
  { id: 8, nom: "White-label", prix: "49 €/mois", description: "Logo, domaine et couleurs personnalisés" },
];

export default function Extensions() {
  return (
    <AppLayout title="Extensions & Add-ons">
      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center mb-6">
        <Info className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Les extensions seront activables après la configuration de votre abonnement.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {extensions.map((ext) => (
          <div key={ext.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Puzzle className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-card-foreground text-sm">{ext.nom}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{ext.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-card-foreground">{ext.prix}</span>
              <Button variant="outline" size="sm" disabled>Bientôt disponible</Button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
