import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Send, MessageCircle, Plus, Check, Clock, FileText, Receipt, ChevronDown, ChevronUp, X } from "lucide-react";

type DevisStatus = "brouillon" | "envoye" | "devis_recu" | "accepte" | "facture";

const statusConfig: Record<DevisStatus, { label: string; color: string; icon: typeof Clock }> = {
  brouillon: { label: "Brouillon", color: "bg-muted text-muted-foreground", icon: FileText },
  envoye: { label: "Envoyé", color: "bg-info text-info-foreground", icon: Send },
  devis_recu: { label: "Devis reçu", color: "bg-warning text-warning-foreground", icon: Clock },
  accepte: { label: "Accepté", color: "bg-success text-success-foreground", icon: Check },
  facture: { label: "Facturé", color: "bg-primary text-primary-foreground", icon: Receipt },
};

const statusOrder: DevisStatus[] = ["brouillon", "envoye", "devis_recu", "accepte", "facture"];

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

interface DemandeDevis {
  id: number;
  vehicleImmat: string;
  vehicleLabel: string;
  fournisseur: string;
  pieces: string[];
  status: DevisStatus;
  dateCreation: string;
  montant?: number;
}

const mockFournisseurs = [
  { id: "1", nom: "AutoPieces 38", tel: "+33612345678", email: "commande@autopieces38.fr" },
  { id: "2", nom: "Garage Central Pièces", tel: "+33698765432", email: "devis@garagecentral.fr" },
];

const mockDemandes: DemandeDevis[] = [
  { id: 1, vehicleImmat: "FG-123-AB", vehicleLabel: "Peugeot 3008 GT", fournisseur: "AutoPieces 38", pieces: ["Kit distrib + PAE", "Courroie Acces", "Plaquettes AV", "Disques AV"], status: "accepte", dateCreation: "2026-02-10", montant: 680 },
  { id: 2, vehicleImmat: "EH-456-CD", vehicleLabel: "BMW Série 3 320d", fournisseur: "Garage Central Pièces", pieces: ["Filtre à air", "Filtre à huile", "Huile moteur"], status: "devis_recu", dateCreation: "2026-02-13", montant: 145 },
  { id: 3, vehicleImmat: "AM-678-KL", vehicleLabel: "Audi A3 Sportback", fournisseur: "AutoPieces 38", pieces: ["Kit embrayage", "Volant moteur"], status: "envoye", dateCreation: "2026-02-15" },
  { id: 4, vehicleImmat: "CK-012-GH", vehicleLabel: "Mercedes Classe A 200", fournisseur: "Garage Central Pièces", pieces: ["Plaquettes AV", "Plaquettes AR", "Disques AV", "Disque AR"], status: "facture", dateCreation: "2026-02-05", montant: 420 },
  { id: 5, vehicleImmat: "DJ-789-EF", vehicleLabel: "Renault Captur", fournisseur: "AutoPieces 38", pieces: ["Batterie", "Alternateur"], status: "brouillon", dateCreation: "2026-02-16" },
];

const vehiclesForDevis = [
  { immat: "FG-123-AB", label: "Peugeot 3008 GT" },
  { immat: "EH-456-CD", label: "BMW Série 3 320d" },
  { immat: "DJ-789-EF", label: "Renault Captur" },
  { immat: "CK-012-GH", label: "Mercedes Classe A 200" },
  { immat: "BL-345-IJ", label: "Volkswagen Golf 8" },
  { immat: "AM-678-KL", label: "Audi A3 Sportback" },
];

export default function Devis() {
  const [demandes, setDemandes] = useState(mockDemandes);
  const [showNew, setShowNew] = useState(false);
  const [newVehicle, setNewVehicle] = useState("");
  const [newFournisseur, setNewFournisseur] = useState(mockFournisseurs[0].id);
  const [selectedPieces, setSelectedPieces] = useState<string[]>([]);
  const [expandedCats, setExpandedCats] = useState<string[]>(Object.keys(PIECES_CATEGORIES));

  const togglePiece = (piece: string) => {
    setSelectedPieces((prev) => prev.includes(piece) ? prev.filter((p) => p !== piece) : [...prev, piece]);
  };

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };

  const createDemande = (sendVia: "email" | "whatsapp") => {
    const veh = vehiclesForDevis.find((v) => v.immat === newVehicle);
    const fourn = mockFournisseurs.find((f) => f.id === newFournisseur);
    if (!veh || !fourn || selectedPieces.length === 0) return;

    const newD: DemandeDevis = {
      id: Date.now(),
      vehicleImmat: veh.immat,
      vehicleLabel: veh.label,
      fournisseur: fourn.nom,
      pieces: [...selectedPieces],
      status: "envoye",
      dateCreation: new Date().toISOString().split("T")[0],
    };

    if (sendVia === "whatsapp") {
      const msg = encodeURIComponent(`Bonjour,\nDemande de devis pour ${veh.label} (${veh.immat}) :\n${selectedPieces.map((p) => `- ${p}`).join("\n")}\nMerci.`);
      window.open(`https://wa.me/${fourn.tel.replace("+", "")}?text=${msg}`, "_blank");
    } else {
      const subject = encodeURIComponent(`Demande de devis - ${veh.label} (${veh.immat})`);
      const body = encodeURIComponent(`Bonjour,\n\nDemande de devis pour ${veh.label} (${veh.immat}) :\n${selectedPieces.map((p) => `- ${p}`).join("\n")}\n\nCordialement.`);
      window.open(`mailto:${fourn.email}?subject=${subject}&body=${body}`, "_blank");
    }

    setDemandes((prev) => [newD, ...prev]);
    setShowNew(false);
    setSelectedPieces([]);
    setNewVehicle("");
  };

  const updateStatus = (id: number, newStatus: DevisStatus) => {
    setDemandes((prev) => prev.map((d) => d.id === id ? { ...d, status: newStatus } : d));
  };

  return (
    <AppLayout title="Demandes de devis">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">Gérez vos demandes de devis pièces auprès de vos fournisseurs</p>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Nouvelle demande
        </Button>
      </div>

      {/* New request form */}
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
                {vehiclesForDevis.map((v) => <option key={v.immat} value={v.immat}>{v.immat} — {v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Fournisseur</label>
              <select value={newFournisseur} onChange={(e) => setNewFournisseur(e.target.value)} className="w-full h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground">
                {mockFournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
          </div>

          {/* Pieces checklist */}
          <div className="border border-border rounded-lg overflow-hidden mb-4 max-h-[400px] overflow-y-auto">
            {Object.entries(PIECES_CATEGORIES).map(([cat, pieces]) => (
              <div key={cat}>
                <button
                  onClick={() => toggleCat(cat)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/70 text-sm font-semibold text-card-foreground hover:bg-muted transition-colors"
                >
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
                        <input
                          type="checkbox"
                          checked={selectedPieces.includes(piece)}
                          onChange={() => togglePiece(piece)}
                          className="rounded border-input"
                        />
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
                <Button size="sm" variant="outline" onClick={() => createDemande("whatsapp")} disabled={!newVehicle}>
                  <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp
                </Button>
                <Button size="sm" onClick={() => createDemande("email")} disabled={!newVehicle}>
                  <Send className="h-4 w-4 mr-1.5" /> Email
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gantt-style tracker */}
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
            {demandes.map((d) => {
              const currentIdx = statusOrder.indexOf(d.status);
              return (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-card-foreground">{d.vehicleLabel}</p>
                    <p className="text-xs font-mono text-muted-foreground">{d.vehicleImmat}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{d.fournisseur}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {d.pieces.slice(0, 3).map((p) => (
                        <span key={p} className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{p}</span>
                      ))}
                      {d.pieces.length > 3 && <span className="text-xs text-muted-foreground">+{d.pieces.length - 3}</span>}
                    </div>
                  </td>
                  {statusOrder.map((s, idx) => {
                    const isActive = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    return (
                      <td key={s} className="px-2 py-3 text-center">
                        <button
                          onClick={() => updateStatus(d.id, s)}
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
                    {d.montant ? `${d.montant.toLocaleString()} €` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
