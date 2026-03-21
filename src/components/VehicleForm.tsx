import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PlaqueScanner from "./PlaqueScanner";
import type { PlaqueResultData } from "./PlaqueScanner";

interface VehicleFormData {
  id?: string;
  police_number?: number | "";
  registration: string;
  brand: string;
  model: string;
  version: string;
  year: number | "";
  mileage: number | "";
  fuel_type: string;
  color: string;
  purchase_price: number | "";
  selling_price: number | "";
  status: string;
  description: string;
  photo_url: string | null;
  photo_urls?: string[];
  vin?: string;
  power_din?: number | "";
  cv_fiscaux?: number | "";
}

const emptyForm: VehicleFormData = {
  police_number: "",
  registration: "", brand: "", model: "", version: "", year: "", mileage: "",
  fuel_type: "Diesel", color: "", purchase_price: "", selling_price: "",
  status: "En préparation", description: "", photo_url: null, photo_urls: [],
  vin: "", power_din: "", cv_fiscaux: "",
};

const fuelTypes = ["Diesel", "Essence", "Hybride", "Électrique", "GPL"];
const statuses = ["Attente de réception", "En préparation", "En ligne", "Réservé", "Vendu", "Déposé", "Dépôt-vente"];

interface Props {
  initialData?: VehicleFormData | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function VehicleForm({ initialData, onClose, onSaved }: Props) {
  const [form, setForm] = useState<VehicleFormData>(initialData ?? emptyForm);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>(() => {
    const urls = initialData?.photo_urls ?? [];
    if (urls.length > 0) return urls;
    if (initialData?.photo_url) return [initialData.photo_url];
    return [];
  });
  const [saving, setSaving] = useState(false);
  const [nextPoliceNumber, setNextPoliceNumber] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = !!initialData?.id;

  // Fetch next police number for new vehicles
  useState(() => {
    if (!isEdit) {
      (async () => {
        const [{ data: settings }, { data: maxVehicle }] = await Promise.all([
          supabase.from("app_settings").select("value").eq("key", "police_number_start").single(),
          supabase.from("vehicles").select("police_number").order("police_number", { ascending: false }).limit(1).single(),
        ]);
        const start = parseInt(settings?.value || "1", 10);
        const maxNum = maxVehicle?.police_number ?? (start - 1);
        const next = Math.max(start, (maxNum as number) + 1);
        setNextPoliceNumber(next);
        setForm((f) => ({ ...f, police_number: next }));
      })();
    }
  });

  const set = (key: keyof VehicleFormData, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handlePlaqueDecoded = (data: PlaqueDecodedData) => {
    setForm((f) => ({
      ...f,
      vin: data.vin || f.vin,
      registration: f.registration || "",
      brand: data.brand || f.brand,
      model: data.model || f.model,
      version: data.version || f.version,
      year: data.year || f.year,
      fuel_type: data.fuelType || f.fuel_type,
      color: data.color || f.color,
      power_din: data.powerDIN || f.power_din,
      cv_fiscaux: data.powerCV || f.cv_fiscaux,
    }));
    toast.success("Champs pré-remplis depuis la plaque");
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalCount = photoPreviews.length + files.length;
    if (totalCount > 10) {
      toast.error("Maximum 10 photos par véhicule");
      return;
    }
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} trop volumineux (max 5 Mo)`);
        return;
      }
    }
    setNewFiles((prev) => [...prev, ...files]);
    setPhotoPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    const existingCount = (form.photo_urls?.length ?? 0) || (form.photo_url ? 1 : 0);
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    if (index < existingCount) {
      const existingUrls = form.photo_urls?.length ? [...form.photo_urls] : (form.photo_url ? [form.photo_url] : []);
      existingUrls.splice(index, 1);
      setForm((f) => ({ ...f, photo_urls: existingUrls, photo_url: existingUrls[0] || null }));
    } else {
      const fileIndex = index - existingCount;
      setNewFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.registration || !form.brand || !form.model) {
      toast.error("Immatriculation, marque et modèle sont obligatoires");
      return;
    }
    setSaving(true);

    try {
      const existingUrls = form.photo_urls?.length ? [...form.photo_urls] : (form.photo_url ? [form.photo_url] : []);
      const keptExisting = existingUrls.slice(0, photoPreviews.length - newFiles.length);

      const uploadedUrls: string[] = [];
      for (const file of newFiles) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `vehicles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("vehicle-photos")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw new Error(`Erreur upload: ${upErr.message}`);
        const { data: urlData } = supabase.storage.from("vehicle-photos").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      const allUrls = [...keptExisting, ...uploadedUrls];

      const payload: any = {
        police_number: form.police_number === "" ? null : Number(form.police_number),
        registration: form.registration.trim().toUpperCase(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        version: form.version.trim() || null,
        year: form.year === "" ? null : Number(form.year),
        mileage: form.mileage === "" ? null : Number(form.mileage),
        fuel_type: form.fuel_type || null,
        color: form.color.trim() || null,
        purchase_price: form.purchase_price === "" ? 0 : Number(form.purchase_price),
        selling_price: form.selling_price === "" ? 0 : Number(form.selling_price),
        status: form.status,
        description: form.description.trim() || null,
        photo_url: allUrls[0] || null,
        photo_urls: allUrls,
      };

      if (isEdit && initialData?.id) {
        const { error } = await supabase.from("vehicles").update(payload).eq("id", initialData.id);
        if (error) throw error;
        toast.success("Véhicule modifié avec succès");
      } else {
        const { error } = await supabase.from("vehicles").insert(payload);
        if (error) throw error;
        toast.success("Véhicule ajouté avec succès");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <h2 className="font-bold text-lg text-card-foreground">
            {isEdit ? "Modifier le véhicule" : "Ajouter un véhicule"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Plaque Scanner - en haut */}
          {!isEdit && <PlaqueScanner onDecoded={handlePlaqueDecoded} />}

          {/* Photos */}
          <div>
            <Label className="mb-2 block">Photos <span className="text-muted-foreground font-normal text-xs">(max 10)</span></Label>
            <div className="flex flex-wrap gap-3">
              {photoPreviews.map((src, i) => (
                <div key={i} className="relative group">
                  <img src={src} alt="" className="h-20 w-28 object-cover rounded-lg border border-border" />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded font-medium">
                      Principale
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photoPreviews.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="h-20 w-28 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-[10px]">Ajouter</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
          </div>

          {/* Police number + Registration + VIN */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="police" className="text-primary font-semibold">N° de Police (Livre de police)</Label>
                <Input id="police" type="number" value={form.police_number} onChange={(e) => set("police_number", e.target.value === "" ? "" : Number(e.target.value))} placeholder="1" />
                <p className="text-[10px] text-muted-foreground mt-1">Numéro chronologique du livre de police / registre VO</p>
              </div>
              <div>
                <Label htmlFor="reg">Immatriculation *</Label>
                <Input id="reg" value={form.registration} onChange={(e) => set("registration", e.target.value)} placeholder="AA-123-BB" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="vin" className="text-xs">VIN <span className="text-destructive text-[9px]">(confidentiel — jamais publié)</span></Label>
                <Input id="vin" value={form.vin || ""} onChange={(e) => set("vin", e.target.value)} placeholder="VF3LCBHZ6JS000000" className="font-mono text-xs" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Marque *</Label>
              <Input id="brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Peugeot" />
            </div>
            <div>
              <Label htmlFor="model">Modèle *</Label>
              <Input id="model" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="3008" />
            </div>
            <div>
              <Label htmlFor="version">Version</Label>
              <Input id="version" value={form.version} onChange={(e) => set("version", e.target.value)} placeholder="GT Line" />
            </div>
            <div>
              <Label htmlFor="year">Année</Label>
              <Input id="year" type="number" value={form.year} onChange={(e) => set("year", e.target.value === "" ? "" : Number(e.target.value))} placeholder="2022" />
            </div>
            <div>
              <Label htmlFor="km">Kilométrage</Label>
              <Input id="km" type="number" value={form.mileage} onChange={(e) => set("mileage", e.target.value === "" ? "" : Number(e.target.value))} placeholder="45000" />
            </div>
            <div>
              <Label>Carburant</Label>
              <Select value={form.fuel_type} onValueChange={(v) => set("fuel_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="color">Couleur</Label>
              <Input id="color" value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Gris" />
            </div>
          </div>

          {/* Puissance DIN + CV fiscaux */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="powerDin">Puissance DIN (Ch)</Label>
              <Input id="powerDin" type="number" value={form.power_din} onChange={(e) => set("power_din", e.target.value === "" ? "" : Number(e.target.value))} placeholder="130" />
            </div>
            <div>
              <Label htmlFor="cvFiscaux">CV fiscaux</Label>
              <Input id="cvFiscaux" type="number" value={form.cv_fiscaux} onChange={(e) => set("cv_fiscaux", e.target.value === "" ? "" : Number(e.target.value))} placeholder="7" />
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pa">Prix d'achat (€)</Label>
              <Input id="pa" type="number" value={form.purchase_price} onChange={(e) => set("purchase_price", e.target.value === "" ? "" : Number(e.target.value))} placeholder="12000" />
            </div>
            <div>
              <Label htmlFor="pv">Prix de vente (€)</Label>
              <Input id="pv" type="number" value={form.selling_price} onChange={(e) => set("selling_price", e.target.value === "" ? "" : Number(e.target.value))} placeholder="15000" />
            </div>
          </div>

          {/* Status */}
          <div className="max-w-xs">
            <Label>Statut</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="desc">Descriptif annonce</Label>
            <Textarea id="desc" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Description pour les plateformes de diffusion..." />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : isEdit ? "Enregistrer" : "Ajouter le véhicule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
