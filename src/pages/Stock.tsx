import AppLayout from "@/components/AppLayout";
import StatusBadge, { VehicleStatus } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";

interface StockVehicle {
  id: number;
  vehicule: string;
  prixVente: number;
  marge: number;
  jours: number;
  status: VehicleStatus;
}

const stock: StockVehicle[] = [
  { id: 1, vehicule: "Peugeot 3008 GT", prixVente: 24800, marge: 4600, jours: 12, status: "en_ligne" },
  { id: 2, vehicule: "BMW Série 3 320d", prixVente: 27500, marge: 3700, jours: 28, status: "en_ligne" },
  { id: 3, vehicule: "Renault Captur", prixVente: 18900, marge: 3700, jours: 45, status: "depose" },
  { id: 4, vehicule: "Mercedes Classe A", prixVente: 29900, marge: 4400, jours: 8, status: "reserve" },
  { id: 5, vehicule: "Volkswagen Golf 8", prixVente: 24500, marge: 3700, jours: 3, status: "preparation" },
  { id: 6, vehicule: "Audi A3 Sportback", prixVente: 20500, marge: 2700, jours: 65, status: "en_ligne" },
];

function margeIndicator(marge: number) {
  if (marge > 2000) return "bg-success";
  if (marge >= 1500) return "bg-warning";
  return "bg-destructive";
}

function joursIndicator(jours: number) {
  if (jours > 60) return "bg-destructive";
  if (jours > 40) return "bg-warning";
  return "bg-success";
}

export default function Stock() {
  return (
    <AppLayout title="Stock intelligent">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-success" /> Marge &gt; 2 000 €
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-warning" /> Marge &lt; 1 500 €
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive" /> &gt; 60 jours
          </div>
        </div>
        <Button size="sm"><Megaphone className="h-4 w-4 mr-1.5" /> Publier partout</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stock.map((v) => (
          <div key={v.id} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-card-foreground text-sm">{v.vehicule}</h3>
              <StatusBadge status={v.status} />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Prix</p>
                <p className="font-semibold text-card-foreground">{v.prixVente.toLocaleString()} €</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${margeIndicator(v.marge)}`} />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Marge</p>
                  <p className="font-semibold text-card-foreground">{v.marge.toLocaleString()} €</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${joursIndicator(v.jours)}`} />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">En stock</p>
                  <p className="font-semibold text-card-foreground">{v.jours}j</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
