import { Car, MapPin, Calendar, Gauge, Fuel, Phone, Mail, ArrowLeft, Camera, Send, MessageCircle, SlidersHorizontal } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// Helper: overlay component for Réservé / Vendu
function VehicleImageOverlay({ src, alt, status, className = "" }: { src: string; alt: string; status: string; className?: string }) {
  const isReserved = status === "Réservé";
  const isSold = status === "Vendu";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img src={src || "/placeholder.svg"} alt={alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      {isReserved && (
        <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
          <span className="bg-orange-500 text-white font-extrabold text-2xl px-6 py-2 rounded-lg -rotate-12 shadow-lg tracking-wider uppercase">
            Réservé
          </span>
        </div>
      )}
      {isSold && (
        <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
          <span className="text-red-600 font-black text-5xl -rotate-25 tracking-widest uppercase drop-shadow-lg select-none"
            style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.5)", WebkitTextStroke: "2px rgba(255,255,255,0.4)" }}>
            VENDU
          </span>
        </div>
      )}
    </div>
  );
}

export default function Vitrine() {
  const [selected, setSelected] = useState<any | null>(null);
  const [showReprise, setShowReprise] = useState(false);
  const [repriseForm, setRepriseForm] = useState({
    nom: "", email: "", telephone: "", immatriculation: "", km: "", montantSouhaite: "",
  });
  const [reprisePhotos, setReprisePhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [rgpdConsent, setRgpdConsent] = useState(false);
  const [rgpdText, setRgpdText] = useState("");
  const navigate = useNavigate();

  // Filter state
  const [fuelFilter, setFuelFilter] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [kmMin, setKmMin] = useState("");
  const [kmMax, setKmMax] = useState("");

  // Fetch agency info from app_settings
  const { data: agencyInfo } = useQuery({
    queryKey: ["vitrine-agency-info"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("key, value").in("key", [
        "agency_name", "agency_phone", "agency_email", "agency_address", "agency_logo_url"
      ]);
      const map: Record<string, string> = {};
      data?.forEach((r) => { map[r.key] = r.value; });
      return map;
    },
  });

  const agencyName = agencyInfo?.agency_name || "AutoFlow Pro";
  const agencyPhone = agencyInfo?.agency_phone || "";
  const agencyEmailAddr = agencyInfo?.agency_email || "";
  const agencyAddress = agencyInfo?.agency_address || "";
  const agencyLogoUrl = agencyInfo?.agency_logo_url || "";

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vitrine-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .in("status", ["En ligne", "en_ligne", "Réservé", "Vendu"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch RGPD text from settings
  useQuery({
    queryKey: ["rgpd-text"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "rgpd_text").single();
      if (data?.value) setRgpdText(data.value);
      return data?.value || "";
    },
  });

  // Filter vehicles: include Réservé always, Vendu only within 72h of updated_at
  const displayVehicles = useMemo(() => {
    const now = Date.now();
    const hours72 = 72 * 60 * 60 * 1000;
    return vehicles.filter((v) => {
      if (v.status === "En ligne" || v.status === "en_ligne" || v.status === "Réservé") return true;
      if (v.status === "Vendu") {
        const updatedAt = new Date(v.updated_at).getTime();
        return now - updatedAt < hours72;
      }
      return false;
    });
  }, [vehicles]);

  // Derive unique fuel types for filter dropdown
  const fuelTypes = useMemo(() => {
    const types = new Set(displayVehicles.map((v) => v.fuel_type).filter(Boolean));
    return Array.from(types).sort() as string[];
  }, [displayVehicles]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return displayVehicles.filter((v) => {
      if (fuelFilter && v.fuel_type !== fuelFilter) return false;
      const price = v.selling_price || 0;
      if (priceMin && price < Number(priceMin)) return false;
      if (priceMax && price > Number(priceMax)) return false;
      const km = v.mileage || 0;
      if (kmMin && km < Number(kmMin)) return false;
      if (kmMax && km > Number(kmMax)) return false;
      return true;
    });
  }, [displayVehicles, fuelFilter, priceMin, priceMax, kmMin, kmMax]);

  const resetFilters = () => {
    setFuelFilter("");
    setPriceMin("");
    setPriceMax("");
    setKmMin("");
    setKmMax("");
  };

  const handleRepriseChange = (field: string, value: string) => {
    setRepriseForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReprisePhotos((prev) => [...prev, ...Array.from(e.target.files!)].slice(0, 10));
    }
  };

  const removePhoto = (idx: number) => {
    setReprisePhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const isRepriseValid = repriseForm.nom && repriseForm.email && repriseForm.telephone && repriseForm.immatriculation && repriseForm.km && reprisePhotos.length >= 3 && rgpdConsent;

  const submitReprise = async () => {
    if (!isRepriseValid || submitting) return;
    setSubmitting(true);
    try {
      const photoUrls: string[] = [];
      for (const file of reprisePhotos) {
        const path = `trade-ins/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("vehicle-photos").upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("vehicle-photos").getPublicUrl(path);
        photoUrls.push(urlData.publicUrl);
      }

      const { error } = await supabase.from("trade_ins").insert({
        full_name: repriseForm.nom,
        email: repriseForm.email,
        phone: repriseForm.telephone,
        registration: repriseForm.immatriculation,
        mileage: parseInt(repriseForm.km),
        desired_amount: repriseForm.montantSouhaite ? parseFloat(repriseForm.montantSouhaite) : null,
        photo_urls: photoUrls,
        rgpd_consent: true,
        rgpd_consent_date: new Date().toISOString(),
      });
      if (error) throw error;

      toast.success("Demande envoyée avec succès !");
      setRepriseForm({ nom: "", email: "", telephone: "", immatriculation: "", km: "", montantSouhaite: "" });
      setRgpdConsent(false);
      setReprisePhotos([]);
      setShowReprise(false);
    } catch (err: any) {
      toast.error("Erreur : " + (err.message || "Veuillez réessayer"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {agencyLogoUrl ? (
              <img src={agencyLogoUrl} alt={agencyName} className="h-10 w-10 rounded-xl object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center font-bold text-lg">
                {agencyName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{agencyName}</h1>
              <p className="text-xs opacity-80">Véhicules d'occasion sélectionnés</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-sm hover:opacity-80 bg-primary-foreground/15 px-3 py-1.5 rounded-lg transition-colors">
              <ArrowLeft className="h-4 w-4" /> Accueil
            </button>
            <div className="hidden sm:flex items-center gap-4 text-sm">
              {agencyPhone && (
                <a href={`tel:${agencyPhone}`} className="flex items-center gap-1.5 hover:opacity-80"><Phone className="h-4 w-4" /> {agencyPhone}</a>
              )}
              {agencyEmailAddr && (
                <a href={`mailto:${agencyEmailAddr}`} className="flex items-center gap-1.5 hover:opacity-80"><Mail className="h-4 w-4" /> Contact</a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Nos véhicules en vente</h2>
          <p className="text-muted-foreground">Tous nos véhicules sont contrôlés, révisés et garantis</p>
          {agencyAddress && (
            <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {agencyAddress}
            </div>
          )}
          <div className="flex justify-center gap-3 mt-4">
            <button onClick={() => setShowReprise(!showReprise)}
              className="bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              {showReprise ? "Voir les annonces" : "Faire racheter mon véhicule"}
            </button>
          </div>
        </div>
      </div>

      {/* Buyback form */}
      {showReprise && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="rounded-xl border border-border bg-card shadow-sm p-6">
            <h3 className="text-lg font-bold text-card-foreground mb-1">Proposer votre véhicule au rachat</h3>
            <p className="text-sm text-muted-foreground mb-5">Remplissez le formulaire ci-dessous, nous vous recontacterons rapidement.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[
                { key: "nom", label: "Nom complet *", type: "text", placeholder: "Jean Dupont" },
                { key: "email", label: "Email *", type: "email", placeholder: "jean@exemple.fr" },
                { key: "telephone", label: "Téléphone portable *", type: "tel", placeholder: "06 12 34 56 78" },
                { key: "immatriculation", label: "Plaque d'immatriculation *", type: "text", placeholder: "AB-123-CD" },
                { key: "km", label: "Kilométrage *", type: "number", placeholder: "85000" },
                { key: "montantSouhaite", label: "Montant souhaité (optionnel)", type: "number", placeholder: "12000" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    value={repriseForm[f.key as keyof typeof repriseForm]}
                    onChange={(e) => handleRepriseChange(f.key, e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Photos du véhicule * (minimum 3)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {reprisePhotos.map((photo, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted">
                    <img src={URL.createObjectURL(photo)} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(idx)}
                      className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
                </label>
              </div>
              {reprisePhotos.length < 3 && <p className="text-xs text-destructive">Ajoutez encore {3 - reprisePhotos.length} photo(s)</p>}
            </div>

            {/* RGPD Consent */}
            <div className="mb-4 p-3 rounded-lg border border-border bg-muted/30">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rgpdConsent}
                  onChange={(e) => setRgpdConsent(e.target.checked)}
                  className="mt-0.5 rounded border-input"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  J'accepte que mes données personnelles soient collectées et traitées dans le cadre de ma demande de rachat. *
                </span>
              </label>
              {rgpdText && (
                <details className="mt-2">
                  <summary className="text-[10px] text-primary cursor-pointer hover:underline">Lire les mentions RGPD complètes</summary>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">{rgpdText}</p>
                </details>
              )}
            </div>

            <button onClick={submitReprise} disabled={!isRepriseValid || submitting}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
              <Send className="h-4 w-4" /> {submitting ? "Envoi en cours..." : "Envoyer ma demande"}
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {!showReprise && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Chargement...</div>
          ) : (
            <>
              {/* Filters */}
              <div className="rounded-xl border border-border bg-card p-4 mb-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-card-foreground">Filtres</span>
                  {(fuelFilter || priceMin || priceMax || kmMin || kmMax) && (
                    <button onClick={resetFilters} className="ml-auto text-xs text-primary hover:underline">
                      Réinitialiser
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-xs text-muted-foreground mb-1 block">Carburant</label>
                    <select
                      value={fuelFilter}
                      onChange={(e) => setFuelFilter(e.target.value)}
                      className="w-full h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Tous</option>
                      <option value="Essence">Essence</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Électrique">Électrique</option>
                      <option value="Hybride">Hybride</option>
                      {fuelTypes.filter(f => !["Essence","Diesel","Électrique","Hybride"].includes(f)).map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[90px]">
                    <label className="text-xs text-muted-foreground mb-1 block">Prix min (€)</label>
                    <input type="number" placeholder="0" value={priceMin} onChange={(e) => setPriceMin(e.target.value)}
                      className="w-full h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="flex-1 min-w-[90px]">
                    <label className="text-xs text-muted-foreground mb-1 block">Prix max (€)</label>
                    <input type="number" placeholder="80 000" value={priceMax} onChange={(e) => setPriceMax(e.target.value)}
                      className="w-full h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="flex-1 min-w-[90px]">
                    <label className="text-xs text-muted-foreground mb-1 block">Km min</label>
                    <input type="number" placeholder="0" value={kmMin} onChange={(e) => setKmMin(e.target.value)}
                      className="w-full h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="flex-1 min-w-[90px]">
                    <label className="text-xs text-muted-foreground mb-1 block">Km max</label>
                    <input type="number" placeholder="300 000" value={kmMax} onChange={(e) => setKmMax(e.target.value)}
                      className="w-full h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6">{filteredVehicles.length} véhicule{filteredVehicles.length > 1 ? "s" : ""} disponible{filteredVehicles.length > 1 ? "s" : ""}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVehicles.map((v) => (
                  <div key={v.id} onClick={() => setSelected(v)}
                    className="rounded-xl border border-border bg-card shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group">
                    <VehicleImageOverlay
                      src={v.photo_url || "/placeholder.svg"}
                      alt={`${v.brand} ${v.model}`}
                      status={v.status}
                      className="aspect-[4/3] bg-muted"
                    />
                    <div className="p-4">
                      <h3 className="font-bold text-card-foreground text-lg">{v.brand} {v.model}</h3>
                      <p className="text-primary font-bold text-xl mt-1">{(v.selling_price || 0).toLocaleString()} €</p>
                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{v.year}</span>
                        <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" />{(v.mileage || 0).toLocaleString()} km</span>
                        <span className="flex items-center gap-1"><Fuel className="h-3.5 w-3.5" />{v.fuel_type}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredVehicles.length === 0 && !isLoading && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    Aucun véhicule ne correspond à vos critères
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <VehicleImageOverlay
              src={selected.photo_url || "/placeholder.svg"}
              alt={`${selected.brand} ${selected.model}`}
              status={selected.status}
              className="aspect-video rounded-t-2xl bg-muted"
            />
            <div className="p-6">
              <h2 className="text-2xl font-bold text-card-foreground">{selected.brand} {selected.model}</h2>
              <p className="text-primary font-bold text-2xl mt-1">{(selected.selling_price || 0).toLocaleString()} €</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{selected.year}</span>
                <span className="flex items-center gap-1.5"><Gauge className="h-4 w-4" />{(selected.mileage || 0).toLocaleString()} km</span>
                <span className="flex items-center gap-1.5"><Fuel className="h-4 w-4" />{selected.fuel_type}</span>
              </div>
              {selected.description && (
                <div className="mt-5 pt-5 border-t border-border">
                  <h3 className="font-semibold text-card-foreground mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
                </div>
              )}
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

      <footer className="border-t border-border bg-muted/30 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} AutoFlow Pro — Tous droits réservés
        </div>
      </footer>
    </div>
  );
}
