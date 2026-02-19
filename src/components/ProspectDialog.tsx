import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function ProspectDialog({ open, onOpenChange, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    vehicle_interest: "",
    notes: "",
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("prospects").insert({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        vehicle_interest: form.vehicle_interest.trim() || null,
        notes: form.notes.trim() || null,
        status: "Nouveau",
      });
      if (error) throw error;
      toast.success("Prospect ajouté");
      setForm({ full_name: "", phone: "", email: "", vehicle_interest: "", notes: "" });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau prospect</DialogTitle>
          <DialogDescription>Ajoutez un prospect au pipeline commercial.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pname">Nom complet *</Label>
            <Input id="pname" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Jean Dupont" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pphone">Téléphone</Label>
              <Input id="pphone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="06 12 34 56 78" />
            </div>
            <div>
              <Label htmlFor="pemail">Email</Label>
              <Input id="pemail" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jean@email.com" />
            </div>
          </div>
          <div>
            <Label htmlFor="pvehicle">Véhicule recherché</Label>
            <Input id="pvehicle" value={form.vehicle_interest} onChange={(e) => set("vehicle_interest", e.target.value)} placeholder="Peugeot 3008, SUV..." />
          </div>
          <div>
            <Label htmlFor="pnotes">Notes</Label>
            <Textarea id="pnotes" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Informations complémentaires..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? "Ajout..." : "Ajouter"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
