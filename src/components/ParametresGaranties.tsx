import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Shield, Plus, ExternalLink, FileText, Trash2 } from "lucide-react";
import { AMS_GARANTIES, type GarantieOption, type GarantieDuration } from "@/types/vehicle";

export default function ParametresGaranties() {
  const [garanties, setGaranties] = useState<GarantieOption[]>(AMS_GARANTIES);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newProvider, setNewProvider] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newVehicleType, setNewVehicleType] = useState("VP");
  const [newDurations, setNewDurations] = useState<GarantieDuration[]>([{ months: 6, costHT: 0, priceHT: 0 }]);

  const toggleGarantie = (id: string) => {
    setGaranties((prev) => prev.map((g) => (g.id === id ? { ...g, active: !g.active } : g)));
  };

  const addDuration = () => {
    setNewDurations((prev) => [...prev, { months: 12, costHT: 0, priceHT: 0 }]);
  };

  const updateDuration = (index: number, field: keyof GarantieDuration, value: number) => {
    setNewDurations((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value, margin: field === "costHT" || field === "priceHT" ? (field === "priceHT" ? value - d.costHT : d.priceHT - value) : d.margin } : d)));
  };

  const removeDuration = (index: number) => {
    setNewDurations((prev) => prev.filter((_, i) => i !== index));
  };

  const addGarantie = () => {
    if (!newName.trim()) return;
    const id = `custom-${Date.now()}`;
    const durations = newDurations.map((d) => ({ ...d, margin: d.priceHT - d.costHT }));
    setGaranties((prev) => [...prev, {
      id, name: newName, provider: newProvider || "Personnalisé", category: newCategory || "Mécanique", vehicleType: newVehicleType, durations, active: true,
    }]);
    setNewName("");
    setNewProvider("");
    setNewCategory("");
    setNewDurations([{ months: 6, costHT: 0, priceHT: 0 }]);
    setShowAddForm(false);
  };

  const removeGarantie = (id: string) => {
    if (!id.startsWith("custom-")) return;
    setGaranties((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* AMS header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm text-card-foreground">Garanties configurées ({garanties.filter((g) => g.active).length} actives)</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-3.5 w-3.5 mr-1" />{showAddForm ? "Annuler" : "Ajouter"}
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nom *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Garantie Premium" className="text-xs" />
            </div>
            <div>
              <Label className="text-xs">Fournisseur</Label>
              <Input value={newProvider} onChange={(e) => setNewProvider(e.target.value)} placeholder="AMS, autre..." className="text-xs" />
            </div>
            <div>
              <Label className="text-xs">Catégorie</Label>
              <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Mécanique" className="text-xs" />
            </div>
            <div>
              <Label className="text-xs">Type véhicule</Label>
              <Input value={newVehicleType} onChange={(e) => setNewVehicleType(e.target.value)} placeholder="VP" className="text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Durées & tarifs</Label>
            {newDurations.map((d, i) => (
              <div key={i} className="flex gap-2 items-center mb-2">
                <Input type="number" value={d.months} onChange={(e) => updateDuration(i, "months", Number(e.target.value))} className="w-16 text-xs" placeholder="Mois" />
                <span className="text-[10px] text-muted-foreground">mois</span>
                <Input type="number" value={d.costHT || ""} onChange={(e) => updateDuration(i, "costHT", Number(e.target.value))} className="w-20 text-xs" placeholder="Coût HT" />
                <Input type="number" value={d.priceHT || ""} onChange={(e) => updateDuration(i, "priceHT", Number(e.target.value))} className="w-20 text-xs" placeholder="Prix HT" />
                <span className="text-xs text-green-600 font-medium w-16">+{d.priceHT - d.costHT}€</span>
                {newDurations.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDuration(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addDuration} className="text-xs">
              <Plus className="h-3 w-3 mr-1" />Durée
            </Button>
          </div>
          <Button size="sm" onClick={addGarantie} disabled={!newName.trim()}>Ajouter la garantie</Button>
        </div>
      )}

      {/* Garanties list */}
      <div className="space-y-2">
        {garanties.map((g) => (
          <div key={g.id} className={`rounded-lg border p-3 transition-colors ${g.active ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-card-foreground">{g.name}</span>
                <Badge variant="outline" className="text-[9px]">{g.provider}</Badge>
                <Badge variant="secondary" className="text-[9px]">{g.vehicleType}</Badge>
              </div>
              <div className="flex items-center gap-2">
                {g.id.startsWith("custom-") && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeGarantie(g.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
                <Switch checked={g.active} onCheckedChange={() => toggleGarantie(g.id)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{g.category}</p>
            <div className="flex flex-wrap gap-2">
              {g.durations.map((d) => (
                <div key={d.months} className="rounded bg-muted/50 px-2 py-1 text-[10px]">
                  <span className="font-medium">{d.months} mois</span>
                  <span className="text-muted-foreground"> — Coût: {d.costHT}€ HT</span>
                  <span className="text-muted-foreground"> | Vente: {d.priceHT}€ HT</span>
                  <span className="text-green-600 font-medium"> (+{d.priceHT - d.costHT}€)</span>
                </div>
              ))}
            </div>
            {g.pdfUrl && (
              <a href={g.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-2">
                <FileText className="h-3 w-3" />Conditions particulières (PDF)
              </a>
            )}
          </div>
        ))}
      </div>

      {/* AMS link */}
      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        <p className="font-semibold text-card-foreground mb-1">AMS Garantie — Partenaire officiel</p>
        <p>Les 9 formules AMS sont pré-configurées. Modifiez les prix de vente pour ajuster votre marge.</p>
        <a href="https://www.ams-garantie.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 mt-1">
          <ExternalLink className="h-3 w-3" />www.ams-garantie.com
        </a>
      </div>
    </div>
  );
}
