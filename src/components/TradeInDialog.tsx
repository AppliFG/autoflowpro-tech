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

export default function TradeInDialog({ open, onOpenChange, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    registration: "",
    mileage: "" as number | "",
    desired_amount: "" as number | "",
    notes: "",
  });

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.registration.trim() || !form.phone.trim() || !form.email.trim() || form.mileage === "") {
      toast.error("Nom, téléphone, email, immatriculation et kilométrage sont obligatoires");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("trade_ins").insert({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        registration: form.registration.trim().toUpperCase(),
        mileage: Number(form.mileage),
        desired_amount: form.desired_amount === "" ? null : Number(form.desired_amount),
        notes: form.notes.trim() || null,
        rgpd_consent: true,
        rgpd_consent_date: new Date().toISOString(),
        status: "Nouvelle",
      });
      if (error) throw error;
      toast.success("Demande de reprise ajoutée");
      setForm({ full_name: "", phone: "", email: "", registration: "", mileage: "", desired_amount: "", notes: "" });
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
          <DialogTitle>Nouvelle demande de reprise</DialogTitle>
          <DialogDescription>Saisissez les informations du véhicule à reprendre.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tname">Nom complet *</Label>
            <Input id="tname" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Jean Dupont" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tphone">Téléphone *</Label>
              <Input id="tphone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="06 12 34 56 78" />
            </div>
            <div>
              <Label htmlFor="temail">Email *</Label>
              <Input id="temail" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jean@email.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="treg">Immatriculation *</Label>
              <Input id="treg" value={form.registration} onChange={(e) => set("registration", e.target.value)} placeholder="AA-123-BB" />
            </div>
            <div>
              <Label htmlFor="tkm">Kilométrage *</Label>
              <Input id="tkm" type="number" value={form.mileage} onChange={(e) => set("mileage", e.target.value === "" ? "" : Number(e.target.value))} placeholder="85000" />
            </div>
          </div>
          <div>
            <Label htmlFor="tamount">Montant souhaité (€)</Label>
            <Input id="tamount" type="number" value={form.desired_amount} onChange={(e) => set("desired_amount", e.target.value === "" ? "" : Number(e.target.value))} placeholder="8000" />
          </div>
          <div>
            <Label htmlFor="tnotes">Notes</Label>
            <Textarea id="tnotes" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="État du véhicule, historique..." />
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
