import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Link, Lock, Shield, FileText, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import type { GarantieOption } from "@/types/vehicle";
import PlaqueScanner from "./PlaqueScanner";
import type { PlaqueResultData } from "./PlaqueScanner";
import { supabase } from "@/integrations/supabase/client";
import { useConnecteurs } from "@/hooks/useConnecteurs";

interface Props {
  onClose: () => void;
  onImport: (data: any) => void;
}

const EQUIPMENTS = [
  "Climatisation auto", "GPS", "Caméra de recul", "Radar de recul", "Sièges chauffants",
  "Toit ouvrant", "Jantes alu", "Régulateur adaptatif", "Apple CarPlay", "Android Auto",
  "Aide au stationnement", "Démarrage sans clé", "Vitres teintées", "LED", "Attelage",
  "Pack Sport", "Cuir", "Alcantara", "Toit panoramique", "Affichage tête haute",
];

function detectPlatform(url: string): string | null {
  if (url.includes("leboncoin")) return "Leboncoin";
  if (url.includes("autoscout24")) return "AutoScout24";
  if (url.includes("lacentrale")) return "LaCentrale";
  return null;
}

export default function ImportAnnonce({ onClose, onImport }: Props) {
  const { connecteurs } = useConnecteurs();
  const [step, setStep] = useState<1 | 2>(1);
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<string | null>(null);

  // Form fields
  const [vin, setVin] = useState("");
  const [registration, setRegistration] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [version, setVersion] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [mileage, setMileage] = useState<number | "">("");
  const [fuelType, setFuelType] = useState("Diesel");
  const [color, setColor] = useState("");
  const [powerDIN, setPowerDIN] = useState<number | "">("");
  const [cvFiscaux, setCvFiscaux] = useState<number | "">("");
  const [purchasePrice, setPurchasePrice] = useState<number | "">("");
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [policeNumber, setPoliceNumber] = useState<number | "">("");

  // Sections
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [customEquipment, setCustomEquipment] = useState("");
  const [garantieId, setGarantieId] = useState("");
  const [garantiesList, setGarantiesList] = useState<GarantieOption[]>([]);
  const [fraisMiseEnRoute, setFraisMiseEnRoute] = useState<number | "">(0);
  const [fraisCarteGrise, setFraisCarteGrise] = useState<number | "">(0);
  const [fraisAssurance, setFraisAssurance] = useState<number | "">(0);

  // Load garanties from settings
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "garanties_list")
        .maybeSingle();
      if (data?.value) {
        try {
          const list = JSON.parse(data.value) as GarantieOption[];
          setGarantiesList(list.filter((g) => g.active));
        } catch { /* ignore */ }
      }
    })();
  }, []);

  // Collapsibles
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ confidential: true, main: true });
  const toggleSection = (s: string) => setOpenSections((p) => ({ ...p, [s]: !p[s] }));

  const handleUrlPaste = (val: string) => {
    setUrl(val);
    setPlatform(detectPlatform(val));
  };

  const handlePlaque = (data: PlaqueResultData) => {
    if (data.vin) setVin(data.vin);
    if (data.marque) setBrand(data.marque);
    if (data.modele) setModel(data.modele);
    if (data.version) setVersion(data.version || "");
    if (data.annee) setYear(data.annee);
    if (data.energie) setFuelType(data.energie);
    if (data.couleur) setColor(data.couleur || "");
    if (data.puissanceDin) setPowerDIN(data.puissanceDin);
    if (data.puissanceFiscale) setCvFiscaux(data.puissanceFiscale);
  };

  const toggleEquipment = (eq: string) => {
    setSelectedEquipments((prev) => prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]);
  };

  const addCustomEquipment = () => {
    if (!customEquipment.trim()) return;
    setSelectedEquipments((prev) => [...prev, customEquipment.trim()]);
    setCustomEquipment("");
  };

  const selectedGarantie = AMS_GARANTIES.find((g) => g.id === garantieId);
  const selectedDuration = selectedGarantie?.durations.find((d) => d.months === garantieDuration);
  const garantiePrice = garantieMode === "ajout" ? (selectedDuration?.priceHT || 0) : 0;
  const totalFrais = (Number(fraisMiseEnRoute) || 0) + (Number(fraisCarteGrise) || 0) + (Number(fraisAssurance) || 0);
  const totalFacture = (Number(sellingPrice) || 0) + totalFrais + garantiePrice;

  const handleImport = () => {
    onImport({
      vin, registration, brand, model, version, year, mileage, fuelType, color,
      powerDIN, cvFiscaux, purchasePrice, sellingPrice, description, policeNumber,
      equipments: selectedEquipments,
      garantie: garantieId ? { optionId: garantieId, durationMonths: garantieDuration, mode: garantieMode } : undefined,
      frais: { miseEnRoute: Number(fraisMiseEnRoute) || 0, carteGrise: Number(fraisCarteGrise) || 0, assurance: Number(fraisAssurance) || 0, autres: 0 },
      platform,
    });
    onClose();
  };

  const SectionHeader = ({ id, title, icon }: { id: string; title: string; icon: React.ReactNode }) => (
    <button type="button" onClick={() => toggleSection(id)} className="flex items-center justify-between w-full py-2 text-sm font-semibold text-card-foreground">
      <span className="flex items-center gap-2">{icon}{title}</span>
      {openSections[id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
  );

  if (step === 1) {
    return (
      <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <h2 className="font-bold text-lg text-card-foreground">Importer une annonce</h2>
          </div>
          <p className="text-sm text-muted-foreground">Collez le lien d'une annonce pour pré-remplir les informations du véhicule.</p>
          <div>
            <Label className="text-xs">Lien de l'annonce</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={url} onChange={(e) => handleUrlPaste(e.target.value)} placeholder="https://www.leboncoin.fr/..." className="pl-9" />
              </div>
            </div>
            {platform && (
              <Badge variant="default" className="mt-2 text-xs">{platform} détecté</Badge>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={() => setStep(2)}>
              Continuer <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 p-5 border-b border-border sticky top-0 bg-card z-10">
          <button onClick={() => setStep(1)} className="rounded-lg p-1.5 hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <h2 className="font-bold text-lg text-card-foreground">Saisie assistée</h2>
          {platform && <Badge variant="secondary" className="text-xs ml-auto">{platform}</Badge>}
        </div>

        <div className="p-5 space-y-4">
          {/* Plaque scanner */}
          <PlaqueScanner onDecoded={handlePlaque} connecteurs={connecteurs} />

          {/* Confidential */}
          <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-3">
            <SectionHeader id="confidential" title="Données confidentielles" icon={<Lock className="h-4 w-4 text-destructive" />} />
            {openSections.confidential && (
              <div className="space-y-2 mt-2">
                <p className="text-[10px] text-destructive">⚠️ VIN et immatriculation ne sont jamais publiés sur les annonces en ligne</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">VIN</Label>
                    <Input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="VF3..." className="text-xs font-mono" />
                  </div>
                  <div>
                    <Label className="text-xs">Immatriculation</Label>
                    <Input value={registration} onChange={(e) => setRegistration(e.target.value.toUpperCase())} placeholder="AA-123-BB" className="text-xs font-mono" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main info */}
          <div className="border border-border rounded-lg p-3">
            <SectionHeader id="main" title="Informations principales" icon={<FileText className="h-4 w-4" />} />
            {openSections.main && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div><Label className="text-xs">Marque</Label><Input value={brand} onChange={(e) => setBrand(e.target.value)} className="text-xs" /></div>
                <div><Label className="text-xs">Modèle</Label><Input value={model} onChange={(e) => setModel(e.target.value)} className="text-xs" /></div>
                <div><Label className="text-xs">Version</Label><Input value={version} onChange={(e) => setVersion(e.target.value)} className="text-xs" /></div>
                <div><Label className="text-xs">Année</Label><Input type="number" value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")} className="text-xs" /></div>
                <div><Label className="text-xs">Kilométrage</Label><Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value ? Number(e.target.value) : "")} className="text-xs" /></div>
                <div>
                  <Label className="text-xs">Carburant</Label>
                  <Select value={fuelType} onValueChange={setFuelType}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Diesel", "Essence", "Hybride", "Électrique", "GPL"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Couleur</Label><Input value={color} onChange={(e) => setColor(e.target.value)} className="text-xs" /></div>
                <div><Label className="text-xs">Puissance DIN (Ch)</Label><Input type="number" value={powerDIN} onChange={(e) => setPowerDIN(e.target.value ? Number(e.target.value) : "")} className="text-xs" /></div>
                <div><Label className="text-xs">CV fiscaux</Label><Input type="number" value={cvFiscaux} onChange={(e) => setCvFiscaux(e.target.value ? Number(e.target.value) : "")} className="text-xs" /></div>
              </div>
            )}
          </div>

          {/* Equipments */}
          <div className="border border-border rounded-lg p-3">
            <SectionHeader id="equip" title={`Équipements (${selectedEquipments.length})`} icon={<Plus className="h-4 w-4" />} />
            {openSections.equip && (
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {EQUIPMENTS.map((eq) => (
                    <button
                      key={eq} type="button"
                      onClick={() => toggleEquipment(eq)}
                      className={`px-2 py-1 rounded-md text-[10px] border transition-colors ${selectedEquipments.includes(eq) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary"}`}
                    >
                      {eq}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={customEquipment} onChange={(e) => setCustomEquipment(e.target.value)} placeholder="Équipement personnalisé..." className="text-xs" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomEquipment())} />
                  <Button type="button" size="sm" variant="outline" onClick={addCustomEquipment}>Ajouter</Button>
                </div>
                {selectedEquipments.filter((e) => !EQUIPMENTS.includes(e)).map((eq) => (
                  <Badge key={eq} variant="default" className="text-[10px] mr-1">
                    {eq}
                    <button onClick={() => toggleEquipment(eq)} className="ml-1"><X className="h-2.5 w-2.5" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Garantie */}
          <div className="border border-border rounded-lg p-3">
            <SectionHeader id="garantie" title="Garantie" icon={<Shield className="h-4 w-4" />} />
            {openSections.garantie && (
              <div className="mt-2 space-y-2">
                <Select value={garantieId} onValueChange={setGarantieId}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Sélectionner une garantie..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune garantie</SelectItem>
                    {AMS_GARANTIES.filter((g) => g.active).map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name} — {g.provider} ({g.vehicleType})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedGarantie && (
                  <div className="flex gap-3 items-center">
                    <Select value={String(garantieDuration)} onValueChange={(v) => setGarantieDuration(Number(v))}>
                      <SelectTrigger className="text-xs w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {selectedGarantie.durations.map((d) => <SelectItem key={d.months} value={String(d.months)}>{d.months} mois</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={garantieMode} onValueChange={(v) => setGarantieMode(v as "inclus" | "ajout")}>
                      <SelectTrigger className="text-xs w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ajout">En supplément</SelectItem>
                        <SelectItem value="inclus">Incluse</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedDuration && (
                      <span className="text-xs text-muted-foreground">{selectedDuration.priceHT}€ HT</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Prix & Frais */}
          <div className="border border-border rounded-lg p-3">
            <SectionHeader id="prix" title="Prix & Frais facture" icon={<FileText className="h-4 w-4" />} />
            {openSections.prix && (
              <div className="mt-2 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Prix d'achat (€)</Label><Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value ? Number(e.target.value) : "")} className="text-xs" /></div>
                  <div><Label className="text-xs">Prix de vente (€)</Label><Input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value ? Number(e.target.value) : "")} className="text-xs" /></div>
                  <div><Label className="text-xs">Frais mise en route (€)</Label><Input type="number" value={fraisMiseEnRoute} onChange={(e) => setFraisMiseEnRoute(e.target.value ? Number(e.target.value) : "")} className="text-xs" /></div>
                  <div><Label className="text-xs">Frais carte grise (€)</Label><Input type="number" value={fraisCarteGrise} onChange={(e) => setFraisCarteGrise(e.target.value ? Number(e.target.value) : "")} className="text-xs" /></div>
                  <div><Label className="text-xs">Assurance provisoire (€)</Label><Input type="number" value={fraisAssurance} onChange={(e) => setFraisAssurance(e.target.value ? Number(e.target.value) : "")} className="text-xs" /></div>
                </div>
                {/* Recap */}
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                  <div className="flex justify-between text-xs">
                    <span>Prix vente</span><span className="font-medium">{Number(sellingPrice) || 0} €</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Frais</span><span>+{totalFrais} €</span>
                  </div>
                  {garantiePrice > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Garantie</span><span>+{garantiePrice} €</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold mt-1 pt-1 border-t border-primary/20">
                    <span>Total facture</span><span>{totalFacture} €</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Police number */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <Label className="text-xs font-semibold text-primary">N° de Police (obligatoire)</Label>
            <Input type="number" value={policeNumber} onChange={(e) => setPoliceNumber(e.target.value ? Number(e.target.value) : "")} placeholder="N° livre de police" className="text-xs mt-1" />
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs">Description annonce</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description pour les plateformes..." className="text-xs" />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleImport} disabled={!brand || !model || !registration}>
              Importer le véhicule
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
