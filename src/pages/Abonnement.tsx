import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Crown, Zap, Rocket } from "lucide-react";

const features = [
  { name: "Véhicules en stock", starter: "25", pro: "100", entreprise: "Illimité" },
  { name: "Utilisateurs", starter: "1", pro: "5", entreprise: "Illimité" },
  { name: "Gestion de stock", starter: true, pro: true, entreprise: true },
  { name: "Demandes de devis fournisseurs", starter: true, pro: true, entreprise: true },
  { name: "Site vitrine", starter: true, pro: true, entreprise: true },
  { name: "Formulaire de reprise", starter: true, pro: true, entreprise: true },
  { name: "Agenda & événements", starter: true, pro: true, entreprise: true },
  { name: "CRM avancé & relances auto", starter: false, pro: true, entreprise: true },
  { name: "Dépôt-vente & mandats", starter: false, pro: true, entreprise: true },
  { name: "Multi-diffusion (LBC, AS24…)", starter: false, pro: true, entreprise: true },
  { name: "Finance & reporting", starter: "Basique", pro: "Complet", entreprise: "Avancé" },
  { name: "Multi-agences", starter: false, pro: false, entreprise: true },
  { name: "Reporting multi-sites", starter: false, pro: false, entreprise: true },
  { name: "Support", starter: "Email", pro: "Prioritaire", entreprise: "Dédié" },
];

const plans = [
  {
    id: "starter",
    nom: "Starter",
    prix: 0,
    prixLabel: "Gratuit",
    description: "Pour démarrer et tester l'outil",
    icon: Zap,
    highlight: false,
  },
  {
    id: "pro",
    nom: "Pro",
    prix: 79,
    prixLabel: "79 €",
    description: "Pour les pros qui veulent vendre plus",
    icon: Rocket,
    highlight: true,
  },
  {
    id: "entreprise",
    nom: "Entreprise",
    prix: 199,
    prixLabel: "199 €",
    description: "Multi-sites, reporting & contrôle total",
    icon: Crown,
    highlight: false,
  },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-4 w-4 text-success mx-auto" />;
  if (value === false) return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-xs font-medium text-card-foreground">{value}</span>;
}

export default function Abonnement() {
  return (
    <AppLayout title="Abonnement">
      <p className="text-sm text-muted-foreground mb-8">
        Choisissez le plan adapté à votre activité. Évoluez à tout moment.
      </p>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              className={`relative rounded-xl border-2 bg-card p-6 shadow-sm transition-shadow hover:shadow-md ${
                plan.highlight ? "border-primary" : "border-border"
              }`}
            >
              {plan.highlight && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px]">
                  Recommandé
                </Badge>
              )}
              <div className="flex items-center gap-2 mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${plan.highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-card-foreground">{plan.nom}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
              <div className="mb-5">
                <span className="text-3xl font-bold text-card-foreground">{plan.prixLabel}</span>
                {plan.prix > 0 && <span className="text-sm text-muted-foreground"> /mois HT</span>}
              </div>
              <Button variant={plan.highlight ? "default" : "outline"} className="w-full" size="sm">
                {plan.prix === 0 ? "Commencer gratuitement" : "Choisir ce plan"}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-card-foreground">Comparatif détaillé</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground w-1/3">Fonctionnalité</th>
                {plans.map((p) => (
                  <th key={p.id} className="p-3 text-center font-semibold text-card-foreground">
                    {p.nom}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={f.name} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                  <td className="p-3 text-card-foreground">{f.name}</td>
                  <td className="p-3 text-center"><FeatureValue value={f.starter} /></td>
                  <td className="p-3 text-center"><FeatureValue value={f.pro} /></td>
                  <td className="p-3 text-center"><FeatureValue value={f.entreprise} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
