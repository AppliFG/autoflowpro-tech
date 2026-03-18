import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Upload, MapPin, Phone, Mail, FileText, Check, ChevronRight, ChevronLeft, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const STEPS = [
  { id: 1, title: "Identité", icon: Building2, desc: "Nom & logo de votre agence" },
  { id: 2, title: "Coordonnées", icon: MapPin, desc: "Adresse & contact" },
  { id: 3, title: "Légal", icon: FileText, desc: "SIRET, TVA & mentions" },
];

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [agencyName, setAgencyName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Step 2
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Step 3
  const [siret, setSiret] = useState("");
  const [tva, setTva] = useState("");
  const [legalMentions, setLegalMentions] = useState("");
  const [policeStart, setPoliceStart] = useState("1");

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logo.${ext}`;
      await supabase.storage.from("agency-assets").remove([path]);
      const { error } = await supabase.storage.from("agency-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("agency-assets").getPublicUrl(path);
      const url = urlData.publicUrl + "?t=" + Date.now();
      setLogoUrl(url);
      await supabase.from("app_settings").upsert({ key: "agency_logo_url", value: url }, { onConflict: "key" });
      toast.success("Logo uploadé !");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const canNext = () => {
    if (step === 1) return agencyName.trim().length > 0;
    return true;
  };

  const handleFinish = async () => {
    if (!agencyName.trim()) {
      toast.error("Le nom de l'agence est requis");
      return;
    }
    setSaving(true);
    try {
      const settings = [
        { key: "agency_name", value: agencyName.trim() },
        { key: "agency_address", value: address },
        { key: "agency_phone", value: phone },
        { key: "agency_email", value: email },
        { key: "agency_siret", value: siret },
        { key: "agency_tva", value: tva },
        { key: "agency_legal_mentions", value: legalMentions },
        { key: "police_number_start", value: policeStart },
        { key: "onboarding_completed", value: "true" },
        { key: "install_date", value: new Date().toISOString() },
      ];
      for (const s of settings) {
        const { error } = await supabase.from("app_settings").upsert(s, { onConflict: "key" });
        if (error) throw error;
      }
      toast.success("Configuration terminée ! Bienvenue 🎉");
      onComplete();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                step > s.id
                  ? "bg-primary text-primary-foreground"
                  : step === s.id
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              )}>
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className={cn("text-sm font-medium hidden sm:inline", step === s.id ? "text-foreground" : "text-muted-foreground")}>
                {s.title}
              </span>
              {i < STEPS.length - 1 && <div className={cn("w-8 sm:w-12 h-0.5", step > s.id ? "bg-primary" : "bg-muted")} />}
            </div>
          ))}
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
              {step === 1 && <Building2 className="w-7 h-7 text-primary" />}
              {step === 2 && <MapPin className="w-7 h-7 text-primary" />}
              {step === 3 && <FileText className="w-7 h-7 text-primary" />}
            </div>
            <CardTitle className="text-xl">
              {step === 1 && "Identité de votre agence"}
              {step === 2 && "Coordonnées"}
              {step === 3 && "Informations légales"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Commencez par donner un nom à votre agence et uploadez votre logo"}
              {step === 2 && "Renseignez l'adresse et les moyens de contact"}
              {step === 3 && "Ajoutez vos informations légales pour les documents officiels"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {/* Step 1: Identity */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'agence *</Label>
                  <Input id="name" placeholder="Ex: AutoPremium Lyon" value={agencyName} onChange={e => setAgencyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-lg border bg-background" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      <Button variant="outline" size="sm" asChild disabled={uploadingLogo}>
                        <span><Upload className="w-4 h-4 mr-2" />{uploadingLogo ? "Upload..." : "Choisir un fichier"}</span>
                      </Button>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Contact */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse complète</Label>
                  <Textarea id="address" placeholder="12 rue de la Paix, 75001 Paris" value={address} onChange={e => setAddress(e.target.value)} rows={2} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone"><Phone className="w-3.5 h-3.5 inline mr-1" />Téléphone</Label>
                    <Input id="phone" placeholder="01 23 45 67 89" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email"><Mail className="w-3.5 h-3.5 inline mr-1" />Email</Label>
                    <Input id="email" type="email" placeholder="contact@agence.fr" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Legal */}
            {step === 3 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siret">SIRET</Label>
                    <Input id="siret" placeholder="123 456 789 00012" value={siret} onChange={e => setSiret(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tva">N° TVA</Label>
                    <Input id="tva" placeholder="FR12345678901" value={tva} onChange={e => setTva(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="police">N° de départ du livre de police</Label>
                  <Input id="police" type="number" min="1" value={policeStart} onChange={e => setPoliceStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mentions">Mentions légales</Label>
                  <Textarea id="mentions" placeholder="Mentions légales affichées sur vos documents..." value={legalMentions} onChange={e => setLegalMentions(e.target.value)} rows={3} />
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" />Retour
                </Button>
              ) : <div />}
              {step < 3 ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
                  Suivant<ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={saving || !canNext()}>
                  <Rocket className="w-4 h-4 mr-1" />{saving ? "Enregistrement..." : "Terminer"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Vous pourrez modifier ces informations à tout moment dans Paramètres.
        </p>
      </div>
    </div>
  );
}
