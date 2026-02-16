import { Car, MapPin, Calendar, Gauge, Fuel, Phone, Mail } from "lucide-react";
import { useState } from "react";

const vehiclesShowcase = [
  {
    id: 1, immat: "FG-123-AB", marque: "Peugeot", modele: "3008 GT", annee: 2021, km: 45000, carburant: "Diesel",
    prix: 24800, photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=300&fit=crop",
    description: "Peugeot 3008 GT Line, full options, toit panoramique, GPS, caméra de recul, sièges chauffants. Véhicule en excellent état, entretien suivi en concession. CT OK, garantie 6 mois.",
  },
  {
    id: 2, immat: "EH-456-CD", marque: "BMW", modele: "Série 3 320d", annee: 2020, km: 62000, carburant: "Diesel",
    prix: 27500, photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop",
    description: "BMW 320d Sport Line, boîte auto, GPS Pro, LED, régulateur adaptatif. Carnet d'entretien BMW complet. Première main.",
  },
  {
    id: 3, immat: "DJ-789-EF", marque: "Renault", modele: "Captur", annee: 2022, km: 28000, carburant: "Essence",
    prix: 18900, photo: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&h=300&fit=crop",
    description: "Renault Captur Intens TCe 130, GPS, caméra, climatisation auto, aide au stationnement. Faible kilométrage.",
  },
  {
    id: 4, immat: "CK-012-GH", marque: "Mercedes", modele: "Classe A 200", annee: 2021, km: 35000, carburant: "Essence",
    prix: 29900, photo: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop",
    description: "Mercedes Classe A 200 AMG Line, pack premium, MBUX, toit ouvrant, éclairage ambiance 64 couleurs. État irréprochable.",
  },
  {
    id: 5, immat: "BL-345-IJ", marque: "Volkswagen", modele: "Golf 8", annee: 2022, km: 22000, carburant: "Essence",
    prix: 24500, photo: "https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=400&h=300&fit=crop",
    description: "Volkswagen Golf 8 Style 1.5 TSI 150, Digital Cockpit Pro, ACC, Lane Assist, App-Connect. Garantie constructeur.",
  },
  {
    id: 6, immat: "AM-678-KL", marque: "Audi", modele: "A3 Sportback", annee: 2019, km: 78000, carburant: "Diesel",
    prix: 20500, photo: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=400&h=300&fit=crop",
    description: "Audi A3 Sportback 35 TDI S-Tronic, Virtual Cockpit, MMI Navigation, sièges sport. Entretien Audi à jour.",
  },
];

export default function Vitrine() {
  const [selected, setSelected] = useState<typeof vehiclesShowcase[0] | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center font-bold text-lg">AF</div>
            <div>
              <h1 className="text-xl font-bold">AutoFlow Pro</h1>
              <p className="text-xs opacity-80">Véhicules d'occasion sélectionnés</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <a href="tel:0472460432" className="flex items-center gap-1.5 hover:opacity-80"><Phone className="h-4 w-4" /> 04 72 46 04 32</a>
            <a href="mailto:contact@autoflow.fr" className="flex items-center gap-1.5 hover:opacity-80"><Mail className="h-4 w-4" /> Contact</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Nos véhicules en vente</h2>
          <p className="text-muted-foreground">Tous nos véhicules sont contrôlés, révisés et garantis</p>
          <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> Tignieu-Jameyzieu 38230
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground mb-6">{vehiclesShowcase.length} véhicules disponibles</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehiclesShowcase.map((v) => (
            <div
              key={v.id}
              onClick={() => setSelected(v)}
              className="rounded-xl border border-border bg-card shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img src={v.photo} alt={`${v.marque} ${v.modele}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-card-foreground text-lg">{v.marque} {v.modele}</h3>
                <p className="text-primary font-bold text-xl mt-1">{v.prix.toLocaleString()} €</p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{v.annee}</span>
                  <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" />{v.km.toLocaleString()} km</span>
                  <span className="flex items-center gap-1"><Fuel className="h-3.5 w-3.5" />{v.carburant}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video overflow-hidden rounded-t-2xl bg-muted">
              <img src={selected.photo} alt={`${selected.marque} ${selected.modele}`} className="w-full h-full object-cover" />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-card-foreground">{selected.marque} {selected.modele}</h2>
              <p className="text-primary font-bold text-2xl mt-1">{selected.prix.toLocaleString()} €</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{selected.annee}</span>
                <span className="flex items-center gap-1.5"><Gauge className="h-4 w-4" />{selected.km.toLocaleString()} km</span>
                <span className="flex items-center gap-1.5"><Fuel className="h-4 w-4" />{selected.carburant}</span>
              </div>
              <div className="mt-5 pt-5 border-t border-border">
                <h3 className="font-semibold text-card-foreground mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
              </div>
              <div className="mt-5 flex gap-3">
                <a href="tel:0472460432" className="flex-1 bg-primary text-primary-foreground rounded-lg py-3 text-center font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4" /> Appeler
                </a>
                <a href="mailto:contact@autoflow.fr" className="flex-1 border border-border rounded-lg py-3 text-center font-medium text-sm text-card-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} AutoFlow Pro — Tous droits réservés
        </div>
      </footer>
    </div>
  );
}
