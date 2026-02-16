import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Users, Car, TrendingUp } from "lucide-react";

const agences = [
  { id: 1, nom: "AutoFlow Paris", adresse: "12 rue de la Paix, 75002 Paris", users: 5, vehicules: 18, ca: "45 000 €" },
  { id: 2, nom: "AutoFlow Lyon", adresse: "8 place Bellecour, 69002 Lyon", users: 3, vehicules: 12, ca: "32 000 €" },
  { id: 3, nom: "AutoFlow Marseille", adresse: "45 La Canebière, 13001 Marseille", users: 2, vehicules: 8, ca: "21 000 €" },
];

export default function Agences() {
  return (
    <AppLayout title="Gestion multi-agences">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{agences.length} agences actives</p>
        <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Nouvelle agence</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agences.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">{a.nom}</h3>
                <p className="text-xs text-muted-foreground">{a.adresse}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <Users className="h-3.5 w-3.5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-bold text-card-foreground">{a.users}</p>
                <p className="text-[10px] text-muted-foreground">Users</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <Car className="h-3.5 w-3.5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-bold text-card-foreground">{a.vehicules}</p>
                <p className="text-[10px] text-muted-foreground">Véhicules</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <TrendingUp className="h-3.5 w-3.5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-bold text-card-foreground">{a.ca}</p>
                <p className="text-[10px] text-muted-foreground">CA</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
