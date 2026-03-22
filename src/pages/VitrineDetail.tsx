import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, Phone, Mail, Calendar, Gauge, Fuel, Shield, Car, Palette, MapPin } from "lucide-react";

export default function VitrineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vitrine-vehicle", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

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

  const { data: works = [] } = useQuery({
    queryKey: ["vitrine-works", id],
    queryFn: async () => {
      const { data } = await supabase.from("vehicle_works").select("*").eq("vehicle_id", id!).eq("client_visible", true);
      return data || [];
    },
    enabled: !!id,
  });

  const agencyName = agencyInfo?.agency_name || "AutoFlow Pro";
  const agencyPhone = agencyInfo?.agency_phone || "";
  const agencyEmail = agencyInfo?.agency_email || "";
  const agencyCity = agencyInfo?.agency_city || "";

  // Collect all photos
  const photos: string[] = [];
  if (vehicle?.photo_url) photos.push(vehicle.photo_url);
  if (vehicle?.photo_urls) photos.push(...vehicle.photo_urls.filter((u: string) => u !== vehicle.photo_url));
  if (photos.length === 0) photos.push("/placeholder.svg");

  const nextPhoto = () => setCurrentPhoto((p) => (p + 1) % photos.length);
  const prevPhoto = () => setCurrentPhoto((p) => (p - 1 + photos.length) % photos.length);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? nextPhoto() : prevPhoto();
    setTouchStart(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextPhoto();
      else if (e.key === "ArrowLeft") prevPhoto();
      else if (e.key === "Escape") navigate("/vitrine");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [photos.length]);

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Chargement...</div>;
  if (!vehicle) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Véhicule introuvable</div>;

  const isReserved = vehicle.status === "Réservé";
  const isSold = vehicle.status === "Vendu";

  // Mock equipment list from description (could be a DB column later)
  const equipments = [
    "Climatisation automatique", "GPS intégré", "Radar de recul", "Sièges chauffants",
    "Jantes alliage", "Régulateur de vitesse", "Bluetooth", "Start & Stop"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-primary via-primary-dark to-primary-darker text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/vitrine")} className="flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all">
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>
          <span className="text-sm font-medium opacity-80">{agencyName}</span>
          <div className="flex items-center gap-2">
            {agencyPhone && (
              <a href={`tel:${agencyPhone}`} className="bg-accent text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-1.5">
                <Phone className="h-4 w-4" /> Appeler
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Photo Gallery */}
          <div className="lg:col-span-3">
            {/* Main carousel */}
            <div
              className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted group"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={photos[currentPhoto]}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              {/* Status overlay */}
              {isReserved && (
                <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                  <span className="bg-accent text-white font-extrabold text-3xl px-8 py-3 rounded-xl -rotate-12 shadow-lg tracking-wider uppercase">Réservé</span>
                </div>
              )}
              {isSold && (
                <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                  <span className="text-destructive font-black text-6xl -rotate-25 tracking-widest uppercase drop-shadow-lg" style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.5)", WebkitTextStroke: "2px rgba(255,255,255,0.4)" }}>VENDU</span>
                </div>
              )}
              {/* Navigation arrows */}
              {photos.length > 1 && (
                <>
                  <button onClick={prevPhoto} className="absolute left-3 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm rounded-full p-2 text-card-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-card">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={nextPhoto} className="absolute right-3 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm rounded-full p-2 text-card-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-card">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              {/* Photo counter */}
              <span className="absolute bottom-3 right-3 bg-card/80 backdrop-blur-sm text-card-foreground text-xs font-semibold px-3 py-1.5 rounded-lg">
                {currentPhoto + 1} / {photos.length}
              </span>
            </div>

            {/* Thumbnails */}
            {photos.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {photos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhoto(i)}
                    className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      i === currentPhoto ? "border-primary ring-2 ring-primary/30" : "border-border opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title & Price card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h1 className="text-2xl font-bold text-card-foreground">{vehicle.brand} {vehicle.model}</h1>
              {vehicle.version && <p className="text-sm text-muted-foreground mt-0.5">{vehicle.version}</p>}
              <p className="text-3xl font-extrabold text-accent mt-3">{(vehicle.selling_price || 0).toLocaleString()} €</p>

              <div className="grid grid-cols-2 gap-3 mt-5">
                {[
                  { icon: Calendar, label: "Année", value: vehicle.year },
                  { icon: Gauge, label: "Kilométrage", value: `${(vehicle.mileage || 0).toLocaleString()} km` },
                  { icon: Fuel, label: "Énergie", value: vehicle.fuel_type },
                  { icon: Palette, label: "Couleur", value: vehicle.color },
                ].filter(s => s.value).map((spec) => (
                  <div key={spec.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <spec.icon className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{spec.label}</p>
                      <p className="font-medium text-card-foreground">{spec.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warranty badge */}
            <div className="rounded-2xl border border-success/30 bg-success/5 p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-semibold text-card-foreground text-sm">Garantie incluse</p>
                <p className="text-xs text-muted-foreground">Véhicule révisé et garanti par {agencyName}</p>
              </div>
            </div>

            {/* Contact buttons */}
            <div className="space-y-2">
              {agencyPhone && (
                <a href={`tel:${agencyPhone}`} className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground rounded-xl py-3.5 font-semibold text-sm hover:bg-accent/90 transition-colors shadow-md shadow-accent/20">
                  <Phone className="h-4 w-4" /> Nous contacter — {agencyPhone}
                </a>
              )}
              {agencyEmail && (
                <a href={`mailto:${agencyEmail}?subject=${encodeURIComponent(`Demande pour ${vehicle.brand} ${vehicle.model}`)}`}
                  className="w-full flex items-center justify-center gap-2 border border-border bg-card rounded-xl py-3.5 font-semibold text-sm text-card-foreground hover:bg-muted transition-colors">
                  <Mail className="h-4 w-4" /> Envoyer un email
                </a>
              )}
            </div>

            {/* Location */}
            {agencyCity && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {agencyCity}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {vehicle.description && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-bold text-card-foreground text-lg mb-3">Description</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{vehicle.description}</p>
          </div>
        )}

        {/* Equipment */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-bold text-card-foreground text-lg mb-4">Équipements</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {equipments.map((eq) => (
              <div key={eq} className="flex items-center gap-2 text-sm text-muted-foreground py-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {eq}
              </div>
            ))}
          </div>
        </div>

        {/* Visible works / interventions */}
        {works.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-bold text-card-foreground text-lg mb-3">Travaux effectués</h2>
            <div className="space-y-2">
              {works.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                  <span className="text-card-foreground">{w.designation}</span>
                  {w.intervention_date && <span className="text-muted-foreground text-xs">{new Date(w.intervention_date).toLocaleDateString("fr-FR")}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-border bg-muted/30 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} AutoFlow Pro — Tous droits réservés
        </div>
      </footer>
    </div>
  );
}
