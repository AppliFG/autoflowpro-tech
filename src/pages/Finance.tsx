import AppLayout from "@/components/AppLayout";
import KpiCard from "@/components/KpiCard";
import { Euro, TrendingDown, TrendingUp, Wallet, Receipt, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const depenses = [
  { id: 1, libelle: "Transport véhicule BMW", categorie: "Transport", montant: 350, date: "12/02/2026", fournisseur: "TransAuto" },
  { id: 2, libelle: "CT Peugeot 3008", categorie: "Contrôle technique", montant: 85, date: "10/02/2026", fournisseur: "Dekra" },
  { id: 3, libelle: "Réparations Renault Captur", categorie: "Réparations", montant: 1200, date: "08/02/2026", fournisseur: "Garage Martin" },
  { id: 4, libelle: "Nettoyage x3 véhicules", categorie: "Nettoyage", montant: 180, date: "05/02/2026", fournisseur: "CleanAuto" },
];

export default function Finance() {
  return (
    <AppLayout title="Finance & Gestion">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="CA Mensuel" value="68 000 €" icon={<Euro className="h-5 w-5" />} trend={{ value: 12, positive: true }} />
        <KpiCard title="Marge nette" value="19 500 €" icon={<TrendingUp className="h-5 w-5" />} variant="success" />
        <KpiCard title="Dépenses" value="4 850 €" icon={<TrendingDown className="h-5 w-5" />} variant="warning" />
        <KpiCard title="Trésorerie" value="42 300 €" icon={<Wallet className="h-5 w-5" />} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Dernières dépenses</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-1.5" /> Export</Button>
          <Button size="sm"><Receipt className="h-4 w-4 mr-1.5" /> Nouvelle facture</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Libellé</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Catégorie</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Fournisseur</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Montant</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {depenses.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-card-foreground font-medium">{d.libelle}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{d.categorie}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{d.fournisseur}</td>
                <td className="px-4 py-3 text-right text-destructive font-semibold">-{d.montant} €</td>
                <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{d.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
