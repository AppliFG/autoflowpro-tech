import AppLayout from "@/components/AppLayout";
import KpiCard from "@/components/KpiCard";
import { Euro, TrendingDown, TrendingUp, Wallet, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function Finance() {
  const { data: stats } = useQuery({
    queryKey: ["finance-stats"],
    queryFn: async () => {
      const { data: vehicles } = await supabase.from("vehicles").select("selling_price, purchase_price, status");
      if (!vehicles) return { ca: 0, marge: 0, depenses: 0, tresorerie: 0 };

      const vendus = vehicles.filter((v) => v.status === "Vendu");
      const ca = vendus.reduce((s, v) => s + (Number(v.selling_price) || 0), 0);
      const coutVendus = vendus.reduce((s, v) => s + (Number(v.purchase_price) || 0), 0);
      const marge = ca - coutVendus;

      return { ca, marge, depenses: 0, tresorerie: marge };
    },
  });

  const s = stats || { ca: 0, marge: 0, depenses: 0, tresorerie: 0 };

  return (
    <AppLayout title="Finance & Gestion">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="CA Mensuel" value={`${s.ca.toLocaleString("fr-FR")} €`} icon={<Euro className="h-5 w-5" />} />
        <KpiCard title="Marge nette" value={`${s.marge.toLocaleString("fr-FR")} €`} icon={<TrendingUp className="h-5 w-5" />} variant={s.marge > 0 ? "success" : "default"} />
        <KpiCard title="Dépenses" value={`${s.depenses.toLocaleString("fr-FR")} €`} icon={<TrendingDown className="h-5 w-5" />} />
        <KpiCard title="Trésorerie" value={`${s.tresorerie.toLocaleString("fr-FR")} €`} icon={<Wallet className="h-5 w-5" />} />
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
        <Info className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-semibold text-card-foreground mb-2">Module financier simplifié</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Les KPIs ci-dessus sont calculés dynamiquement à partir des véhicules vendus. La gestion avancée des factures et dépenses sera disponible prochainement.
        </p>
      </div>
    </AppLayout>
  );
}
