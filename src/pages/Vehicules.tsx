import AppLayout from "@/components/AppLayout";
import StatusBadge, { VehicleStatus } from "@/components/StatusBadge";
import { Plus, Search, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Vehicle {
  id: number;
  marque: string;
  modele: string;
  annee: number;
  km: number;
  carburant: string;
  prixAchat: number;
  coutRevient: number;
  prixVente: number;
  marge: number;
  status: VehicleStatus;
  jours: number;
}

const mockVehicles: Vehicle[] = [
  { id: 1, marque: "Peugeot", modele: "3008 GT", annee: 2021, km: 45000, carburant: "Diesel", prixAchat: 18500, coutRevient: 20200, prixVente: 24800, marge: 4600, status: "en_ligne", jours: 12 },
  { id: 2, marque: "BMW", modele: "Série 3 320d", annee: 2020, km: 62000, carburant: "Diesel", prixAchat: 22000, coutRevient: 23800, prixVente: 27500, marge: 3700, status: "en_ligne", jours: 28 },
  { id: 3, marque: "Renault", modele: "Captur", annee: 2022, km: 28000, carburant: "Essence", prixAchat: 14000, coutRevient: 15200, prixVente: 18900, marge: 3700, status: "depose", jours: 45 },
  { id: 4, marque: "Mercedes", modele: "Classe A 200", annee: 2021, km: 35000, carburant: "Essence", prixAchat: 24000, coutRevient: 25500, prixVente: 29900, marge: 4400, status: "reserve", jours: 8 },
  { id: 5, marque: "Volkswagen", modele: "Golf 8", annee: 2022, km: 22000, carburant: "Essence", prixAchat: 19500, coutRevient: 20800, prixVente: 24500, marge: 3700, status: "preparation", jours: 3 },
  { id: 6, marque: "Audi", modele: "A3 Sportback", annee: 2019, km: 78000, carburant: "Diesel", prixAchat: 16000, coutRevient: 17800, prixVente: 20500, marge: 2700, status: "en_ligne", jours: 65 },
  { id: 7, marque: "Toyota", modele: "Yaris Cross", annee: 2023, km: 12000, carburant: "Hybride", prixAchat: 21000, coutRevient: 22000, prixVente: 25900, marge: 3900, status: "vendu", jours: 18 },
];

function margeColor(marge: number) {
  if (marge > 2000) return "text-success font-semibold";
  if (marge >= 1500) return "text-warning font-semibold";
  return "text-destructive font-semibold";
}

function joursColor(jours: number) {
  if (jours > 60) return "text-destructive font-semibold";
  if (jours > 40) return "text-warning";
  return "text-muted-foreground";
}

export default function Vehicules() {
  const [search, setSearch] = useState("");
  const filtered = mockVehicles.filter((v) =>
    `${v.marque} ${v.modele}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Véhicules">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un véhicule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1.5" /> Filtrer
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> Ajouter
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Véhicule</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Km</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Carburant</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Coût revient</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Prix vente</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Marge</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Statut</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Jours</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-card-foreground">{v.marque} {v.modele}</p>
                    <p className="text-xs text-muted-foreground">{v.annee}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{v.km.toLocaleString()} km</td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{v.carburant}</td>
                <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{v.coutRevient.toLocaleString()} €</td>
                <td className="px-4 py-3 text-right font-medium text-card-foreground">{v.prixVente.toLocaleString()} €</td>
                <td className={`px-4 py-3 text-right ${margeColor(v.marge)}`}>{v.marge.toLocaleString()} €</td>
                <td className="px-4 py-3 text-center"><StatusBadge status={v.status} /></td>
                <td className={`px-4 py-3 text-center hidden lg:table-cell ${joursColor(v.jours)}`}>{v.jours}j</td>
                <td className="px-4 py-3">
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
