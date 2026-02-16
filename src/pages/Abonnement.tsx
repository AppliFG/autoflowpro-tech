import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const plans = [
  { id: "starter", nom: "Starter", prix: 49, features: ["1 agence", "2 utilisateurs", "30 véhicules", "CRM basique"], current: false, color: "border-border" },
  { id: "pro", nom: "Pro", prix: 99, features: ["1 agence", "5 utilisateurs", "120 véhicules", "CRM complet", "Dépôt-vente", "1 connecteur"], current: true, color: "border-primary" },
  { id: "business", nom: "Business", prix: 199, features: ["3 agences", "15 utilisateurs", "Véhicules illimités", "Multi-diffusion", "Automatisations", "Reporting avancé"], current: false, color: "border-border" },
  { id: "enterprise", nom: "Enterprise", prix: 399, features: ["Agences illimitées", "SSO / Audit logs", "API complète", "Support premium", "White-label"], current: false, color: "border-border" },
];

export default function Abonnement() {
  return (
    <AppLayout title="Abonnement">
      <p className="text-sm text-muted-foreground mb-8">Choisissez le plan adapté à vos besoins</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className={`rounded-xl border-2 bg-card p-5 shadow-sm relative ${plan.color}`}>
            {plan.current && (
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px]">
                Plan actuel
              </Badge>
            )}
            <h3 className="text-lg font-bold text-card-foreground">{plan.nom}</h3>
            <div className="mt-2 mb-4">
              <span className="text-3xl font-bold text-card-foreground">{plan.prix}</span>
              <span className="text-sm text-muted-foreground"> €/mois HT</span>
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-card-foreground">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant={plan.current ? "outline" : "default"} className="w-full" size="sm">
              {plan.current ? "Plan actuel" : "Choisir"}
            </Button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
