import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, CheckCircle, XCircle, Send, Info, Import, Lock, Shield, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import ImportAnnonce from "@/components/ImportAnnonce";

const PLATFORM_DEFS = [
  { id: "leboncoin", name: "Leboncoin", color: "bg-orange-500" },
  { id: "autoscout24", name: "AutoScout24", color: "bg-yellow-500" },
  { id: "lacentrale", name: "LaCentrale", color: "bg-blue-500" },
];

export default function Diffusion() {
  const [showImport, setShowImport] = useState(false);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles-diffusion"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, registration, brand, model, selling_price, status, photo_url, police_number, year, mileage, fuel_type")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleImport = (data: any) => {
    // For now, just log; the imported data would be saved to vehicles table
    console.log("Imported vehicle:", data);
  };

  return (
    <AppLayout title="Multi-diffusion">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">Gérez vos plateformes et sélectionnez où publier chaque véhicule</p>
        <Button onClick={() => setShowImport(true)} size="sm">
          <Import className="h-4 w-4 mr-1.5" />Importer une annonce
        </Button>
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {PLATFORM_DEFS.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg ${p.color} flex items-center justify-center`}>
                  <Globe className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-semibold text-card-foreground">{p.name}</h3>
              </div>
              <XCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-3">Non connecté — configurez vos identifiants dans Paramètres → Fournisseurs.</p>
            <Button variant="outline" className="w-full" size="sm">Connecter</Button>
          </div>
        ))}
      </div>

      {/* Vehicle list */}
      {vehicles.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-semibold text-card-foreground text-sm">Véhicules en stock ({vehicles.length})</h3>
          {vehicles.map((v) => (
            <div key={v.id} className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              {v.photo_url ? (
                <img src={v.photo_url} alt="" className="h-24 w-full sm:h-16 sm:w-24 object-cover rounded-lg border border-border" />
              ) : (
                <div className="h-24 w-full sm:h-16 sm:w-24 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                  Pas de photo
                </div>
              )}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-card-foreground truncate">{v.brand} {v.model}</span>
                  <Badge variant={v.status === "En ligne" ? "default" : "secondary"} className="text-[9px]">{v.status}</Badge>
                  {v.police_number && (
                    <Badge variant="outline" className="text-[9px]">Police n°{v.police_number}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                  {v.year && <span>{v.year}</span>}
                  {v.mileage && <span>{v.mileage.toLocaleString()} km</span>}
                  {v.fuel_type && <span>{v.fuel_type}</span>}
                  <span className="flex items-center gap-0.5">
                    <Lock className="h-3 w-3" />VIN
                  </span>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
                <span className="font-bold text-card-foreground">{v.selling_price?.toLocaleString()} €</span>
                <div className="flex gap-1 sm:mt-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
          <Info className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold text-card-foreground mb-2">Aucun véhicule en stock</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Ajoutez des véhicules depuis la page Véhicules ou importez une annonce existante.
          </p>
        </div>
      )}

      {showImport && <ImportAnnonce onClose={() => setShowImport(false)} onImport={handleImport} />}
    </AppLayout>
  );
}
