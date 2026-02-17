import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Users, FileText, Bell, Shield, BookOpen, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const sections = [
  { icon: Building2, title: "Agence", description: "Nom, adresse, logo, mentions légales" },
  { icon: Users, title: "Utilisateurs & Rôles", description: "Gérer les accès et permissions" },
  { icon: FileText, title: "Templates", description: "Modèles d'annonces, factures, mandats" },
  { icon: Bell, title: "Notifications", description: "Alertes email, push et SMS" },
  { icon: Shield, title: "Sécurité", description: "Mot de passe, 2FA, sessions" },
];

export default function Parametres() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [policeStart, setPoliceStart] = useState("1");
  const [rgpdText, setRgpdText] = useState(
    "Conformément au Règlement Général sur la Protection des Données (RGPD - UE 2016/679), les données personnelles collectées sont traitées dans le cadre de notre activité de vente de véhicules d'occasion. Vos données sont conservées pendant la durée légale requise et ne sont jamais transmises à des tiers sans votre consentement. Vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. Pour exercer vos droits, contactez-nous par email."
  );
  const [savingPolice, setSavingPolice] = useState(false);
  const [savingRgpd, setSavingRgpd] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("app_settings").select("key, value").in("key", ["police_number_start", "rgpd_text"]);
      if (data) {
        for (const row of data) {
          if (row.key === "police_number_start") setPoliceStart(row.value);
          if (row.key === "rgpd_text") setRgpdText(row.value);
        }
      }
    })();
  }, []);

  const savePoliceStart = async () => {
    setSavingPolice(true);
    try {
      const { error } = await supabase.from("app_settings").upsert({ key: "police_number_start", value: policeStart }, { onConflict: "key" });
      if (error) throw error;
      toast.success("Numéro de départ enregistré");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingPolice(false);
    }
  };

  const saveRgpdText = async () => {
    setSavingRgpd(true);
    try {
      const { error } = await supabase.from("app_settings").upsert({ key: "rgpd_text", value: rgpdText }, { onConflict: "key" });
      if (error) throw error;
      toast.success("Mentions RGPD enregistrées");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingRgpd(false);
    }
  };

  return (
    <AppLayout title="Paramètres">
      <div className="max-w-2xl space-y-4">
        {sections.map((s) => (
          <div key={s.title} className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Configurer</Button>
          </div>
        ))}

        {/* Livre de police */}
        <div
          className="rounded-xl border border-border bg-card p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection(activeSection === "police" ? null : "police")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Livre de Police</h3>
                <p className="text-xs text-muted-foreground">Numéro de départ pour le registre VO</p>
              </div>
            </div>
            <Button variant="outline" size="sm">{activeSection === "police" ? "Fermer" : "Configurer"}</Button>
          </div>
          {activeSection === "police" && (
            <div className="mt-4 pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
              <Label htmlFor="policeStart">Numéro de police de départ</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Les nouveaux véhicules recevront un numéro à partir de cette valeur (si aucun numéro supérieur n'existe déjà).
              </p>
              <div className="flex gap-2">
                <Input
                  id="policeStart"
                  type="number"
                  min={1}
                  value={policeStart}
                  onChange={(e) => setPoliceStart(e.target.value)}
                  className="max-w-[200px]"
                />
                <Button onClick={savePoliceStart} disabled={savingPolice} size="sm">
                  <Save className="h-4 w-4 mr-1.5" />
                  {savingPolice ? "..." : "Enregistrer"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* RGPD */}
        <div
          className="rounded-xl border border-border bg-card p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection(activeSection === "rgpd" ? null : "rgpd")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">RGPD & Données personnelles</h3>
                <p className="text-xs text-muted-foreground">Mentions légales, consentement, droits des personnes</p>
              </div>
            </div>
            <Button variant="outline" size="sm">{activeSection === "rgpd" ? "Fermer" : "Configurer"}</Button>
          </div>
          {activeSection === "rgpd" && (
            <div className="mt-4 pt-4 border-t border-border space-y-4" onClick={(e) => e.stopPropagation()}>
              <div>
                <Label>Mentions RGPD</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Ce texte sera affiché aux clients lors des formulaires de reprise et sur la vitrine.
                </p>
                <Textarea
                  rows={5}
                  value={rgpdText}
                  onChange={(e) => setRgpdText(e.target.value)}
                />
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-card-foreground text-sm">Rappel des obligations RGPD :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Base légale</strong> : consentement explicite ou intérêt légitime</li>
                  <li><strong>Durée de conservation</strong> : données clients supprimées après 3 ans d'inactivité (sauf obligation légale)</li>
                  <li><strong>Droits des personnes</strong> : accès, rectification, effacement, portabilité, opposition</li>
                  <li><strong>Registre des traitements</strong> : à tenir à jour (responsable du traitement)</li>
                  <li><strong>Livre de police</strong> : conservation obligatoire 6 ans (Art. R321-9 du Code de la route)</li>
                  <li><strong>Sous-traitants</strong> : informer des tiers ayant accès aux données</li>
                </ul>
              </div>
              <Button onClick={saveRgpdText} disabled={savingRgpd} size="sm">
                <Save className="h-4 w-4 mr-1.5" />
                {savingRgpd ? "..." : "Enregistrer les mentions"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
