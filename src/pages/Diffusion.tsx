import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Globe, CheckCircle, XCircle, RefreshCw, Send, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const PLATFORM_DEFS = [
  { id: "leboncoin", name: "Leboncoin", color: "bg-info" },
  { id: "autoscout", name: "AutoScout24", color: "bg-success" },
  { id: "lacentrale", name: "LaCentrale", color: "bg-warning" },
];

export default function Diffusion() {
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles-diffusion"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, registration, brand, model, selling_price, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <AppLayout title="Multi-diffusion">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">Gérez vos plateformes et sélectionnez où publier chaque véhicule</p>
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {PLATFORM_DEFS.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg ${p.color} flex items-center justify-center`}>
                  <Globe className="h-4 w-4 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-card-foreground">{p.name}</h3>
              </div>
              <XCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-3">Non connecté — configurez vos identifiants dans les paramètres.</p>
            <Button variant="outline" className="w-full" size="sm">Connecter</Button>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
        <Info className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-semibold text-card-foreground mb-2">Multi-diffusion non configurée</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Connectez vos comptes Leboncoin, AutoScout24 ou LaCentrale dans les paramètres pour activer la publication automatique de vos annonces.
        </p>
        {vehicles.length === 0 && (
          <p className="text-xs text-muted-foreground mt-3">Aucun véhicule en stock pour le moment.</p>
        )}
      </div>
    </AppLayout>
  );
}
