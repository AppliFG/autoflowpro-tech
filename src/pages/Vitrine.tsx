import { Car, MapPin, Calendar, Gauge, Fuel, Phone, Mail, ArrowLeft, Camera, Send, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

function VehicleImageOverlay({ src, alt, status, className = "" }: { src: string; alt: string; status: string; className?: string }) {
  const isReserved = status === "Réservé";
  const isSold = status === "Vendu";
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img src={src || "/placeholder.svg"} alt={alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      {isReserved && (
        <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
          <span className="bg-accent text-white font-extrabold text-2xl px-6 py-2 rounded-lg -rotate-12 shadow-lg tracking-wider uppercase">Réservé</span>
        </div>
      )}
      {isSold && (
        <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
          <span className="text-destructive font-black text-5xl -rotate-25 tracking-widest uppercase drop-shadow-lg select-none" style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.5)", WebkitTextStroke: "2px rgba(255,255,255,0.4)" }}>VENDU</span>
        </div>
      )}
    </div>
  );
}

export default function Vitrine() {
  const [selected, setSelected] = useState<any | null>(null);
  const [showReprise, setShowReprise] = useState(false);
  const [repriseForm, setRepriseForm] = useState({ nom: "", email: "", telephone: "", immatriculation: "", km: "", montantSouhaite: "" });
  const [reprisePhotos, setReprisePhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [rgpdConsent, setRgpdConsent] = useState(false);
  const [rgpdText, setRgpdText] = useState("");
  const navigate = useNavigate();

  // Filters
  const [brandFilter, setBrandFilter] = useState("");
  const [fuelFilter, setFuelFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const { data: agencyInfo } = useQuery({
    queryKey: ["vitrine-agency-info"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("key, value").in("key", [
        "agency_name", "agency_phone", "agency_email", "agency_address", "agency_city", "agency_zipcode", "agency_logo_url"
      ]);
      const map: Record<string, string> = {};
      data?.forEach((r) => { map[r.key] = r.value; });
      return map;
    },
  });

  const agencyName = agencyInfo?.agency_name || "AutoFlow Pro";
  const agencyPhone = agencyInfo?.agency_phone || "";
  const agencyEmailAddr = agencyInfo?.agency_email || "";
  const agencyCity = agencyInfo?.agency_city || "";
  const agencyZipcode = agencyInfo?.agency_zipcode || "";
  const agencyLogoUrl = agencyInfo?.agency_logo_url || "";

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vitrine-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*").in("status", ["En ligne", "en_ligne", "Réservé", "Vendu"]).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  useQuery({
    queryKey: ["rgpd-text"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "rgpd_text").maybeSingle();
      if (data?.value) setRgpdText(data.value);
      return data?.value || "";
    },
  });

  const displayVehicles = useMemo(() => {
    const now = Date.now();
    const hours72 = 72 * 60 * 60 * 1000;
    return vehicles.filter((v) => {
      if (v.status === "En ligne" || v.status === "en_ligne" || v.status === "Réservé") return true;
      if (v.status === "Vendu") return now - new Date(v.updated_at).getTime() < hours72;
      return false;
    });
  }, [vehicles]);

  // Dynamic brand list
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    displayVehicles.forEach(v => { counts[v.brand] = (counts[v.brand] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [displayVehicles]);

  const filteredVehicles = useMemo(() => {
    let result = displayVehicles.filter((v) => {
      if (brandFilter && v.brand !== brandFilter) return false;
      if (fuelFilter && v.fuel_type !== fuelFilter) return false;
      if (priceFilter) {
        const p = v.selling_price || 0;
        if (priceFilter === "<10000" && p >= 10000) return false;
        if (priceFilter === "<20000" && p >= 20000) return false;
        if (priceFilter === "<30000" && p >= 30000) return false;
        if (priceFilter === ">30000" && p < 30000) return false;
      }
      if (yearFilter && (v.year || 0) < Number(yearFilter)) return false;
      return true;
    });
    // Sort
    if (sortBy === "price_asc") result.sort((a, b) => (a.selling_price || 0) - (b.selling_price || 0));
    else if (sortBy === "price_desc") result.sort((a, b) => (b.selling_price || 0) - (a.selling_price || 0));
    else if (sortBy === "km_asc") result.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
    return result;
  }, [displayVehicles, brandFilter, fuelFilter, priceFilter, yearFilter, sortBy]);

  const handleRepriseChange = (field: string, value: string) => setRepriseForm((prev) => ({ ...prev, [field]: value }));
  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setReprisePhotos((prev) => [...prev, ...Array.from(e.target.files!)].slice(0, 10)); };
  const removePhoto = (idx: number) => setReprisePhotos((prev) => prev.filter((_, i) => i !== idx));
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
        full_name: repriseForm.nom, email: repriseForm.email, phone: repriseForm.telephone,
        registration: repriseForm.immatriculation, mileage: parseInt(repriseForm.km),
        desired_amount: repriseForm.montantSouhaite ? parseFloat(repriseForm.montantSouhaite) : null,
        photo_urls: photoUrls, rgpd_consent: true, rgpd_consent_date: new Date().toISOString(),
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

  const photoCount = (v: any) => {
    const urls = v.photo_urls || [];
    return urls.length + (v.photo_url ? 1 : 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header cobalt gradient */}
      <header className="relative bg-gradient-to-r from-primary via-primary-dark to-primary-darker text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl translate-x-1/3 -translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {agencyLogoUrl ? (
              <img src={agencyLogoUrl} alt={agencyName} className="h-12 w-12 rounded-xl object-cover ring-2 ring-white/30" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center font-bold text-lg text-primary shadow-lg">
                <Car className="h-6 w-6" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight">{agencyName}</h1>
              {(agencyCity || agencyZipcode) && (
                <p className="text-xs text-white/60 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />{[agencyZipcode, agencyCity].filter(Boolean).join(" ")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm hover:text-accent bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all">
              <ArrowLeft className="h-4 w-4" /> Accueil
            </button>
            <div className="hidden sm:flex items-center gap-3">
              {agencyPhone && (
                <a href={`tel:${agencyPhone}`} className="flex items-center gap-1.5 text-sm bg-accent text-white px-3 py-2 rounded-lg hover:bg-accent/90 transition-colors font-medium">
                  <Phone className="h-4 w-4" /> {agencyPhone}
                </a>
              )}
              {agencyEmailAddr && (
                <a href={`mailto:${agencyEmailAddr}`} className="flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors">
                  <Mail className="h-4 w-4" /> Contact
                </a>
              )}
            </div>
          </div>
        </div>
        {/* Vehicle count + phone in orange */}
        <div className="relative max-w-7xl mx-auto px-4 pb-4 flex items-center gap-4">
          <span className="text-accent font-bold text-2xl">{displayVehicles.length}</span>
          <span className="text-white/80 text-sm">véhicules disponibles</span>
        </div>
      </header>

      {/* Buyback CTA */}
      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-center">
          <button onClick={() => setShowReprise(!showReprise)} className="bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
            {showReprise ? "Voir les annonces" : "Faire racheter mon véhicule"}
          </button>
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
                  <input type={f.type} placeholder={f.placeholder} value={repriseForm[f.key as keyof typeof repriseForm]}
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
                    <button onClick={() => removePhoto(idx)} className="absolute top-0.5 right-0.5 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
                </label>
              </div>
              {reprisePhotos.length < 3 && <p className="text-xs text-destructive">Ajoutez encore {3 - reprisePhotos.length} photo(s)</p>}
            </div>
            <div className="mb-4 p-3 rounded-lg border border-border bg-muted/30">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={rgpdConsent} onChange={(e) => setRgpdConsent(e.target.checked)} className="mt-0.5 rounded border-input" />
                <span className="text-xs text-muted-foreground leading-relaxed">J'accepte que mes données personnelles soient collectées et traitées dans le cadre de ma demande de rachat. *</span>
              </label>
              {rgpdText && (
                <details className="mt-2">
                  <summary className="text-[10px] text-primary cursor-pointer hover:underline">Lire les mentions RGPD complètes</summary>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">{rgpdText}</p>
                </details>
              )}
            </div>
            <button onClick={submitReprise} disabled={!isRepriseValid || submitting}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-40">
              <Send className="h-4 w-4" /> {submitting ? "Envoi en cours..." : "Envoyer ma demande"}
            </button>
          </div>
        </div>
      )}

      {/* Main content: sidebar + grid */}
      {!showReprise && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Chargement...</div>
          ) : (
            <div className="flex gap-6">
              {/* Sidebar filters - desktop */}
              <aside className="hidden lg:block w-[195px] shrink-0">
                <div className="sticky top-4 space-y-4">
                  {/* Brand filter */}
                  <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                    <p className="text-xs font-semibold text-card-foreground uppercase tracking-wider mb-2">Marques</p>
                    <div className="space-y-0.5">
                      <button onClick={() => setBrandFilter("")}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${!brandFilter ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
                        <span>Toutes</span>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${!brandFilter ? "bg-accent text-white" : "bg-muted text-muted-foreground"}`}>
                          {displayVehicles.length}
                        </span>
                      </button>
                      {brandCounts.map(([brand, count]) => (
                        <button key={brand} onClick={() => setBrandFilter(brand === brandFilter ? "" : brand)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${brandFilter === brand ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
                          <span>{brand}</span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${brandFilter === brand ? "bg-accent text-white" : "bg-muted text-muted-foreground"}`}>
                            {count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Other filters */}
                  <div className="rounded-xl border border-border bg-card p-3 shadow-sm space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Énergie</label>
                      <select value={fuelFilter} onChange={(e) => setFuelFilter(e.target.value)}
                        className="w-full h-8 rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="">Toutes</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Essence">Essence</option>
                        <option value="Hybride">Hybride</option>
                        <option value="Électrique">Électrique</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Prix max</label>
                      <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}
                        className="w-full h-8 rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="">Tous</option>
                        <option value="<10000">&lt; 10 000 €</option>
                        <option value="<20000">&lt; 20 000 €</option>
                        <option value="<30000">&lt; 30 000 €</option>
                        <option value=">30000">&gt; 30 000 €</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Année min</label>
                      <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
                        className="w-full h-8 rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="">Toutes</option>
                        <option value="2024">2024</option>
                        <option value="2022">2022</option>
                        <option value="2020">2020</option>
                        <option value="2018">2018</option>
                        <option value="2015">2015</option>
                      </select>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Mobile filters (horizontal chips) */}
              <div className="lg:hidden mb-4 w-full">
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                  <button onClick={() => setBrandFilter("")}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!brandFilter ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                    Toutes ({displayVehicles.length})
                  </button>
                  {brandCounts.map(([brand, count]) => (
                    <button key={brand} onClick={() => setBrandFilter(brand === brandFilter ? "" : brand)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${brandFilter === brand ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                      {brand} ({count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle grid */}
              <div className="flex-1 min-w-0">
                {/* Sort bar */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground font-medium">
                    <span className="text-primary font-bold">{filteredVehicles.length}</span> véhicule{filteredVehicles.length > 1 ? "s" : ""} trouvé{filteredVehicles.length > 1 ? "s" : ""}
                  </p>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    className="h-8 rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="recent">Plus récents</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                    <option value="km_asc">Km croissant</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredVehicles.map((v) => (
                    <div key={v.id} onClick={() => navigate(`/vitrine/${v.id}`)}
                      className="rounded-xl border border-border bg-card shadow-sm overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-[3px] transition-all duration-200 group">
                      <div className="relative">
                        <VehicleImageOverlay src={v.photo_url || "/placeholder.svg"} alt={`${v.brand} ${v.model}`} status={v.status} className="aspect-[4/3] bg-muted" />
                        {/* Photo count badge */}
                        {photoCount(v) > 0 && (
                          <span className="absolute bottom-2 left-2 bg-primary text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Camera className="h-3 w-3" />{photoCount(v)}
                          </span>
                        )}
                        {/* Price badge */}
                        <span className="absolute bottom-2 right-2 bg-accent text-white text-sm font-bold px-2.5 py-1 rounded-md">
                          {(v.selling_price || 0).toLocaleString()} €
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-card-foreground text-base">{v.brand} {v.model} {v.version && <span className="font-normal text-muted-foreground text-sm">{v.version}</span>}</h3>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{v.year}</span>
                          <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" />{(v.mileage || 0).toLocaleString()} km</span>
                          <span className="flex items-center gap-1"><Fuel className="h-3.5 w-3.5" />{v.fuel_type}</span>
                        </div>
                        <div className="flex gap-1.5 mt-3">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{v.brand}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredVehicles.length === 0 && !isLoading && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">Aucun véhicule ne correspond à vos critères</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <VehicleImageOverlay src={selected.photo_url || "/placeholder.svg"} alt={`${selected.brand} ${selected.model}`} status={selected.status} className="aspect-video rounded-t-2xl bg-muted" />
            <div className="p-6">
              <h2 className="text-2xl font-bold text-card-foreground">{selected.brand} {selected.model}</h2>
              <p className="text-accent font-bold text-2xl mt-1">{(selected.selling_price || 0).toLocaleString()} €</p>
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
                {agencyPhone && (
                  <a href={`tel:${agencyPhone}`} className="flex-1 bg-accent text-white rounded-lg py-3 text-center font-medium text-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2">
                    <Phone className="h-4 w-4" /> Nous contacter
                  </a>
                )}
                {agencyEmailAddr && (
                  <a href={`mailto:${agencyEmailAddr}`} className="flex-1 border border-border rounded-lg py-3 text-center font-medium text-sm text-card-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </a>
                )}
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
