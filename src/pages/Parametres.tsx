import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Building2, Users, FileText, Bell, Shield, BookOpen, Save, Upload, Lock, Eye, EyeOff, UserPlus, Trash2, Truck, History, Plus, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const DEV_EMAIL = "applibyfg@gmail.com";

// Notification preferences keys
const notifKeys = [
  { key: "notif_email_vente", label: "Vente confirmée", desc: "Email envoyé lors d'une vente" },
  { key: "notif_email_reprise", label: "Nouvelle reprise", desc: "Email pour chaque demande de reprise" },
  { key: "notif_email_stock60", label: "Stock > 60 jours", desc: "Alerte véhicule en stock depuis +60 jours" },
  { key: "notif_email_mandat_fin", label: "Fin de mandat", desc: "Alerte mandat dépôt-vente arrivant à échéance" },
  { key: "notif_sms_vente", label: "SMS vente", desc: "Notification SMS à chaque vente" },
  { key: "notif_sms_rdv", label: "SMS rendez-vous", desc: "Rappel SMS avant les événements agenda" },
];

export default function Parametres() {
  const queryClient = useQueryClient();
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

  // Templates
  const [templateAnnonce, setTemplateAnnonce] = useState("{{marque}} {{modele}} {{version}} - {{annee}} - {{kilometrage}} km\n{{carburant}} - {{couleur}}\nPrix : {{prix_vente}} €\n\n{{description}}");
  const [templateFacture, setTemplateFacture] = useState("FACTURE N° {{numero}}\nDate : {{date}}\n\nVendeur :\n{{agence_nom}}\n{{agence_adresse}}\nSIRET : {{agence_siret}}\nTVA : {{agence_tva}}\n\nAcheteur :\n{{client_nom}}\n{{client_adresse}}\n\nDésignation : {{marque}} {{modele}} {{version}}\nImmatriculation : {{immatriculation}}\nKilométrage : {{kilometrage}} km\nPrix TTC : {{prix_vente}} €\n\n{{mentions_legales}}");
  const [templateMandat, setTemplateMandat] = useState("MANDAT DE VENTE N° {{numero}}\nDate : {{date}}\n\nEntre :\n{{agence_nom}} (le Mandataire)\n{{agence_adresse}}\nSIRET : {{agence_siret}}\n\nEt :\n{{client_nom}} (le Mandant)\n\nVéhicule : {{marque}} {{modele}} {{version}}\nImmatriculation : {{immatriculation}}\nPrix souhaité : {{prix_vente}} €\nDurée du mandat : {{duree}} jours\n\n{{mentions_legales}}");
  const [savingTemplates, setSavingTemplates] = useState(false);
  
  // Notifications
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({});
  const [savingNotifs, setSavingNotifs] = useState(false);
  
  const [currentUserId, setCurrentUserId] = useState("");

  // Users management
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("commercial");
  const [inviting, setInviting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fournisseur supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression du fournisseur"),
  });

  // Supplier form state
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierTelegram, setSupplierTelegram] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [savingSupplier, setSavingSupplier] = useState(false);

  const resetSupplierForm = () => {
    setShowSupplierForm(false);
    setEditingSupplierId(null);
    setSupplierName("");
    setSupplierEmail("");
    setSupplierPhone("");
    setSupplierTelegram("");
    setSupplierAddress("");
  };

  const openEditSupplier = (s: any) => {
    setEditingSupplierId(s.id);
    setSupplierName(s.name || "");
    setSupplierEmail(s.email || "");
    setSupplierPhone(s.phone || "");
    setSupplierTelegram(s.telegram || "");
    setSupplierAddress(s.address || "");
    setShowSupplierForm(true);
  };

  const saveSupplier = async () => {
    if (!supplierName.trim()) { toast.error("Le nom est requis"); return; }
    setSavingSupplier(true);
    try {
      const payload = { name: supplierName.trim(), email: supplierEmail || null, phone: supplierPhone || null, telegram: supplierTelegram || null, address: supplierAddress || null };
      if (editingSupplierId) {
        const { error } = await supabase.from("suppliers").update(payload).eq("id", editingSupplierId);
        if (error) throw error;
        toast.success("Fournisseur modifié");
      } else {
        const { error } = await supabase.from("suppliers").insert(payload);
        if (error) throw error;
        toast.success("Fournisseur ajouté");
      }
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      resetSupplierForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingSupplier(false);
    }
  };

  const isDevUser = userEmail === DEV_EMAIL;

  // Invoice history
  const { data: invoices = [], refetch: refetchInvoices } = useQuery({
    queryKey: ["invoices-history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*, vehicles(brand, model, registration)").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const [deleteInvoiceCode, setDeleteInvoiceCode] = useState("");
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const openDeleteInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setDeleteInvoiceCode("");
    setShowDeleteDialog(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!selectedInvoice) return;
    // Extract invoice number from invoice_number field (e.g., "FA-0002" -> 2)
    const numMatch = selectedInvoice.invoice_number.match(/(\d+)/);
    const invoiceNum = numMatch ? parseInt(numMatch[1], 10) : 0;
    const expectedCode = `FG${String(invoiceNum).padStart(4, "0")}`;
    if (deleteInvoiceCode.toUpperCase() !== expectedCode) {
      toast.error(`Code incorrect. Le code attendu est au format FG suivi du numéro de facture.`);
      return;
    }
    setDeletingInvoiceId(selectedInvoice.id);
    try {
      const { error } = await supabase.from("invoices").delete().eq("id", selectedInvoice.id);
      if (error) throw error;
      toast.success("Facture supprimée de l'historique");
      refetchInvoices();
      setShowDeleteDialog(false);
      setSelectedInvoice(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    commercial: "Commercial",
    comptable: "Comptable",
  };

  const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
    admin: "default",
    commercial: "secondary",
    comptable: "outline",
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
      if (data.user?.id) setCurrentUserId(data.user.id);
    });
  }, []);

  const loadTeamUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: roles } = await supabase.from("user_roles").select("*");
      if (profiles && roles) {
        const merged = profiles.map((p) => ({
          ...p,
          role: roles.find((r) => r.user_id === p.user_id)?.role || null,
        }));
        setTeamUsers(merged);
        const currentRole = roles.find((r) => r.user_id === currentUserId);
        setIsAdmin(currentRole?.role === "admin");
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (currentUserId) loadTeamUsers();
  }, [currentUserId]);

  const inviteUser = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await supabase.functions.invoke("invite-user", {
        body: { email: inviteEmail, full_name: inviteName, role: inviteRole },
      });
      if (resp.error) throw new Error(resp.error.message);
      if (resp.data?.error) throw new Error(resp.data.error);
      toast.success(`Invitation envoyée à ${inviteEmail}`);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("commercial");
      loadTeamUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setInviting(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("app_settings").select("key, value").in("key", [
        "police_number_start", "rgpd_text",
        "agency_name", "agency_address", "agency_phone", "agency_email",
        "agency_siret", "agency_tva", "agency_legal_mentions", "agency_logo_url",
        "template_annonce", "template_facture", "template_mandat",
        ...notifKeys.map(n => n.key),
      ]);
      if (data) {
        const nPrefs: Record<string, boolean> = {};
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
          if (row.key === "template_annonce") setTemplateAnnonce(row.value);
          if (row.key === "template_facture") setTemplateFacture(row.value);
          if (row.key === "template_mandat") setTemplateMandat(row.value);
          if (row.key.startsWith("notif_")) nPrefs[row.key] = row.value === "true";
        }
        setNotifPrefs(nPrefs);
      }
    })();
  }, []);

  const saveTemplates = async () => {
    setSavingTemplates(true);
    try {
      const settings = [
        { key: "template_annonce", value: templateAnnonce },
        { key: "template_facture", value: templateFacture },
        { key: "template_mandat", value: templateMandat },
      ];
      for (const s of settings) {
        const { error } = await supabase.from("app_settings").upsert(s, { onConflict: "key" });
        if (error) throw error;
      }
      toast.success("Templates enregistrés");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingTemplates(false);
    }
  };

  const saveNotifs = async () => {
    setSavingNotifs(true);
    try {
      for (const [key, val] of Object.entries(notifPrefs)) {
        const { error } = await supabase.from("app_settings").upsert({ key, value: String(val) }, { onConflict: "key" });
        if (error) throw error;
      }
      toast.success("Préférences de notifications enregistrées");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingNotifs(false);
    }
  };

  const toggleNotif = (key: string) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

        {/* Utilisateurs & Rôles */}
        <div
          className="rounded-xl border border-border bg-card p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection(activeSection === "users" ? null : "users")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Utilisateurs & Rôles</h3>
                <p className="text-xs text-muted-foreground">Gérer les accès et permissions</p>
              </div>
            </div>
            <Button variant="outline" size="sm">{activeSection === "users" ? "Fermer" : "Configurer"}</Button>
          </div>
          {activeSection === "users" && (
            <div className="mt-4 pt-4 border-t border-border space-y-5" onClick={(e) => e.stopPropagation()}>
              {/* Users list */}
              <div>
                <Label className="text-sm font-semibold">Membres de l'équipe</Label>
                {loadingUsers ? (
                  <p className="text-sm text-muted-foreground mt-2">Chargement...</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {teamUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-card-foreground">{u.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {u.role && (
                            <Badge variant={roleBadgeVariant[u.role] || "outline"}>
                              {roleLabels[u.role] || u.role}
                            </Badge>
                          )}
                          {u.user_id === currentUserId && (
                            <Badge variant="outline" className="text-xs">Vous</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {teamUsers.length === 0 && (
                      <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Invite form (admin only) */}
              {isAdmin && (
                <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4" /> Inviter un utilisateur
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="invEmail" className="text-xs">Email</Label>
                      <Input id="invEmail" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="collaborateur@email.com" />
                    </div>
                    <div>
                      <Label htmlFor="invName" className="text-xs">Nom complet</Label>
                      <Input id="invName" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Jean Dupont" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Rôle</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="comptable">Comptable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={inviteUser} disabled={inviting || !inviteEmail} size="sm">
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    {inviting ? "Envoi..." : "Envoyer l'invitation"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Templates */}
        <div
          className="rounded-xl border border-border bg-card p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection(activeSection === "templates" ? null : "templates")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Templates</h3>
                <p className="text-xs text-muted-foreground">Modèles d'annonces, factures, mandats</p>
              </div>
            </div>
            <Button variant="outline" size="sm">{activeSection === "templates" ? "Fermer" : "Configurer"}</Button>
          </div>
          {activeSection === "templates" && (
            <div className="mt-4 pt-4 border-t border-border space-y-5" onClick={(e) => e.stopPropagation()}>
              <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-card-foreground text-sm">Variables disponibles</p>
                <p>Utilisez ces balises dans vos modèles, elles seront remplacées automatiquement :</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {["{{marque}}", "{{modele}}", "{{version}}", "{{annee}}", "{{kilometrage}}", "{{carburant}}", "{{couleur}}", "{{prix_vente}}", "{{prix_achat}}", "{{immatriculation}}", "{{description}}", "{{numero}}", "{{date}}", "{{client_nom}}", "{{client_adresse}}", "{{agence_nom}}", "{{agence_adresse}}", "{{agence_siret}}", "{{agence_tva}}", "{{mentions_legales}}", "{{duree}}"].map((v) => (
                    <code key={v} className="bg-background border border-border rounded px-1.5 py-0.5 text-[10px] font-mono text-foreground">{v}</code>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Modèle d'annonce</Label>
                <p className="text-xs text-muted-foreground mb-1.5">Utilisé pour la diffusion des véhicules sur la vitrine et les plateformes.</p>
                <Textarea rows={6} value={templateAnnonce} onChange={(e) => setTemplateAnnonce(e.target.value)} className="font-mono text-xs" />
              </div>

              <div>
                <Label className="text-sm font-semibold">Modèle de facture</Label>
                <p className="text-xs text-muted-foreground mb-1.5">Structure de la facture générée pour chaque vente.</p>
                <Textarea rows={10} value={templateFacture} onChange={(e) => setTemplateFacture(e.target.value)} className="font-mono text-xs" />
              </div>

              <div>
                <Label className="text-sm font-semibold">Modèle de mandat de vente</Label>
                <p className="text-xs text-muted-foreground mb-1.5">Utilisé pour les dépôts-vente et mandats de mise en vente.</p>
                <Textarea rows={10} value={templateMandat} onChange={(e) => setTemplateMandat(e.target.value)} className="font-mono text-xs" />
              </div>

              <Button onClick={saveTemplates} disabled={savingTemplates} size="sm">
                <Save className="h-4 w-4 mr-1.5" />
                {savingTemplates ? "..." : "Enregistrer les templates"}
              </Button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div
          className="rounded-xl border border-border bg-card p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection(activeSection === "notifications" ? null : "notifications")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Notifications</h3>
                <p className="text-xs text-muted-foreground">Alertes email, push et SMS</p>
              </div>
            </div>
            <Button variant="outline" size="sm">{activeSection === "notifications" ? "Fermer" : "Configurer"}</Button>
          </div>
          {activeSection === "notifications" && (
            <div className="mt-4 pt-4 border-t border-border space-y-4" onClick={(e) => e.stopPropagation()}>
              <div>
                <Label className="text-sm font-semibold">Alertes Email</Label>
                <div className="mt-2 space-y-2">
                  {notifKeys.filter(n => n.key.startsWith("notif_email_")).map(n => (
                    <label key={n.key} className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{n.label}</p>
                        <p className="text-xs text-muted-foreground">{n.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!notifPrefs[n.key]}
                        onChange={() => toggleNotif(n.key)}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Alertes SMS</Label>
                <div className="mt-2 space-y-2">
                  {notifKeys.filter(n => n.key.startsWith("notif_sms_")).map(n => (
                    <label key={n.key} className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{n.label}</p>
                        <p className="text-xs text-muted-foreground">{n.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!notifPrefs[n.key]}
                        onChange={() => toggleNotif(n.key)}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground">
                <p className="font-semibold text-card-foreground text-sm mb-1">💡 Info</p>
                <p>Les notifications email utilisent l'adresse configurée dans votre profil. Les SMS nécessitent un numéro de téléphone associé à votre compte.</p>
              </div>
              <Button onClick={saveNotifs} disabled={savingNotifs} size="sm">
                <Save className="h-4 w-4 mr-1.5" />
                {savingNotifs ? "..." : "Enregistrer les préférences"}
              </Button>
            </div>
          )}
        </div>

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

        {/* Fournisseurs */}
        <div
          className="rounded-xl border border-border bg-card p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection(activeSection === "fournisseurs" ? null : "fournisseurs")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Fournisseurs</h3>
                <p className="text-xs text-muted-foreground">Ajouter, modifier ou supprimer vos fournisseurs</p>
              </div>
            </div>
            <Button variant="outline" size="sm">{activeSection === "fournisseurs" ? "Fermer" : "Gérer"}</Button>
          </div>
          {activeSection === "fournisseurs" && (
            <div className="mt-4 pt-4 border-t border-border space-y-3" onClick={(e) => e.stopPropagation()}>
              {/* Supplier list */}
              {suppliers.length === 0 && !showSupplierForm ? (
                <p className="text-sm text-muted-foreground">Aucun fournisseur enregistré.</p>
              ) : (
                <div className="divide-y divide-border rounded-lg border border-border">
                  {suppliers.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.email || "—"} · {s.phone || "—"}{s.telegram ? ` · Telegram: ${s.telegram}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary" onClick={() => openEditSupplier(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => { if (confirm(`Supprimer le fournisseur "${s.name}" ?`)) deleteSupplierMutation.mutate(s.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add/Edit form */}
              {showSupplierForm ? (
                <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
                  <Label className="text-sm font-semibold">{editingSupplierId ? "Modifier le fournisseur" : "Nouveau fournisseur"}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Nom *</Label>
                      <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Nom du fournisseur" />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input type="email" value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} placeholder="email@fournisseur.com" />
                    </div>
                    <div>
                      <Label className="text-xs">Téléphone</Label>
                      <Input value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} placeholder="01 23 45 67 89" />
                    </div>
                    <div>
                      <Label className="text-xs">Telegram Chat ID</Label>
                      <Input value={supplierTelegram} onChange={(e) => setSupplierTelegram(e.target.value)} placeholder="Ex: 7219387456" />
                      <p className="text-[10px] text-muted-foreground mt-0.5">Envoyez /start au bot puis @userinfobot pour obtenir l'ID</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Adresse</Label>
                    <Input value={supplierAddress} onChange={(e) => setSupplierAddress(e.target.value)} placeholder="Adresse du fournisseur" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveSupplier} disabled={savingSupplier} size="sm">
                      <Save className="h-4 w-4 mr-1.5" />
                      {savingSupplier ? "..." : editingSupplierId ? "Modifier" : "Ajouter"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetSupplierForm}>Annuler</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => { resetSupplierForm(); setShowSupplierForm(true); }}>
                  <Plus className="h-4 w-4 mr-1.5" /> Ajouter un fournisseur
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Historique des factures - DEV only */}
        {isDevUser && (
        <div
          className="rounded-xl border border-border bg-card p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection(activeSection === "historique" ? null : "historique")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Historique des factures</h3>
                <p className="text-xs text-muted-foreground">Consulter et supprimer des factures (compte DEV)</p>
              </div>
            </div>
            <Button variant="outline" size="sm">{activeSection === "historique" ? "Fermer" : "Consulter"}</Button>
          </div>
          {activeSection === "historique" && (
            <div className="mt-4 pt-4 border-t border-border space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                <p>⚠️ La suppression d'une facture nécessite un code de sécurité : <strong>FG</strong> suivi du numéro de facture (ex : <code className="bg-background border border-border rounded px-1 py-0.5">FG0002</code> pour la facture n°2).</p>
              </div>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune facture dans l'historique.</p>
              ) : (
                <div className="divide-y divide-border rounded-lg border border-border max-h-[400px] overflow-y-auto">
                  {invoices.map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{inv.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.client_nom} — {inv.vehicles ? `${inv.vehicles.brand} ${inv.vehicles.model}` : "—"} — {Number(inv.amount).toLocaleString()} €
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => openDeleteInvoice(inv)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        )}


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

      {/* Delete invoice dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer une facture</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pour confirmer la suppression de la facture <strong>{selectedInvoice?.invoice_number}</strong>, entrez le code de sécurité :
            </p>
            <p className="text-xs text-muted-foreground">
              Format : <strong>FG</strong> suivi du numéro de facture sur 4 chiffres (ex : FG0002)
            </p>
            <Input
              placeholder="Ex: FG0002"
              value={deleteInvoiceCode}
              onChange={(e) => setDeleteInvoiceCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmDeleteInvoice()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDeleteInvoice} disabled={!deleteInvoiceCode || !!deletingInvoiceId}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              {deletingInvoiceId ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
