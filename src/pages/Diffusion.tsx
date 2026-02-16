import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Globe, CheckCircle, XCircle, RefreshCw } from "lucide-react";

const platforms = [
  { name: "Leboncoin", connected: true, annonces: 18, vues: 2340, contacts: 45, color: "bg-info" },
  { name: "AutoScout24", connected: true, annonces: 15, vues: 1820, contacts: 32, color: "bg-success" },
  { name: "LaCentrale", connected: false, annonces: 0, vues: 0, contacts: 0, color: "bg-warning" },
];

export default function Diffusion() {
  return (
    <AppLayout title="Multi-diffusion">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">Gérez vos plateformes de diffusion</p>
        <Button size="sm"><RefreshCw className="h-4 w-4 mr-1.5" /> Synchroniser tout</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {platforms.map((p) => (
          <div key={p.name} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg ${p.color} flex items-center justify-center`}>
                  <Globe className="h-4 w-4 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-card-foreground">{p.name}</h3>
              </div>
              {p.connected ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            {p.connected ? (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-card-foreground">{p.annonces}</p>
                  <p className="text-[10px] text-muted-foreground">Annonces</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-card-foreground">{p.vues.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Vues</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-card-foreground">{p.contacts}</p>
                  <p className="text-[10px] text-muted-foreground">Contacts</p>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full" size="sm">Connecter</Button>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-semibold text-card-foreground mb-4">Publier des véhicules</h3>
        <p className="text-sm text-muted-foreground">Sélectionnez les véhicules depuis la page Stock et cliquez sur "Publier partout" pour diffuser automatiquement sur toutes les plateformes connectées.</p>
        <Button className="mt-4" size="sm">Aller au stock →</Button>
      </div>
    </AppLayout>
  );
}
