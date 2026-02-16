import AppLayout from "@/components/AppLayout";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Prospect {
  id: number;
  nom: string;
  budget: string;
  vehicule: string;
  date: string;
}

interface Column {
  id: string;
  title: string;
  color: string;
  prospects: Prospect[];
}

const columns: Column[] = [
  {
    id: "nouveau",
    title: "Nouveau",
    color: "bg-info",
    prospects: [
      { id: 1, nom: "Martin Dupont", budget: "15 000 €", vehicule: "SUV compact", date: "14/02" },
      { id: 2, nom: "Sophie Lemaire", budget: "22 000 €", vehicule: "Berline diesel", date: "13/02" },
    ],
  },
  {
    id: "contacte",
    title: "Contacté",
    color: "bg-primary",
    prospects: [
      { id: 3, nom: "Pierre Moreau", budget: "18 000 €", vehicule: "Citadine hybride", date: "12/02" },
    ],
  },
  {
    id: "rdv",
    title: "RDV fixé",
    color: "bg-warning",
    prospects: [
      { id: 4, nom: "Julie Bernard", budget: "25 000 €", vehicule: "BMW Série 3", date: "15/02" },
      { id: 5, nom: "Marc Petit", budget: "12 000 €", vehicule: "Polo / Clio", date: "16/02" },
    ],
  },
  {
    id: "negociation",
    title: "Négociation",
    color: "bg-accent",
    prospects: [
      { id: 6, nom: "Emma Roux", budget: "30 000 €", vehicule: "Mercedes Classe A", date: "11/02" },
    ],
  },
  {
    id: "reserve",
    title: "Réservé",
    color: "bg-success",
    prospects: [
      { id: 7, nom: "Lucas Garcia", budget: "24 800 €", vehicule: "Peugeot 3008", date: "10/02" },
    ],
  },
  {
    id: "vendu",
    title: "Vendu",
    color: "bg-muted-foreground",
    prospects: [],
  },
];

export default function CRM() {
  return (
    <AppLayout title="CRM — Pipeline commercial">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{columns.reduce((s, c) => s + c.prospects.length, 0)} prospects actifs</p>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Nouveau prospect
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.id} className="min-w-[260px] w-[260px] flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <span className="ml-auto text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {col.prospects.length}
              </span>
            </div>
            <div className="space-y-2">
              {col.prospects.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <p className="text-sm font-medium text-card-foreground">{p.nom}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.vehicule}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-medium text-primary">{p.budget}</span>
                    <span className="text-[10px] text-muted-foreground">{p.date}</span>
                  </div>
                </div>
              ))}
              {col.prospects.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Aucun prospect
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
