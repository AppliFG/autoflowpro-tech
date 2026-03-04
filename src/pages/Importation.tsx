import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Download, Trash2, Eye, Plus, Filter, FileText, Image as ImageIcon,
  Send, RefreshCw, Car, Building, Briefcase, MoreHorizontal, Pencil,
  Upload, CheckCircle, Loader2, ChevronDown, ChevronUp, Copy, ExternalLink,
  Sparkles, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const CATEGORIES = ["Véhicule", "Bâtiment", "Société", "Divers"];
const SUBCATEGORIES: Record<string, string[]> = {
  "Véhicule": ["Carburant", "Pièces", "Entretien", "Contrôle technique", "Assurance", "Carte grise", "Lavage", "Autre"],
  "Bâtiment": ["Loyer", "Électricité", "Eau", "Internet", "Travaux", "Ménage", "Assurance", "Autre"],
  "Société": ["Comptable", "Assurance", "Téléphone", "Abonnement", "Fournitures", "Marketing", "Juridique", "Autre"],
  "Divers": ["Autre"],
};

const PAYMENT_METHODS = ["CB", "Espèces", "Virement", "Chèque", "Prélèvement", "Autre"];

interface Expense {
  id: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  amount: number;
  expense_date: string | null;
  vehicle_id: string | null;
  supplier_name: string | null;
  invoice_number: string | null;
  file_url: string | null;
  file_type: string | null;
  source: string;
  ai_extracted_data: any;
  notes: string | null;
  created_at: string;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  registration: string;
}

export default function Importation() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterVehicle, setFilterVehicle] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // Form state
  const [formCategory, setFormCategory] = useState("Divers");
  const [formSubcategory, setFormSubcategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formVehicleId, setFormVehicleId] = useState("");
  const [formSupplier, setFormSupplier] = useState("");
  const [formInvoiceNumber, setFormInvoiceNumber] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formPaymentMethod, setFormPaymentMethod] = useState("");

  useEffect(() => {
    fetchExpenses();
    fetchVehicles();
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    setWebhookUrl(`https://${projectId}.supabase.co/functions/v1/telegram-webhook`);
  }, []);

  // Extract unique suppliers from existing expenses
  useEffect(() => {
    const uniqueSuppliers = [...new Set(
      expenses.map(e => e.supplier_name).filter(Boolean) as string[]
    )].sort();
    setSuppliers(uniqueSuppliers);
  }, [expenses]);

  const fetchExpenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les dépenses", variant: "destructive" });
    } else {
      setExpenses((data as any[]) || []);
    }
    setLoading(false);
  };

  const fetchVehicles = async () => {
    const { data } = await supabase.from("vehicles").select("id, brand, model, registration");
    if (data) setVehicles(data);
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (filterCategory !== "all" && e.category !== filterCategory) return false;
      if (filterSource !== "all" && e.source !== filterSource) return false;
      if (filterVehicle !== "all" && e.vehicle_id !== filterVehicle) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          e.description?.toLowerCase().includes(search) ||
          e.supplier_name?.toLowerCase().includes(search) ||
          e.invoice_number?.toLowerCase().includes(search) ||
          e.category.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [expenses, filterCategory, filterSource, filterVehicle, searchTerm]);

  const totals = useMemo(() => {
    const byCategory: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    return { byCategory, total };
  }, [filteredExpenses]);

  const resetForm = () => {
    setFormCategory("Divers");
    setFormSubcategory("");
    setFormDescription("");
    setFormAmount("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormVehicleId("");
    setFormSupplier("");
    setFormInvoiceNumber("");
    setFormNotes("");
    setFormPaymentMethod("");
    setUploadFile(null);
  };

  const handleFileUpload = async (file: File): Promise<{ url: string; type: string } | null> => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const storagePath = `uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const contentType = file.type || (ext === "pdf" ? "application/pdf" : `image/${ext}`);

    const { error } = await supabase.storage
      .from("expense-documents")
      .upload(storagePath, file, { contentType, upsert: false });

    if (error) {
      toast({ title: "Erreur upload", description: error.message, variant: "destructive" });
      return null;
    }

    const { data } = supabase.storage.from("expense-documents").getPublicUrl(storagePath);
    const fileType = ext === "pdf" ? "pdf" : "photo";
    return { url: data.publicUrl, type: fileType };
  };

  // AI extraction from uploaded file
  const handleAIExtract = async (fileUrl: string, fileType: string) => {
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-expense", {
        body: { file_url: fileUrl, file_type: fileType, caption: formNotes || "" },
      });

      if (error) {
        console.error("Extract error:", error);
        toast({ title: "Extraction IA", description: "Erreur lors de l'analyse. Saisie manuelle requise.", variant: "destructive" });
        return;
      }

      if (data?.extracted) {
        const ext = data.extracted;
        if (ext.category) setFormCategory(ext.category);
        if (ext.subcategory) setFormSubcategory(ext.subcategory);
        if (ext.amount) setFormAmount(String(ext.amount));
        if (ext.description) setFormDescription(ext.description);
        if (ext.supplier_name) setFormSupplier(ext.supplier_name);
        if (ext.invoice_number) setFormInvoiceNumber(ext.invoice_number);
        if (ext.expense_date) setFormDate(ext.expense_date);
        if (ext.payment_method) setFormPaymentMethod(ext.payment_method);
        if (ext.vehicle_id) setFormVehicleId(ext.vehicle_id);
        else if (ext.registration) {
          // Try to match locally
          const normalizedReg = ext.registration.replace(/[\s-]/g, "").toUpperCase();
          const match = vehicles.find(v =>
            v.registration.replace(/[\s-]/g, "").toUpperCase() === normalizedReg
          );
          if (match) {
            setFormVehicleId(match.id);
            setFormCategory("Véhicule");
          }
        }

        toast({
          title: "✨ Extraction IA réussie",
          description: `${ext.supplier_name || "Document"} — ${ext.amount ? ext.amount.toFixed(2) + " €" : "montant à vérifier"}`,
        });
      } else if (data?.error) {
        toast({ title: "Extraction IA", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      console.error("AI extract failed:", err);
      toast({ title: "Erreur", description: "Impossible d'analyser le document", variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  };

  // Handle file selection + auto-upload + AI extract
  const handleFileSelected = async (file: File) => {
    setUploadFile(file);
    setUploading(true);
    try {
      const result = await handleFileUpload(file);
      if (result) {
        // Store the URL temporarily for later save
        (file as any).__uploadedUrl = result.url;
        (file as any).__uploadedType = result.type;
        // Trigger AI extraction
        await handleAIExtract(result.url, result.type);
      }
    } finally {
      setUploading(false);
    }
  };

  const openEditDialog = (expense: Expense) => {
    setEditExpense(expense);
    setFormCategory(expense.category);
    setFormSubcategory(expense.subcategory || "");
    setFormDescription(expense.description || "");
    setFormAmount(String(expense.amount));
    setFormDate(expense.expense_date || new Date().toISOString().split("T")[0]);
    setFormVehicleId(expense.vehicle_id || "");
    setFormSupplier(expense.supplier_name || "");
    setFormInvoiceNumber(expense.invoice_number || "");
    setFormNotes(expense.notes || "");
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      let fileUrl: string | null = null;
      let fileType: string | null = null;

      // Check if file was already uploaded during AI extraction
      if (uploadFile && (uploadFile as any).__uploadedUrl) {
        fileUrl = (uploadFile as any).__uploadedUrl;
        fileType = (uploadFile as any).__uploadedType;
      } else if (uploadFile) {
        const result = await handleFileUpload(uploadFile);
        if (result) {
          fileUrl = result.url;
          fileType = result.type;
        }
      }

      const payload: any = {
        category: formCategory,
        subcategory: formSubcategory || null,
        description: formDescription || null,
        amount: Number(formAmount) || 0,
        expense_date: formDate,
        vehicle_id: formVehicleId || null,
        supplier_name: formSupplier || null,
        invoice_number: formInvoiceNumber || null,
        notes: formNotes || null,
      };

      if (fileUrl) {
        payload.file_url = fileUrl;
        payload.file_type = fileType;
      }

      if (editExpense) {
        const { error } = await supabase.from("expenses").update(payload).eq("id", editExpense.id);
        if (error) {
          toast({ title: "Erreur", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Dépense mise à jour" });
          setEditExpense(null);
          fetchExpenses();
        }
      } else {
        const { error } = await supabase.from("expenses").insert({ ...payload, source: "manual" } as any);
        if (error) {
          toast({ title: "Erreur", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Dépense ajoutée" });
          setShowAdd(false);
          resetForm();
          fetchExpenses();
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dépense supprimée" });
      fetchExpenses();
    }
  };

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case "Véhicule": return <Car className="h-4 w-4" />;
      case "Bâtiment": return <Building className="h-4 w-4" />;
      case "Société": return <Briefcase className="h-4 w-4" />;
      default: return <MoreHorizontal className="h-4 w-4" />;
    }
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "Véhicule": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Bâtiment": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case "Société": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getVehicleLabel = (vehicleId: string | null) => {
    if (!vehicleId) return null;
    const v = vehicles.find((v) => v.id === vehicleId);
    return v ? `${v.brand} ${v.model} (${v.registration})` : null;
  };

  const ExpenseFormFields = () => (
    <div className="grid gap-4">
      {/* File upload with AI extraction */}
      <div>
        <label className="text-sm font-medium mb-1 block">📎 Document (PDF, image) — Extraction IA automatique</label>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-input bg-background hover:bg-accent text-sm w-full">
            <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground truncate">
              {uploading ? "Upload en cours..." : extracting ? "Analyse IA..." : uploadFile ? uploadFile.name : "Choisir un fichier..."}
            </span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              disabled={uploading || extracting}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelected(f);
              }}
            />
          </label>
          {(uploading || extracting) && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
          {uploadFile && !uploading && !extracting && (
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
          )}
          {uploadFile && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setUploadFile(null)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {!uploadFile && (
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Le fichier sera analysé par IA pour pré-remplir automatiquement les champs
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Catégorie</label>
          <Select value={formCategory} onValueChange={(v) => { setFormCategory(v); setFormSubcategory(""); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Sous-catégorie</label>
          <Select value={formSubcategory} onValueChange={setFormSubcategory}>
            <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
            <SelectContent>
              {(SUBCATEGORIES[formCategory] || []).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {formCategory === "Véhicule" && (
        <div>
          <label className="text-sm font-medium mb-1 block">🚗 Véhicule associé</label>
          <Select value={formVehicleId} onValueChange={setFormVehicleId}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un véhicule..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aucun</SelectItem>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} ({v.registration})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Montant TTC (€)</label>
          <Input type="number" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Date</label>
          <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Description</label>
        <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Description de la dépense..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Fournisseur</label>
          {suppliers.length > 0 ? (
            <Select value={formSupplier} onValueChange={setFormSupplier}>
              <SelectTrigger><SelectValue placeholder="Choisir ou saisir..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Nouveau --</SelectItem>
                {suppliers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Input value={formSupplier} onChange={(e) => setFormSupplier(e.target.value)} placeholder="Nom du fournisseur" />
          )}
          {suppliers.length > 0 && formSupplier === "" && (
            <Input className="mt-1" value={formSupplier} onChange={(e) => setFormSupplier(e.target.value)} placeholder="Ou saisir un nouveau nom..." />
          )}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">N° facture</label>
          <Input value={formInvoiceNumber} onChange={(e) => setFormInvoiceNumber(e.target.value)} placeholder="Numéro de facture" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Mode de paiement</label>
          <Select value={formPaymentMethod} onValueChange={setFormPaymentMethod}>
            <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Non spécifié</SelectItem>
              {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Notes</label>
          <Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Notes..." />
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Importation & Charges</h1>
            <p className="text-muted-foreground text-sm">
              Gestion automatisée des dépenses — extraction IA via Telegram ou upload direct
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchExpenses}>
              <RefreshCw className="h-4 w-4 mr-1" /> Actualiser
            </Button>
            <Button size="sm" onClick={() => { resetForm(); setShowAdd(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{totals.total.toFixed(2)} €</p>
              <p className="text-xs text-muted-foreground">{filteredExpenses.length} dépenses</p>
            </CardContent>
          </Card>
          {CATEGORIES.map((cat) => (
            <Card key={cat}>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5">
                  {categoryIcon(cat)}
                  <p className="text-xs text-muted-foreground">{cat}</p>
                </div>
                <p className="text-lg font-bold">{(totals.byCategory[cat] || 0).toFixed(2)} €</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Telegram Setup Guide - DETAILED */}
        <Card className="border-dashed">
          <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowTelegramGuide(!showTelegramGuide)}>
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" /> 🤖 Configuration du Bot Telegram — Guide complet pas à pas
              </div>
              {showTelegramGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
          {showTelegramGuide && (
            <CardContent className="text-xs space-y-5">
              {/* Étape 1 */}
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <p className="font-semibold text-sm">📌 Étape 1 : Créer le bot avec @BotFather</p>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground ml-2">
                  <li>Ouvrez <strong>Telegram</strong> sur votre téléphone ou ordinateur</li>
                  <li>Dans la barre de recherche en haut, tapez <code className="bg-muted px-1.5 py-0.5 rounded font-bold">@BotFather</code></li>
                  <li>Cliquez sur le résultat avec le ✅ vérifié (c'est le bot officiel de Telegram)</li>
                  <li>Appuyez sur <strong>Démarrer</strong> (ou envoyez <code className="bg-muted px-1.5 py-0.5 rounded">/start</code>)</li>
                  <li>Envoyez la commande : <code className="bg-muted px-1.5 py-0.5 rounded font-bold">/newbot</code></li>
                  <li>BotFather demande : <em>"Alright, a new bot. How are we going to call it?"</em>
                    <br />→ Tapez le nom de votre bot, par exemple : <code className="bg-muted px-1.5 py-0.5 rounded">AutoFlow Factures</code></li>
                  <li>BotFather demande ensuite un <strong>username</strong> (doit finir par <code>bot</code>)
                    <br />→ Par exemple : <code className="bg-muted px-1.5 py-0.5 rounded">autoflow_factures_bot</code></li>
                  <li>🎉 BotFather vous répond avec un message contenant votre <strong>Token API</strong> :
                    <div className="bg-background border p-2 rounded mt-1 font-mono text-[10px]">
                      Use this token to access the HTTP API:<br />
                      <span className="text-primary font-bold">123456789:ABCdefGHIjklMNOpqrsTUVwxyz</span>
                    </div>
                  </li>
                  <li>⚠️ <strong>Copiez ce token</strong> et gardez-le précieusement — ne le partagez jamais publiquement</li>
                </ol>
              </div>

              {/* Étape 2 */}
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <p className="font-semibold text-sm">📌 Étape 2 : Enregistrer le Token dans AutoFlow</p>
                <p className="text-muted-foreground ml-2">
                  Le token doit être enregistré comme secret dans l'application sous le nom <code className="bg-muted px-1.5 py-0.5 rounded font-bold">TELEGRAM_BOT_TOKEN</code>.
                </p>
                <div className="bg-background border p-2 rounded ml-2 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    Ce token est <strong>déjà configuré</strong> dans votre projet. Si vous changez de bot, demandez à mettre à jour le secret <code>TELEGRAM_BOT_TOKEN</code>.
                  </p>
                </div>
              </div>

              {/* Étape 3 */}
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <p className="font-semibold text-sm">📌 Étape 3 : Activer le Webhook (relier le bot à AutoFlow)</p>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground ml-2">
                  <li>Ouvrez votre <strong>navigateur internet</strong> (Chrome, Safari, Firefox...)</li>
                  <li>Dans la barre d'adresse, collez cette URL en remplaçant <code className="text-primary font-bold">VOTRE_TOKEN</code> par le token copié à l'étape 1 :</li>
                </ol>
                <div className="bg-background border p-2 rounded ml-2 text-[10px] break-all font-mono">
                  https://api.telegram.org/bot<span className="text-primary font-bold">VOTRE_TOKEN</span>/setWebhook?url={webhookUrl}
                </div>
                <p className="text-muted-foreground ml-2 mt-1">
                  <strong>Exemple concret :</strong> si votre token est <code>123456:ABC</code>, l'URL sera :
                </p>
                <div className="bg-background border p-2 rounded ml-2 text-[10px] break-all font-mono text-muted-foreground">
                  https://api.telegram.org/bot123456:ABC/setWebhook?url={webhookUrl}
                </div>
                <ol start={3} className="list-decimal list-inside space-y-1 text-muted-foreground ml-2 mt-2">
                  <li>Appuyez sur <strong>Entrée</strong></li>
                  <li>Vous devez voir cette réponse :</li>
                </ol>
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-2 rounded ml-2 text-[10px] font-mono">
                  {`{"ok":true,"result":true,"description":"Webhook was set"}`}
                </div>
                <p className="text-muted-foreground ml-2 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" /> Si vous voyez <code>"ok":true</code>, le webhook est actif !
                </p>
              </div>

              {/* Étape 4 */}
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <p className="font-semibold text-sm">📌 Étape 4 : Tester le bot</p>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground ml-2">
                  <li>Dans Telegram, recherchez votre bot par son username (ex: <code>@autoflow_factures_bot</code>)</li>
                  <li>Ouvrez la conversation et appuyez sur <strong>Démarrer</strong></li>
                  <li>Envoyez <code className="bg-muted px-1.5 py-0.5 rounded">/start</code> → vous recevez le message de bienvenue</li>
                  <li>📸 <strong>Prenez en photo une facture</strong> avec votre téléphone et envoyez-la au bot</li>
                  <li>⏳ L'IA analyse le document (quelques secondes)</li>
                  <li>✅ Le bot répond avec les informations extraites (montant, fournisseur, catégorie...)</li>
                  <li>La dépense apparaît automatiquement dans cette page !</li>
                </ol>
              </div>

              {/* Astuces */}
              <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="font-semibold text-sm">💡 Astuces d'utilisation</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Ajoutez une <strong>légende</strong> à vos photos pour préciser le contexte (ex: <em>"carburant Clio AA-123-BB"</em>)</li>
                  <li>Envoyez aussi des <strong>fichiers PDF</strong> — l'IA les analyse également</li>
                  <li>Les factures sont <strong>stockées</strong> et consultables depuis cette page</li>
                  <li>L'IA détecte automatiquement les <strong>plaques d'immatriculation</strong> et associe le véhicule</li>
                  <li>Vous pouvez toujours <strong>corriger</strong> les données extraites en cliquant sur le crayon ✏️</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded text-[11px] break-all">
                <span className="font-medium shrink-0">Webhook URL :</span>
                <code className="text-muted-foreground flex-1">{webhookUrl}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast({ title: "URL copiée !" }); }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtres :</span>
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="telegram">Telegram</SelectItem>
              <SelectItem value="manual">Manuel</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterVehicle} onValueChange={setFilterVehicle}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue placeholder="Véhicule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.brand} {v.model}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="h-9 w-[200px] text-xs"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Aucune dépense trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {expense.file_url && (
                        <button onClick={() => setPreviewUrl(expense.file_url)}>
                          {expense.file_type === "pdf" ? (
                            <FileText className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          )}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {expense.expense_date
                        ? format(new Date(expense.expense_date), "dd/MM/yyyy", { locale: fr })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`text-[10px] ${categoryColor(expense.category)}`}>
                          {expense.category}
                        </Badge>
                        {expense.subcategory && (
                          <span className="text-[10px] text-muted-foreground">{expense.subcategory}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{expense.description || "-"}</TableCell>
                    <TableCell className="text-xs">{expense.supplier_name || "-"}</TableCell>
                    <TableCell className="text-xs">{getVehicleLabel(expense.vehicle_id) || "-"}</TableCell>
                    <TableCell className="text-right font-medium text-xs">
                      {expense.amount.toFixed(2)} €
                    </TableCell>
                    <TableCell>
                      <Badge variant={expense.source === "telegram" ? "default" : "secondary"} className="text-[10px]">
                        {expense.source === "telegram" ? "📱 TG" : "✏️ Manuel"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(expense)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(expense.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter une dépense</DialogTitle>
            </DialogHeader>
            <ExpenseFormFields />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Annuler</Button>
              <Button onClick={handleSave} disabled={uploading || extracting}>
                {uploading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Upload...</> : extracting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Analyse IA...</> : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editExpense} onOpenChange={(open) => !open && setEditExpense(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier la dépense</DialogTitle>
            </DialogHeader>
            {editExpense?.file_url && (
              <div className="rounded-lg overflow-hidden border max-h-[200px]">
                {editExpense.file_type === "pdf" ? (
                  <a href={editExpense.file_url} target="_blank" rel="noopener" className="flex items-center gap-2 p-4 text-sm text-primary hover:underline">
                    <FileText className="h-5 w-5" /> Voir le PDF
                  </a>
                ) : (
                  <img src={editExpense.file_url} alt="Document" className="w-full object-contain max-h-[200px]" />
                )}
              </div>
            )}
            {editExpense?.ai_extracted_data && (
              <div className="text-[10px] bg-muted p-2 rounded">
                <span className="font-medium flex items-center gap-1"><Sparkles className="h-3 w-3" /> Données extraites par IA :</span>
                <pre className="mt-1 overflow-auto max-h-[60px]">{JSON.stringify(editExpense.ai_extracted_data, null, 2)}</pre>
              </div>
            )}
            <ExpenseFormFields />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditExpense(null)}>Annuler</Button>
              <Button onClick={handleSave} disabled={uploading || extracting}>
                {uploading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Upload...</> : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Aperçu du document</DialogTitle>
            </DialogHeader>
            {previewUrl && (
              previewUrl.endsWith(".pdf") ? (
                <iframe src={previewUrl} className="w-full h-[500px] rounded" />
              ) : (
                <img src={previewUrl} alt="Document" className="w-full rounded" />
              )
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
