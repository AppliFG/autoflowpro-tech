import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Printer, Mail, Wrench } from "lucide-react";

interface VehicleWorksDialogProps {
  vehicleId: string;
  registration: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WorkRow {
  id: string;
  designation: string;
  cost: number;
  client_visible: boolean;
  intervention_date: string | null;
  intervention_km: number | null;
}

export default function VehicleWorksDialog({
  vehicleId, registration, brand, model, year, mileage, fuelType,
  open, onOpenChange,
}: VehicleWorksDialogProps) {
  const queryClient = useQueryClient();
  const [newDesignation, setNewDesignation] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newKm, setNewKm] = useState("");
  const [newVisible, setNewVisible] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: works = [], isLoading } = useQuery({
    queryKey: ["vehicle-works", vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_works")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((w: any) => ({
        id: w.id,
        designation: w.designation,
        cost: Number(w.cost),
        client_visible: w.client_visible ?? true,
        intervention_date: w.intervention_date,
        intervention_km: w.intervention_km,
      })) as WorkRow[];
    },
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vehicle_works").insert({
        vehicle_id: vehicleId,
        designation: newDesignation.trim(),
        cost: parseFloat(newCost) || 0,
        client_visible: newVisible,
        intervention_date: newDate || null,
        intervention_km: newKm ? parseInt(newKm) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-works", vehicleId] });
      queryClient.invalidateQueries({ queryKey: ["vehicles-with-works"] });
      setNewDesignation("");
      setNewCost("");
      setNewDate("");
      setNewKm("");
      setNewVisible(true);
      toast.success("Travail ajouté");
    },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const { error } = await supabase.from("vehicle_works").update({ client_visible: visible }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-works", vehicleId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicle_works").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-works", vehicleId] });
      queryClient.invalidateQueries({ queryKey: ["vehicles-with-works"] });
      toast.success("Travail supprimé");
    },
  });

  const totalAll = works.reduce((s, w) => s + w.cost, 0);
  const visibleWorks = works.filter((w) => w.client_visible);

  const handlePrint = () => {
    if (!printRef.current) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Fiche entretien - ${registration}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .subtitle { font-size: 13px; color: #666; margin-bottom: 24px; }
        .info-box { display: flex; gap: 24px; margin-bottom: 20px; padding: 12px; background: #f5f5f5; border-radius: 8px; font-size: 13px; }
        .info-box span { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e5e5; font-size: 13px; }
        th { background: #f5f5f5; font-weight: 600; }
        .footer { margin-top: 40px; font-size: 11px; color: #999; }
      </style></head>
      <body>${printRef.current.innerHTML}
      <div class="footer">AutoFlow Pro — Fiche entretien générée le ${new Date().toLocaleDateString("fr-FR")}</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  if (showPreview) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Aperçu fiche entretien
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1.5" /> Imprimer
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("Envoi par e-mail à venir")}>
              <Mail className="h-4 w-4 mr-1.5" /> Envoyer par mail
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} className="ml-auto">
              Retour
            </Button>
          </div>

          <div ref={printRef} className="border border-border rounded-lg p-6 bg-background">
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Fiche d'entretien véhicule</h1>
            <p className="subtitle" style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
              {brand} {model} — {year}
            </p>

            <div className="info-box" style={{ display: "flex", gap: 24, marginBottom: 20, padding: 12, background: "#f5f5f5", borderRadius: 8, fontSize: 13 }}>
              <div>Immatriculation : <span style={{ fontWeight: 600 }}>{registration}</span></div>
              <div>Kilométrage : <span style={{ fontWeight: 600 }}>{mileage?.toLocaleString()} km</span></div>
              <div>Carburant : <span style={{ fontWeight: 600 }}>{fuelType}</span></div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #e5e5e5", fontSize: 13, fontWeight: 600 }}>Date</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #e5e5e5", fontSize: 13, fontWeight: 600 }}>Km</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #e5e5e5", fontSize: 13, fontWeight: 600 }}>Intervention</th>
                </tr>
              </thead>
              <tbody>
                {visibleWorks.map((w) => (
                  <tr key={w.id}>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e5e5", fontSize: 13 }}>
                      {w.intervention_date ? new Date(w.intervention_date).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e5e5", fontSize: 13 }}>
                      {w.intervention_km ? `${w.intervention_km.toLocaleString()} km` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e5e5", fontSize: 13 }}>
                      {w.designation}
                    </td>
                  </tr>
                ))}
                {visibleWorks.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: "10px 12px", fontSize: 13, textAlign: "center", color: "#999" }}>
                      Aucune intervention sélectionnée pour le client
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Travaux — {registration}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{brand} {model} · {year} · {mileage?.toLocaleString()} km</p>
        </DialogHeader>

        {/* Add new work */}
        <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-3">
          <p className="text-sm font-medium text-card-foreground">Ajouter un travail</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Input
              placeholder="Désignation"
              value={newDesignation}
              onChange={(e) => setNewDesignation(e.target.value)}
              className="col-span-2 sm:col-span-2"
            />
            <Input
              type="number"
              placeholder="Coût €"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
            />
            <Input
              type="date"
              placeholder="Date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Km"
              value={newKm}
              onChange={(e) => setNewKm(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <Checkbox checked={newVisible} onCheckedChange={(v) => setNewVisible(!!v)} />
              Visible sur fiche entretien client
            </label>
            <Button
              size="sm"
              disabled={!newDesignation.trim() || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </div>
        </div>

        {/* Works list */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-4">Chargement...</p>
        ) : works.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Aucun travail enregistré</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Client</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Désignation</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Coût</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Km</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {works.map((w) => (
                  <tr key={w.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={w.client_visible}
                        onCheckedChange={(v) => toggleVisibility.mutate({ id: w.id, visible: !!v })}
                      />
                    </td>
                    <td className="px-3 py-2 text-card-foreground">{w.designation}</td>
                    <td className="px-3 py-2 text-right text-card-foreground">{w.cost.toLocaleString()} €</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {w.intervention_date ? new Date(w.intervention_date).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {w.intervention_km ? `${w.intervention_km.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => deleteMutation.mutate(w.id)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-semibold">
                  <td className="px-3 py-2" colSpan={2}>Total</td>
                  <td className="px-3 py-2 text-right">{totalAll.toLocaleString()} €</td>
                  <td colSpan={3}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} disabled={works.length === 0}>
            <Printer className="h-4 w-4 mr-1.5" /> Aperçu fiche entretien
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
