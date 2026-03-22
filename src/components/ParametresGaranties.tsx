import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { GarantieOption } from "@/types/vehicle";

const SETTINGS_KEY = "garanties_list";

export default function ParametresGaranties() {
  const [garanties, setGaranties] = useState<GarantieOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState("");

  // Load from app_settings
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();
      if (data?.value) {
        try {
          setGaranties(JSON.parse(data.value));
        } catch { /* ignore */ }
      }
      setLoaded(true);
    })();
  }, []);

  // Persist to app_settings
  const persist = async (list: GarantieOption[]) => {
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: SETTINGS_KEY, value: JSON.stringify(list) }, { onConflict: "key" });
    if (error) toast.error("Erreur de sauvegarde");
  };

  const toggleGarantie = (id: string) => {
    const updated = garanties.map((g) => (g.id === id ? { ...g, active: !g.active } : g));
    setGaranties(updated);
    persist(updated);
  };

  const addGarantie = () => {
    if (!newName.trim()) return;
    const cost = parseFloat(newCost) || 0;
    const newG: GarantieOption = {
      id: `gar-${Date.now()}`,
      name: newName.trim(),
      costHT: cost,
      active: true,
    };
    const updated = [...garanties, newG];
    setGaranties(updated);
    persist(updated);
    setNewName("");
    setNewCost("");
    setShowAddForm(false);
    toast.success("Garantie ajoutée");
  };

  const removeGarantie = (id: string) => {
    const updated = garanties.filter((g) => g.id !== id);
    setGaranties(updated);
    persist(updated);
    toast.success("Garantie supprimée");
  };

  if (!loaded) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm text-card-foreground">
            Garanties ({garanties.filter((g) => g.active).length} actives)
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {showAddForm ? "Annuler" : "Ajouter"}
        </Button>
      </div>

      {showAddForm && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nom de la garantie *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Garantie 12 mois"
                className="text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Coût HT (€)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                placeholder="0"
                className="text-xs"
              />
            </div>
          </div>
          <Button size="sm" onClick={addGarantie} disabled={!newName.trim()}>
            Ajouter la garantie
          </Button>
        </div>
      )}

      {garanties.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune garantie configurée.</p>
      ) : (
        <div className="space-y-2">
          {garanties.map((g) => (
            <div
              key={g.id}
              className={`rounded-lg border p-3 transition-colors ${
                g.active ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm text-card-foreground">{g.name}</span>
                  <span className="text-xs text-muted-foreground">{g.costHT} € HT</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeGarantie(g.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                  <Switch checked={g.active} onCheckedChange={() => toggleGarantie(g.id)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
