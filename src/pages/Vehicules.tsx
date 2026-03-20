import AppLayout from "@/components/AppLayout";
import StatusBadge, { VehicleStatus } from "@/components/StatusBadge";
import VehicleForm from "@/components/VehicleForm";
import { Plus, Search, Filter, Eye, Pencil, ArrowLeft, Printer, Mail, X, FileText, Image as ImageIcon, Wrench, Receipt } from "lucide-react";
import VehicleWorksDialog from "@/components/VehicleWorksDialog";
import InvoiceDialog from "@/components/InvoiceDialog";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Travail {
  id: string;
  designation: string;
  cout: number;
}

interface Vehicle {
  id: string;
  policeNumber: number | null;
  immatriculation: string;
  photo: string;
  marque: string;
  modele: string;
  annee: number;
  km: number;
  carburant: string;
  prixAchat: number;
  travaux: Travail[];
  coutRevient: number;
  prixVente: number;
  marge: number;
  status: VehicleStatus;
  jours: number;
  description: string;
  photoUrls: string[];
}

const statusDbToUi: Record<string, VehicleStatus> = {
  "Attente de réception": "attente_reception",
  "En préparation": "preparation",
  "En ligne": "en_ligne",
  "Réservé": "reserve",
  "Vendu": "vendu",
  "Déposé": "depose",
  "En stock": "preparation",
};

function mapVehicle(v: any, works: any[]): Vehicle {
  const travaux: Travail[] = works
    .filter((w: any) => w.vehicle_id === v.id)
    .map((w: any) => ({ id: w.id, designation: w.designation, cout: Number(w.cost) }));
  const totalTravaux = travaux.reduce((s, t) => s + t.cout, 0);
  const prixAchat = Number(v.purchase_price) || 0;
  const prixVente = Number(v.selling_price) || 0;
  const coutRevient = prixAchat + totalTravaux;
  const jours = Math.floor((Date.now() - new Date(v.created_at).getTime()) / 86400000);

  return {
    id: v.id,
    policeNumber: v.police_number ?? null,
    immatriculation: v.registration,
    photo: v.photo_url || "/placeholder.svg",
    marque: v.brand,
    modele: v.model,
    annee: v.year || 0,
    km: v.mileage || 0,
    carburant: v.fuel_type || "",
    prixAchat,
    travaux,
    coutRevient,
    prixVente,
    marge: prixVente - coutRevient,
    status: statusDbToUi[v.status] || "preparation",
    jours,
    description: v.description || "",
  };
}

function margeColor(marge: number) {
  if (marge > 2000) return "text-success font-semibold";
  if (marge >= 1500) return "text-warning font-semibold";
  return "text-destructive font-semibold";
}

function joursColor(jours: number) {
  if (jours > 60) return "text-destructive font-semibold";
  if (jours > 40) return "text-warning";
  return "text-muted-foreground";
}

function FicheVehicule({ vehicle, onClose, onInvoice }: { vehicle: Vehicle; onClose: () => void; onInvoice: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);
  const [showPrices, setShowPrices] = useState(true);
  const [activeTab, setActiveTab] = useState<"travaux" | "descriptif">("travaux");

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Fiche travaux - ${vehicle.immatriculation}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        h2 { font-size: 14px; color: #666; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e5e5; font-size: 13px; }
        th { background: #f5f5f5; font-weight: 600; }
        .total { font-weight: 700; border-top: 2px solid #333; }
        .hide-price .prix { display: none; }
        .footer { margin-top: 40px; font-size: 11px; color: #999; }
      </style></head>
      <body class="${!showPrices ? "hide-price" : ""}">${printContents}
      <div class="footer">AutoFlow Pro — Document généré le ${new Date().toLocaleDateString("fr-FR")}</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const totalTravaux = vehicle.travaux.reduce((s, t) => s + t.cout, 0);

  return (
    <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-xl w-full sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors shrink-0">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <img src={vehicle.photo} alt="" className="h-10 w-14 sm:h-12 sm:w-16 object-cover rounded-lg shrink-0" />
            <div className="min-w-0">
              <h2 className="font-bold text-base sm:text-lg text-card-foreground truncate">{vehicle.marque} {vehicle.modele}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {vehicle.policeNumber ? <span className="font-semibold text-primary">N° {vehicle.policeNumber}</span> : null}
                {vehicle.policeNumber ? " · " : ""}{vehicle.immatriculation} · {vehicle.annee}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <label className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={showPrices} onChange={(e) => setShowPrices(e.target.checked)} className="rounded" />
              Tarifs
            </label>
            <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex">
              <Printer className="h-4 w-4 mr-1.5" /> Imprimer
            </Button>
            <Button size="sm" onClick={() => { onClose(); onInvoice(); }}>
              <Receipt className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Facturer</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("travaux")}
            className={`px-5 py-3 text-sm font-medium transition-colors ${activeTab === "travaux" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-card-foreground"}`}
          >
            <FileText className="h-4 w-4 inline mr-1.5" />Fiche travaux
          </button>
          <button
            onClick={() => setActiveTab("descriptif")}
            className={`px-5 py-3 text-sm font-medium transition-colors ${activeTab === "descriptif" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-card-foreground"}`}
          >
            <ImageIcon className="h-4 w-4 inline mr-1.5" />Descriptif annonce
          </button>
        </div>

        {activeTab === "travaux" && (
          <div ref={printRef} className="p-5">
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>Fiche de travaux</h1>
            <h2 style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
              {vehicle.marque} {vehicle.modele} — {vehicle.immatriculation} — {vehicle.annee} — {vehicle.km.toLocaleString()} km — {vehicle.carburant}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Prix d'achat</p>
                <p className="font-bold text-card-foreground">{vehicle.prixAchat.toLocaleString()} €</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center prix">
                <p className="text-xs text-muted-foreground">Total travaux</p>
                <p className="font-bold text-card-foreground">{totalTravaux.toLocaleString()} €</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center prix">
                <p className="text-xs text-muted-foreground">Coût de revient</p>
                <p className="font-bold text-card-foreground">{vehicle.coutRevient.toLocaleString()} €</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center prix">
                <p className="text-xs text-muted-foreground">Marge</p>
                <p className={`font-bold ${margeColor(vehicle.marge)}`}>{vehicle.marge.toLocaleString()} €</p>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Désignation</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground prix">Coût</th>
                </tr>
              </thead>
              <tbody>
                {vehicle.travaux.map((t, i) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2.5 text-card-foreground">{t.designation}</td>
                    <td className="px-4 py-2.5 text-right text-card-foreground prix">{t.cout.toLocaleString()} €</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-foreground/20 font-bold">
                  <td className="px-4 py-2.5" colSpan={2}>Total</td>
                  <td className="px-4 py-2.5 text-right prix">{totalTravaux.toLocaleString()} €</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "descriptif" && (
          <div className="p-5">
            <h3 className="font-semibold text-card-foreground mb-3">Descriptif de l'annonce</h3>
            <p className="text-sm text-muted-foreground mb-2">Ce texte sera utilisé pour les annonces sur les plateformes de diffusion.</p>
            <Textarea
              defaultValue={vehicle.description}
              rows={6}
              className="mb-4"
              placeholder="Décrivez le véhicule pour l'annonce..."
            />
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Aperçu annonce</p>
              <h4 className="font-bold text-card-foreground">{vehicle.marque} {vehicle.modele} / {vehicle.annee} / {vehicle.km.toLocaleString()} km / {vehicle.carburant}</h4>
              <p className="text-primary font-bold text-lg">{vehicle.prixVente.toLocaleString()} €</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{vehicle.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Vehicules() {
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState<any>(null);
  const [worksVehicle, setWorksVehicle] = useState<Vehicle | null>(null);
  const [invoiceVehicle, setInvoiceVehicle] = useState<Vehicle | null>(null);
  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles-with-works"],
    queryFn: async () => {
      const [{ data: vData, error: vErr }, { data: wData, error: wErr }] = await Promise.all([
        supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
        supabase.from("vehicle_works").select("*"),
      ]);
      if (vErr) throw vErr;
      if (wErr) throw wErr;
      return (vData || []).map((v) => mapVehicle(v, wData || []));
    },
  });

  const filtered = vehicles.filter((v) =>
    `${v.immatriculation} ${v.marque} ${v.modele}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Véhicules">
      {selectedVehicle && <FicheVehicule vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} onInvoice={() => setInvoiceVehicle(selectedVehicle)} />}
      {worksVehicle && (
        <VehicleWorksDialog
          vehicleId={worksVehicle.id}
          registration={worksVehicle.immatriculation}
          brand={worksVehicle.marque}
          model={worksVehicle.modele}
          year={worksVehicle.annee}
          mileage={worksVehicle.km}
          fuelType={worksVehicle.carburant}
          open={!!worksVehicle}
          onOpenChange={(o) => { if (!o) setWorksVehicle(null); }}
        />
      )}
      {showForm && (
        <VehicleForm
          initialData={editVehicle}
          onClose={() => { setShowForm(false); setEditVehicle(null); }}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["vehicles-with-works"] })}
        />
      )}
      {invoiceVehicle && (
        <InvoiceDialog
          open={!!invoiceVehicle}
          onOpenChange={(o) => { if (!o) setInvoiceVehicle(null); }}
          vehicleId={invoiceVehicle.id}
          vehicleLabel={`${invoiceVehicle.marque} ${invoiceVehicle.modele} — ${invoiceVehicle.immatriculation}`}
        />
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par immat, marque..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1.5" /> Filtrer
          </Button>
          <Button size="sm" onClick={() => { setEditVehicle(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Ajouter
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Aucun véhicule trouvé</div>
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="sm:hidden space-y-3">
            {filtered.map((v) => (
              <div key={v.id} className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3" onClick={() => setSelectedVehicle(v)}>
                <div className="flex items-start gap-3">
                  <img src={v.photo} alt="" className="h-14 w-20 object-cover rounded-lg bg-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-card-foreground truncate">{v.marque} {v.modele}</p>
                      <StatusBadge status={v.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {v.policeNumber ? <span className="font-semibold text-primary">N°{v.policeNumber} · </span> : ""}{v.immatriculation} · {v.annee}
                    </p>
                    <p className="text-xs text-muted-foreground">{v.km.toLocaleString()} km · {v.carburant}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg py-1.5">
                    <p className="text-[10px] text-muted-foreground">Achat</p>
                    <p className="text-xs font-semibold text-card-foreground">{v.prixAchat.toLocaleString()} €</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg py-1.5">
                    <p className="text-[10px] text-muted-foreground">Vente</p>
                    <p className="text-xs font-semibold text-card-foreground">{v.prixVente.toLocaleString()} €</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg py-1.5">
                    <p className="text-[10px] text-muted-foreground">Marge</p>
                    <p className={`text-xs font-semibold ${margeColor(v.marge)}`}>{v.marge.toLocaleString()} €</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border" onClick={(e) => e.stopPropagation()}>
                  <span className={`text-xs ${joursColor(v.jours)}`}>{v.jours}j en stock</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditVehicle({ id: v.id, police_number: v.policeNumber ?? "", registration: v.immatriculation, brand: v.marque, model: v.modele, version: "", year: v.annee || "", mileage: v.km || "", fuel_type: v.carburant || "Diesel", color: "", purchase_price: v.prixAchat || "", selling_price: v.prixVente || "", status: Object.entries(statusDbToUi).find(([, ui]) => ui === v.status)?.[0] || "En préparation", description: v.description, photo_url: v.photo === "/placeholder.svg" ? null : v.photo, photo_urls: (v as any).photoUrls || [] }); setShowForm(true); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setWorksVehicle(v)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><Wrench className="h-4 w-4" /></button>
                    <button onClick={() => setInvoiceVehicle(v)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><Receipt className="h-4 w-4" /></button>
                    <button onClick={() => setSelectedVehicle(v)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><Eye className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">N° Police</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Immat.</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Photo</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Véhicule</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Km</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Carburant</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Prix achat</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Coût revient</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Prix vente</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Marge</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Statut</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Jours</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedVehicle(v)}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{v.policeNumber ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-card-foreground">{v.immatriculation}</td>
                    <td className="px-4 py-2">
                      <img src={v.photo} alt="" className="h-10 w-14 object-cover rounded-md bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-card-foreground">{v.marque} {v.modele}</p>
                        <p className="text-xs text-muted-foreground">{v.annee}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{v.km.toLocaleString()} km</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{v.carburant}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{v.prixAchat.toLocaleString()} €</td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{v.coutRevient.toLocaleString()} €</td>
                    <td className="px-4 py-3 text-right font-medium text-card-foreground">{v.prixVente.toLocaleString()} €</td>
                    <td className={`px-4 py-3 text-right ${margeColor(v.marge)}`}>{v.marge.toLocaleString()} €</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={v.status} /></td>
                    <td className={`px-4 py-3 text-center hidden lg:table-cell ${joursColor(v.jours)}`}>{v.jours}j</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setEditVehicle({ id: v.id, police_number: v.policeNumber ?? "", registration: v.immatriculation, brand: v.marque, model: v.modele, version: "", year: v.annee || "", mileage: v.km || "", fuel_type: v.carburant || "Diesel", color: "", purchase_price: v.prixAchat || "", selling_price: v.prixVente || "", status: Object.entries(statusDbToUi).find(([, ui]) => ui === v.status)?.[0] || "En préparation", description: v.description, photo_url: v.photo === "/placeholder.svg" ? null : v.photo, photo_urls: (v as any).photoUrls || [] }); setShowForm(true); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors" title="Modifier"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setWorksVehicle(v)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors" title="Travaux"><Wrench className="h-4 w-4" /></button>
                        <button onClick={() => setInvoiceVehicle(v)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors" title="Générer facture"><Receipt className="h-4 w-4" /></button>
                        <button onClick={() => setSelectedVehicle(v)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors" title="Voir fiche"><Eye className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppLayout>
  );
}
