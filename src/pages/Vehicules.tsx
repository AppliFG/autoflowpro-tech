import AppLayout from "@/components/AppLayout";
import StatusBadge, { VehicleStatus } from "@/components/StatusBadge";
import { Plus, Search, Filter, Eye, ArrowLeft, Printer, Mail, X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

interface Travail {
  id: number;
  designation: string;
  cout: number;
}

interface Vehicle {
  id: number;
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
}

const mockVehicles: Vehicle[] = [
  { id: 1, immatriculation: "FG-123-AB", photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=80&h=60&fit=crop", marque: "Peugeot", modele: "3008 GT", annee: 2021, km: 45000, carburant: "Diesel", prixAchat: 18500, travaux: [{ id: 1, designation: "Distribution", cout: 850 }, { id: 2, designation: "Plaquettes AV", cout: 220 }, { id: 3, designation: "Nettoyage complet", cout: 150 }, { id: 4, designation: "Carte grise", cout: 280 }, { id: 5, designation: "Transport", cout: 200 }], coutRevient: 20200, prixVente: 24800, marge: 4600, status: "en_ligne", jours: 12, description: "Peugeot 3008 GT Line, full options, toit panoramique, GPS, caméra de recul, sièges chauffants. Véhicule en excellent état, entretien suivi en concession. CT OK, garantie 6 mois." },
  { id: 2, immatriculation: "EH-456-CD", photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=80&h=60&fit=crop", marque: "BMW", modele: "Série 3 320d", annee: 2020, km: 62000, carburant: "Diesel", prixAchat: 22000, travaux: [{ id: 1, designation: "Vidange + filtres", cout: 380 }, { id: 2, designation: "Pneus AV", cout: 420 }, { id: 3, designation: "CT", cout: 80 }, { id: 4, designation: "Carte grise", cout: 320 }, { id: 5, designation: "Nettoyage", cout: 150 }, { id: 6, designation: "Transport", cout: 450 }], coutRevient: 23800, prixVente: 27500, marge: 3700, status: "en_ligne", jours: 28, description: "BMW 320d Sport Line, boîte auto, GPS Pro, LED, régulateur adaptatif. Carnet d'entretien BMW complet. Première main." },
  { id: 3, immatriculation: "DJ-789-EF", photo: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=80&h=60&fit=crop", marque: "Renault", modele: "Captur", annee: 2022, km: 28000, carburant: "Essence", prixAchat: 14000, travaux: [{ id: 1, designation: "Pare-brise", cout: 650 }, { id: 2, designation: "Nettoyage", cout: 120 }, { id: 3, designation: "Carte grise", cout: 230 }, { id: 4, designation: "Transport", cout: 200 }], coutRevient: 15200, prixVente: 18900, marge: 3700, status: "depose", jours: 45, description: "Renault Captur Intens TCe 130, GPS, caméra, climatisation auto, aide au stationnement. Faible kilométrage." },
  { id: 4, immatriculation: "CK-012-GH", photo: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=80&h=60&fit=crop", marque: "Mercedes", modele: "Classe A 200", annee: 2021, km: 35000, carburant: "Essence", prixAchat: 24000, travaux: [{ id: 1, designation: "Plaquettes AV+AR", cout: 480 }, { id: 2, designation: "Nettoyage complet", cout: 180 }, { id: 3, designation: "CT", cout: 80 }, { id: 4, designation: "Carte grise", cout: 360 }, { id: 5, designation: "Transport", cout: 400 }], coutRevient: 25500, prixVente: 29900, marge: 4400, status: "reserve", jours: 8, description: "Mercedes Classe A 200 AMG Line, pack premium, MBUX, toit ouvrant, éclairage ambiance 64 couleurs. État irréprochable." },
  { id: 5, immatriculation: "BL-345-IJ", photo: "https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=80&h=60&fit=crop", marque: "Volkswagen", modele: "Golf 8", annee: 2022, km: 22000, carburant: "Essence", prixAchat: 19500, travaux: [{ id: 1, designation: "Vidange", cout: 180 }, { id: 2, designation: "Nettoyage", cout: 120 }, { id: 3, designation: "Carte grise", cout: 300 }, { id: 4, designation: "CT", cout: 80 }, { id: 5, designation: "Transport", cout: 620 }], coutRevient: 20800, prixVente: 24500, marge: 3700, status: "preparation", jours: 3, description: "Volkswagen Golf 8 Style 1.5 TSI 150, Digital Cockpit Pro, ACC, Lane Assist, App-Connect. Garantie constructeur." },
  { id: 6, immatriculation: "AM-678-KL", photo: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=80&h=60&fit=crop", marque: "Audi", modele: "A3 Sportback", annee: 2019, km: 78000, carburant: "Diesel", prixAchat: 16000, travaux: [{ id: 1, designation: "Embrayage", cout: 1200 }, { id: 2, designation: "Nettoyage", cout: 120 }, { id: 3, designation: "Carte grise", cout: 280 }, { id: 4, designation: "Transport", cout: 200 }], coutRevient: 17800, prixVente: 20500, marge: 2700, status: "en_ligne", jours: 65, description: "Audi A3 Sportback 35 TDI S-Tronic, Virtual Cockpit, MMI Navigation, sièges sport. Entretien Audi à jour." },
  { id: 7, immatriculation: "GN-901-MN", photo: "https://images.unsplash.com/photo-1621993202323-eb4e7a283458?w=80&h=60&fit=crop", marque: "Toyota", modele: "Yaris Cross", annee: 2023, km: 12000, carburant: "Hybride", prixAchat: 21000, travaux: [{ id: 1, designation: "Nettoyage complet", cout: 180 }, { id: 2, designation: "Carte grise", cout: 320 }, { id: 3, designation: "CT", cout: 80 }, { id: 4, designation: "Transport", cout: 420 }], coutRevient: 22000, prixVente: 25900, marge: 3900, status: "vendu", jours: 18, description: "Toyota Yaris Cross Hybride 116H Design, GPS, caméra, Toyota Safety Sense. Faible consommation." },
];

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

function FicheVehicule({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
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
    <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <img src={vehicle.photo.replace("w=80&h=60", "w=120&h=80")} alt="" className="h-12 w-16 object-cover rounded-lg" />
            <div>
              <h2 className="font-bold text-lg text-card-foreground">{vehicle.marque} {vehicle.modele}</h2>
              <p className="text-sm text-muted-foreground">{vehicle.immatriculation} · {vehicle.annee} · {vehicle.km.toLocaleString()} km</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={showPrices} onChange={(e) => setShowPrices(e.target.checked)} className="rounded" />
              Tarifs
            </label>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1.5" /> Imprimer
            </Button>
            <Button variant="outline" size="sm" onClick={() => alert("Fonctionnalité e-mail à venir avec Lovable Cloud")}>
              <Mail className="h-4 w-4 mr-1.5" /> Envoyer
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

  const filtered = mockVehicles.filter((v) =>
    `${v.immatriculation} ${v.marque} ${v.modele}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Véhicules">
      {selectedVehicle && <FicheVehicule vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />}

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
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> Ajouter
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
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
              <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
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
                  <button
                    onClick={() => setSelectedVehicle(v)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                    title="Voir fiche"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
