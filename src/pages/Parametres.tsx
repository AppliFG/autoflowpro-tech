import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Users, FileText, Bell, Shield, BookOpen, Save, Upload, Lock, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const sections = [
  { icon: Users, title: "Utilisateurs & Rôles", description: "Gérer les accès et permissions" },
  { icon: FileText, title: "Templates", description: "Modèles d'annonces, factures, mandats" },
  { icon: Bell, title: "Notifications", description: "Alertes email, push et SMS" },
];

export default function Parametres() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [policeStart, setPoliceStart] = useState("1");
  const [rgpdText, setRgpdText] = useState(
    "Conformément au Règlement Général sur la Protection des Données (RGPD - UE 2016/679), les données personnelles collectées sont traitées dans le cadre de notre activité de vente de véhicules d'occasion. Vos données sont conservées pendant la durée légale requise et ne sont jamais transmises à des tiers sans votre consentement. Vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. Pour exercer vos droits, contactez-nous par email."
  );
  const [agencyName, setAgencyName] = useState("");
  const [agencyAddress, setAgencyAddress] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [agencyEmail, setAgencyEmail] = useState("");
  const [agencySiret, setAgencySiret] = useState("");
  const [agencyTva, setAgencyTva] = useState("");
  const [agencyLegalMentions, setAgencyLegalMentions] = useState("");
  const [agencyLogoUrl, setAgencyLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingPolice, setSavingPolice] = useState(false);
  const [savingRgpd, setSavingRgpd] = useState(false);
  const [savingAgency, setSavingAgency] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("app_settings").select("key, value").in("key", [
        "police_number_start", "rgpd_text",
        "agency_name", "agency_address", "agency_phone", "agency_email",
        "agency_siret", "agency_tva", "agency_legal_mentions", "agency_logo_url"
      ]);
      if (data) {
        for (const row of data) {
          if (row.key === "police_number_start") setPoliceStart(row.value);
          if (row.key === "rgpd_text") setRgpdText(row.value);
          if (row.key === "agency_name") setAgencyName(row.value);
          if (row.key === "agency_address") setAgencyAddress(row.value);
          if (row.key === "agency_phone") setAgencyPhone(row.value);
          if (row.key === "agency_email") setAgencyEmail(row.value);
          if (row.key === "agency_siret") setAgencySiret(row.value);
          if (row.key === "agency_tva") setAgencyTva(row.value);
          if (row.key === "agency_legal_mentions") setAgencyLegalMentions(row.value);
          if (row.key === "agency_logo_url") setAgencyLogoUrl(row.value);
        }
      }
    })();
  }, []);

  const changePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Mot de passe modifié avec succès");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logo.${ext}`;
      // Remove old logo first
      await supabase.storage.from("agency-assets").remove([path]);
      const { error } = await supabase.storage.from("agency-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("agency-assets").getPublicUrl(path);
      const url = urlData.publicUrl + "?t=" + Date.now();
      setAgencyLogoUrl(url);
      await supabase.from("app_settings").upsert({ key: "agency_logo_url", value: url }, { onConflict: "key" });
      toast.success("Logo mis à jour");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveAgency = async () => {
    setSavingAgency(true);
    try {
      const settings = [
        { key: "agency_name", value: agencyName },
        { key: "agency_address", value: agencyAddress },
        { key: "agency_phone", value: agencyPhone },
        { key: "agency_email", value: agencyEmail },
        { key: "agency_siret", value: agencySiret },
        { key: "agency_tva", value: agencyTva },
        { key: "agency_legal_mentions", value: agencyLegalMentions },
      ];
      for (const s of settings) {
        const { error } = await supabase.from("app_settings").upsert(s, { onConflict: "key" });
        if (error) throw error;
      }
      toast.success("Informations agence enregistrées");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingAgency(false);
    }
  };

  return (
    <AppLayout title="Paramètres">
      <div className="max-w-2xl space-y-4">
        {/* Agence */}
        <div
          className="rounded-xl border border-border bg-card p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection(activeSection === "agence" ? null : "agence")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Agence</h3>
                <p className="text-xs text-muted-foreground">Nom, adresse, SIRET, mentions légales</p>
              </div>
            </div>
            <Button variant="outline" size="sm">{activeSection === "agence" ? "Fermer" : "Configurer"}</Button>
          </div>
          {activeSection === "agence" && (
            <div className="mt-4 pt-4 border-t border-border space-y-4" onClick={(e) => e.stopPropagation()}>
              {/* Logo upload */}
              <div>
                <Label>Logo de l'agence</Label>
                <p className="text-xs text-muted-foreground mb-2">Format recommandé : PNG ou SVG, fond transparent.</p>
                <div className="flex items-center gap-4">
                  {agencyLogoUrl ? (
                    <img src={agencyLogoUrl} alt="Logo agence" className="h-16 w-16 rounded-lg object-contain border border-border bg-background p-1" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/30">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild disabled={uploadingLogo}>
                      <span>
                        <Upload className="h-4 w-4 mr-1.5" />
                        {uploadingLogo ? "Envoi..." : "Changer le logo"}
                      </span>
                    </Button>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agencyName">Nom de l'agence</Label>
                  <Input id="agencyName" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Mon Garage Auto" />
                </div>
                <div>
                  <Label htmlFor="agencyPhone">Téléphone</Label>
                  <Input id="agencyPhone" value={agencyPhone} onChange={(e) => setAgencyPhone(e.target.value)} placeholder="01 23 45 67 89" />
                </div>
                <div>
                  <Label htmlFor="agencyEmail">Email</Label>
                  <Input id="agencyEmail" type="email" value={agencyEmail} onChange={(e) => setAgencyEmail(e.target.value)} placeholder="contact@mongarage.fr" />
                </div>
                <div>
                  <Label htmlFor="agencySiret">SIRET</Label>
                  <Input id="agencySiret" value={agencySiret} onChange={(e) => setAgencySiret(e.target.value)} placeholder="123 456 789 00012" />
                </div>
                <div>
                  <Label htmlFor="agencyTva">N° TVA intracommunautaire</Label>
                  <Input id="agencyTva" value={agencyTva} onChange={(e) => setAgencyTva(e.target.value)} placeholder="FR12345678901" />
                </div>
              </div>
              <div>
                <Label htmlFor="agencyAddress">Adresse complète</Label>
                <Textarea id="agencyAddress" rows={2} value={agencyAddress} onChange={(e) => setAgencyAddress(e.target.value)} placeholder="12 rue du Commerce, 75015 Paris" />
              </div>
              <div>
                <Label htmlFor="agencyLegal">Mentions légales</Label>
                <p className="text-xs text-muted-foreground mb-1">Apparaîtront sur les factures et documents officiels.</p>
                <Textarea id="agencyLegal" rows={3} value={agencyLegalMentions} onChange={(e) => setAgencyLegalMentions(e.target.value)} placeholder="SAS au capital de... RCS Paris..." />
              </div>
              <Button onClick={saveAgency} disabled={savingAgency} size="sm">
                <Save className="h-4 w-4 mr-1.5" />
                {savingAgency ? "..." : "Enregistrer"}
              </Button>
            </div>
          )}
        </div>

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

        {/* Sécurité */}
        <div
          className="rounded-xl border border-border bg-card p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection(activeSection === "securite" ? null : "securite")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Sécurité</h3>
                <p className="text-xs text-muted-foreground">Mot de passe, sessions actives</p>
              </div>
            </div>
            <Button variant="outline" size="sm">{activeSection === "securite" ? "Fermer" : "Configurer"}</Button>
          </div>
          {activeSection === "securite" && (
            <div className="mt-4 pt-4 border-t border-border space-y-5" onClick={(e) => e.stopPropagation()}>
              {/* Email affiché */}
              <div>
                <Label>Adresse email du compte</Label>
                <p className="text-sm text-card-foreground mt-1">{userEmail || "—"}</p>
              </div>

              {/* Changement de mot de passe */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Changer le mot de passe</Label>
                <div>
                  <Label htmlFor="newPwd" className="text-xs">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="newPwd"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 caractères"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPwd" className="text-xs">Confirmer le nouveau mot de passe</Label>
                  <Input
                    id="confirmPwd"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retapez le mot de passe"
                  />
                </div>
                <Button onClick={changePassword} disabled={changingPassword || !newPassword || !confirmPassword} size="sm">
                  <Save className="h-4 w-4 mr-1.5" />
                  {changingPassword ? "..." : "Modifier le mot de passe"}
                </Button>
              </div>

              {/* 2FA info */}
              <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-card-foreground text-sm">Authentification à deux facteurs (2FA)</p>
                <p>La 2FA ajoute une couche de sécurité supplémentaire en demandant un code temporaire en plus de votre mot de passe.</p>
                <p className="text-primary font-medium">🔒 Cette fonctionnalité sera bientôt disponible.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
