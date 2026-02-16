import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Building2, Users, FileText, Bell, Shield } from "lucide-react";

const sections = [
  { icon: Building2, title: "Agence", description: "Nom, adresse, logo, mentions légales" },
  { icon: Users, title: "Utilisateurs & Rôles", description: "Gérer les accès et permissions" },
  { icon: FileText, title: "Templates", description: "Modèles d'annonces, factures, mandats" },
  { icon: Bell, title: "Notifications", description: "Alertes email, push et SMS" },
  { icon: Shield, title: "Sécurité", description: "Mot de passe, 2FA, sessions" },
];

export default function Parametres() {
  return (
    <AppLayout title="Paramètres">
      <div className="max-w-2xl space-y-4">
        {sections.map((s) => (
          <div key={s.title} className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Configurer</Button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
