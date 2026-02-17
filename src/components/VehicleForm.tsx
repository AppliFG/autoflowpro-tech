import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
}

const emptyForm: VehicleFormData = {
  police_number: "",
  registration: "", brand: "", model: "", version: "", year: "", mileage: "",
  fuel_type: "Diesel", color: "", purchase_price: "", selling_price: "",
  status: "En préparation", description: "", photo_url: null,
};

const fuelTypes = ["Diesel", "Essence", "Hybride", "Électrique", "GPL"];
const statuses = ["Attente de réception", "En préparation", "En ligne", "Réservé", "Vendu", "Déposé"];

interface Props {
  initialData?: VehicleFormData | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function VehicleForm({ initialData, onClose, onSaved }: Props) {
  const [form, setForm] = useState<VehicleFormData>(initialData ?? emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photo_url ?? null);
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

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image trop volumineuse (max 5 Mo)"); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    set("photo_url", null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.registration || !form.brand || !form.model) {
      toast.error("Immatriculation, marque et modèle sont obligatoires");
      return;
    }
    setSaving(true);

    try {
      let photoUrl = form.photo_url;

      // Upload photo if new file selected
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `vehicles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("vehicle-photos").upload(path, photoFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("vehicle-photos").getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

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
        photo_url: photoUrl,
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
          {/* Photo */}
          <div>
            <Label className="mb-2 block">Photo</Label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="" className="h-24 w-32 object-cover rounded-lg border border-border" />
                  <button type="button" onClick={removePhoto} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="h-24 w-32 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Upload</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              {photoPreview && (
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  Changer
                </Button>
              )}
            </div>
          </div>

          {/* Police number + Main fields */}
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
