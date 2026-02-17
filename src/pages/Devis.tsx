import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Send, MessageCircle, Plus, Check, Clock, FileText, Receipt, ChevronDown, ChevronUp, X, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type DevisStatus = "Brouillon" | "Envoyé" | "Devis reçu" | "Accepté" | "Facturé";

const statusConfig: Record<DevisStatus, { label: string; color: string; icon: typeof Clock }> = {
  "Brouillon": { label: "Brouillon", color: "bg-muted text-muted-foreground", icon: FileText },
  "Envoyé": { label: "Envoyé", color: "bg-info text-info-foreground", icon: Send },
  "Devis reçu": { label: "Devis reçu", color: "bg-warning text-warning-foreground", icon: Clock },
  "Accepté": { label: "Accepté", color: "bg-success text-success-foreground", icon: Check },
  "Facturé": { label: "Facturé", color: "bg-primary text-primary-foreground", icon: Receipt },
};

const statusOrder: DevisStatus[] = ["Brouillon", "Envoyé", "Devis reçu", "Accepté", "Facturé"];

const PIECES_CATEGORIES = {
  "Vidange / Filtration": ["Filtre à air", "Filtre à huile", "Filtre à carburant", "Filtre habitacle", "Huile moteur", "Bougies", "Huile de boite", "Filtre de boite"],
  "Distribution": ["Kit distrib + PAE", "Courroie Acces", "Liquide refroidissement", "Kit Accessoire"],
  "Freinage": ["Plaquettes AV", "Disques AV", "Plaquettes AR", "Disque AR", "Témoin", "Etrier"],
  "Embrayage": ["Kit embrayage", "Volant moteur", "Huile de boite", "Filtre de Boite", "Joint Spi"],
  "Direction": ["Rotule direction AVD", "Rotule direction AVG", "Rotule axiale AVD", "Rotule axiale AVG", "Colonne"],
  "Allumage": ["Bougies", "Batterie", "Bobine", "Alternateur", "Démarreur"],
  "Suspension / Transmission": ["Barre Stab AVD", "Barre Stab AVG", "Cardan AVD", "Cardan AVG", "Soufflet", "Amortisseur AV", "Amortisseur AR", "Coupelles AV", "Butées", "Triangle AVD", "Triangle AVG"],
  "Divers": ["Injecteur", "Turbo", "Joint cache culbuteur", "Joint de culasse", "Vanne EGR", "Attelage"],
};

export default function Devis() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [newVehicle, setNewVehicle] = useState("");
  const [newFournisseur, setNewFournisseur] = useState("");
  const [selectedPieces, setSelectedPieces] = useState<string[]>([]);
  const [expandedCats, setExpandedCats] = useState<string[]>(Object.keys(PIECES_CATEGORIES));
  const [searchPiece, setSearchPiece] = useState("");
  const [customArticle, setCustomArticle] = useState("");

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("id, registration, brand, model").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes-with-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, quote_items(*), suppliers(*), vehicles(registration, brand, model)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ vehicleId, supplierId, pieces, sendVia }: { vehicleId: string; supplierId: string; pieces: string[]; sendVia: "email" | "whatsapp" }) => {
      const { data: quote, error: qErr } = await supabase
        .from("quotes")
        .insert({ vehicle_id: vehicleId, supplier_id: supplierId, status: "Envoyé" })
        .select()
        .single();
      if (qErr) throw qErr;

      const items = pieces.map((p) => ({ quote_id: quote.id, article_name: p }));
      const { error: iErr } = await supabase.from("quote_items").insert(items);
      if (iErr) throw iErr;

      return { quote, sendVia };
    },
    onSuccess: ({ sendVia }) => {
      queryClient.invalidateQueries({ queryKey: ["quotes-with-items"] });
      const veh = vehicles.find((v) => v.id === newVehicle);
      const sup = suppliers.find((s) => s.id === newFournisseur);
      if (veh && sup) {
        const msg = `Bonjour,\nDemande de devis pour ${veh.brand} ${veh.model} (${veh.registration}) :\n${selectedPieces.map((p) => `- ${p}`).join("\n")}\nMerci.`;
        if (sendVia === "whatsapp" && sup.whatsapp) {
          window.open(`https://wa.me/${sup.whatsapp.replace("+", "")}?text=${encodeURIComponent(msg)}`, "_blank");
        } else if (sup.email) {
          const subject = encodeURIComponent(`Demande de devis - ${veh.brand} ${veh.model} (${veh.registration})`);
          window.open(`mailto:${sup.email}?subject=${subject}&body=${encodeURIComponent(msg)}`, "_blank");
        }
      }
      setShowNew(false);
      setSelectedPieces([]);
      setNewVehicle("");
      toast.success("Demande de devis créée");
    },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotes-with-items"] }),
  });

  const filteredCategories: Record<string, string[]> = searchPiece.trim()
    ? Object.fromEntries(
        Object.entries(PIECES_CATEGORIES)
          .map(([cat, pieces]) => [cat, pieces.filter((p) => p.toLowerCase().includes(searchPiece.toLowerCase()))])
          .filter(([, pieces]) => (pieces as string[]).length > 0)
      )
    : PIECES_CATEGORIES;

  const addCustomArticle = () => {
    const trimmed = customArticle.trim();
    if (trimmed && !selectedPieces.includes(trimmed)) {
      setSelectedPieces((prev) => [...prev, trimmed]);
      setCustomArticle("");
    }
  };

  const togglePiece = (piece: string) => {
    setSelectedPieces((prev) => prev.includes(piece) ? prev.filter((p) => p !== piece) : [...prev, piece]);
  };

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };

  const createDemande = (sendVia: "email" | "whatsapp") => {
    if (!newVehicle || !newFournisseur || selectedPieces.length === 0) return;
    createMutation.mutate({ vehicleId: newVehicle, supplierId: newFournisseur, pieces: selectedPieces, sendVia });
  };

  return (
    <AppLayout title="Demandes de devis">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">Gérez vos demandes de devis pièces auprès de vos fournisseurs</p>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Nouvelle demande
        </Button>
      </div>

      {showNew && (
        <div className="rounded-xl border border-border bg-card shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-card-foreground">Nouvelle demande de devis</h3>
            <button onClick={() => setShowNew(false)} className="p-1 hover:bg-muted rounded-md"><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Véhicule</label>
              <select value={newVehicle} onChange={(e) => setNewVehicle(e.target.value)} className="w-full h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground">
                <option value="">Sélectionner...</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration} — {v.brand} {v.model}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Fournisseur</label>
              <select value={newFournisseur} onChange={(e) => setNewFournisseur(e.target.value)} className="w-full h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground">
                <option value="">Sélectionner...</option>
                {suppliers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Rechercher un article..." value={searchPiece} onChange={(e) => setSearchPiece(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="flex gap-2 mb-3">
            <input type="text" placeholder="Ajouter un article personnalisé..." value={customArticle} onChange={(e) => setCustomArticle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomArticle()}
              className="flex-1 h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <Button size="sm" variant="outline" onClick={addCustomArticle} disabled={!customArticle.trim()}><Plus className="h-4 w-4" /></Button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden mb-4 max-h-[400px] overflow-y-auto">
            {Object.entries(filteredCategories).map(([cat, pieces]) => (
              <div key={cat}>
                <button onClick={() => toggleCat(cat)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/70 text-sm font-semibold text-card-foreground hover:bg-muted transition-colors">
                  <span>{cat}</span>
                  <div className="flex items-center gap-2">
                    {selectedPieces.filter((p) => pieces.includes(p)).length > 0 && (
                      <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                        {selectedPieces.filter((p) => pieces.includes(p)).length}
                      </span>
                    )}
                    {expandedCats.includes(cat) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>
                {expandedCats.includes(cat) && (
                  <div className="divide-y divide-border">
                    {pieces.map((piece) => (
                      <label key={piece} className="flex items-center gap-3 px-4 py-2 hover:bg-muted/30 cursor-pointer text-sm">
                        <input type="checkbox" checked={selectedPieces.includes(piece)} onChange={() => togglePiece(piece)} className="rounded border-input" />
                        <span className="text-card-foreground">{piece}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedPieces.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{selectedPieces.length} pièce(s) sélectionnée(s)</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => createDemande("whatsapp")} disabled={!newVehicle || !newFournisseur}>
                  <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp
                </Button>
                <Button size="sm" onClick={() => createDemande("email")} disabled={!newVehicle || !newFournisseur}>
                  <Send className="h-4 w-4 mr-1.5" /> Email
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-card-foreground">Suivi des demandes</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Véhicule</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Fournisseur</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Pièces</th>
                {statusOrder.map((s) => (
                  <th key={s} className="text-center px-2 py-3 font-medium text-muted-foreground text-xs">
                    {statusConfig[s].label}
                  </th>
                ))}
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Montant</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Aucune demande de devis</td></tr>
              ) : quotes.map((d: any) => {
                const currentIdx = statusOrder.indexOf(d.status as DevisStatus);
                const items = d.quote_items || [];
                return (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-card-foreground">{d.vehicles?.brand} {d.vehicles?.model}</p>
                      <p className="text-xs font-mono text-muted-foreground">{d.vehicles?.registration}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{d.suppliers?.name || "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {items.slice(0, 3).map((p: any) => (
                          <span key={p.id} className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{p.article_name}</span>
                        ))}
                        {items.length > 3 && <span className="text-xs text-muted-foreground">+{items.length - 3}</span>}
                      </div>
                    </td>
                    {statusOrder.map((s, idx) => {
                      const isActive = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <td key={s} className="px-2 py-3 text-center">
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: d.id, status: s })}
                            className={`h-7 w-7 rounded-full inline-flex items-center justify-center transition-all ${
                              isCurrent
                                ? statusConfig[s].color + " ring-2 ring-offset-2 ring-offset-card"
                                : isActive
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground/40"
                            }`}
                            title={statusConfig[s].label}
                          >
                            {isActive && <Check className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right font-medium text-card-foreground hidden sm:table-cell">
                      {d.total_amount ? `${Number(d.total_amount).toLocaleString()} €` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
