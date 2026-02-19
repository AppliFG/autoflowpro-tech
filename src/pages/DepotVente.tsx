import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import VehicleForm from "@/components/VehicleForm";

export default function DepotVente() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: depos = [], isLoading } = useQuery({
    queryKey: ["depot-vente-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("status", "Dépôt-vente")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <AppLayout title="Dépôt-vente">
      {showForm && (
        <VehicleForm
          initialData={{
            registration: "", brand: "", model: "", version: "", year: "", mileage: "",
            fuel_type: "Diesel", color: "", purchase_price: "", selling_price: "",
            status: "Dépôt-vente", description: "", photo_url: null,
          }}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["depot-vente-vehicles"] });
          }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{depos.length} mandats actifs</p>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Nouveau mandat
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : depos.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
          <Info className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold text-card-foreground mb-2">Aucun mandat de dépôt-vente</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Ajoutez un véhicule avec le statut "Dépôt-vente" pour le retrouver ici.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {depos.map((v) => (
            <div key={v.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-semibold text-card-foreground">{v.brand} {v.model}</h3>
              <p className="text-sm text-muted-foreground">{v.registration} · {Number(v.selling_price || 0).toLocaleString()} €</p>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
