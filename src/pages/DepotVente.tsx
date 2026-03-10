import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, Info, Tag } from "lucide-react";
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
        <p className="text-sm text-muted-foreground">{depos.length} mandat{depos.length !== 1 ? "s" : ""} actif{depos.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> <span className="hidden sm:inline">Nouveau mandat</span><span className="sm:hidden">Ajouter</span>
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
        <div className="grid gap-3 sm:gap-4">
          {depos.map((v) => (
            <div key={v.id} className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-card-foreground text-sm sm:text-base truncate">{v.brand} {v.model}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{v.registration}</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-primary shrink-0">
                  <Tag className="h-3.5 w-3.5" />
                  {Number(v.selling_price || 0).toLocaleString()} €
                </div>
              </div>
              {(v.year || v.mileage || v.fuel_type) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  {v.year && <span>{v.year}</span>}
                  {v.mileage && <span>{Number(v.mileage).toLocaleString()} km</span>}
                  {v.fuel_type && <span>{v.fuel_type}</span>}
                  {v.color && <span>{v.color}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
