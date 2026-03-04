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
  Trash2, Plus, Filter, FileText, Image as ImageIcon,
  Send, RefreshCw, Car, Building, Briefcase, MoreHorizontal, Pencil,
  Upload, Loader2, ChevronDown, ChevronUp, Copy, Sparkles, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const CATEGORIES = ["Véhicule", "Bâtiment", "Société", "Divers"];
const SUBCATEGORIES: Record<string, string[]> = {
  "Véhicule": ["Carburant", "Pièces", "Entretien", "Contrôle technique", "Assurance", "Carte grise", "Lavage", "Péage", "Parking", "Autre"],
  "Bâtiment": ["Loyer", "Électricité", "Eau", "Gaz", "Internet", "Travaux", "Ménage", "Assurance", "Autre"],
  "Société": ["Comptable", "Assurance", "Téléphone", "Abonnement", "Fournitures", "Marketing", "Juridique", "Autre"],
  "Divers": ["Autre"],
};

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

interface Supplier {
  id: string;
  name: string;
}

export default function Importation() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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

  // File upload & AI
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
  const [formLineItems, setFormLineItems] = useState<any[]>([]);

  useEffect(() => {
    fetchExpenses();
    fetchVehicles();
    fetchSuppliers();
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    setWebhookUrl(`https://${projectId}.supabase.co/functions/v1/telegram-webhook`);
  }, []);

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

  const fetchSuppliers = async () => {
    const { data } = await supabase.from("suppliers").select("id, name");
    if (data) setSuppliers(data);
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
    setFormLineItems([]);
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
  const handleAIExtract = async (file: File) => {
    setExtracting(true);
    try {
      // First upload the file to get a URL
      const result = await handleFileUpload(file);
      if (!result) {
        setExtracting(false);
        return;
      }

      toast({ title: "🤖 Analyse IA en cours...", description: "Extraction des données du document" });

      const { data, error } = await supabase.functions.invoke("extract-expense", {
        body: { file_url: result.url, file_type: result.type },
      });

      if (error) {
        console.error("AI extraction error:", error);
        toast({ title: "Extraction IA échouée", description: "Remplissez les champs manuellement", variant: "destructive" });
        setExtracting(false);
        return;
      }

      // Fill form with extracted data
      if (data.category) setFormCategory(data.category);
      if (data.subcategory) setFormSubcategory(data.subcategory);
      if (data.description) setFormDescription(data.description);
      if (data.amount) setFormAmount(String(data.amount));
      if (data.expense_date) setFormDate(data.expense_date);
      if (data.supplier_name) setFormSupplier(data.supplier_name);
      if (data.invoice_number) setFormInvoiceNumber(data.invoice_number);
      if (data.vehicle_id) setFormVehicleId(data.vehicle_id);
      if (data.line_items) setFormLineItems(data.line_items);

      // Store file info for later save
      setUploadFile(null); // Already uploaded
      // We store the URL in a temporary way
      (window as any).__lastUploadedFile = result;

      toast({ title: "✅ Extraction réussie !", description: `${data.supplier_name || "Document"} — ${data.amount ? data.amount.toFixed(2) + " €" : ""}` });
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Extraction impossible", variant: "destructive" });
    }
    setExtracting(false);
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
    setFormLineItems(expense.ai_extracted_data?.line_items || []);
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      let fileUrl: string | null = null;
      let fileType: string | null = null;

      // Check if we already uploaded via AI extraction
      const alreadyUploaded = (window as any).__lastUploadedFile;
      if (alreadyUploaded) {
        fileUrl = alreadyUploaded.url;
        fileType = alreadyUploaded.type;
        (window as any).__lastUploadedFile = null;
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
        ai_extracted_data: formLineItems.length > 0 ? { line_items: formLineItems } : null,
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

  const ExpenseFormFields = ({ showFileUpload = true }: { showFileUpload?: boolean }) => (
    <div className="grid gap-4">
      {/* File upload with AI extraction */}
      {showFileUpload && (
        <div className="space-y-2">
          <label className="text-sm font-medium mb-1 block">📄 Document (PDF, image) — Extraction IA automatique</label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-input bg-background hover:bg-accent text-sm flex-1">
              <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">
                {uploadFile ? uploadFile.name : "Choisir un fichier..."}
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                disabled={extracting}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setUploadFile(f);
                    handleAIExtract(f);
                  }
                }}
              />
            </label>
            {extracting && (
              <div className="flex items-center gap-1.5 text-xs text-primary shrink-0">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyse IA...</span>
              </div>
            )}
            {uploadFile && !extracting && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setUploadFile(null)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> L'IA extrait automatiquement : fournisseur, montant, plaque, articles, catégorie
          </p>
        </div>
      )}

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
          <div className="space-y-1">
            {suppliers.length > 0 && (
              <Select value="" onValueChange={(v) => setFormSupplier(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Choisir existant..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Input value={formSupplier} onChange={(e) => setFormSupplier(e.target.value)} placeholder="Ou saisir le nom..." className="h-9" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">N° facture</label>
          <Input value={formInvoiceNumber} onChange={(e) => setFormInvoiceNumber(e.target.value)} placeholder="Numéro de facture" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Notes</label>
        <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Notes supplémentaires..." rows={2} />
      </div>

      {/* Line items from AI */}
      {formLineItems.length > 0 && (
        <div className="space-y-1">
          <label className="text-sm font-medium flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Articles extraits par l'IA
          </label>
          <div className="bg-muted/50 rounded-md p-2 space-y-1 text-xs max-h-[120px] overflow-y-auto">
            {formLineItems.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <span className="truncate flex-1">{item.article}</span>
                {item.quantity > 1 && <span className="text-muted-foreground mx-2">x{item.quantity}</span>}
                {item.total != null && <span className="font-medium shrink-0">{Number(item.total).toFixed(2)} €</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Importation & Charges</h1>
            <p className="text-muted-foreground text-sm">
              Scraping IA automatique des factures via Telegram ou upload PC
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

        {/* Telegram Setup Guide */}
        <Card className="border-dashed">
          <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowTelegramGuide(!showTelegramGuide)}>
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" /> 📱 Configuration Telegram — Guide complet pas à pas
              </div>
              {showTelegramGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
          {showTelegramGuide && (
            <CardContent className="text-xs space-y-5">
              {/* Étape 1 */}
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <p className="font-semibold text-sm">📌 Étape 1 : Créer votre bot avec @BotFather</p>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground ml-2">
                  <li>Ouvrez <strong>Telegram</strong> sur votre téléphone ou PC</li>
                  <li>Dans la barre de recherche en haut, tapez <code className="bg-muted px-1.5 py-0.5 rounded font-mono">@BotFather</code></li>
                  <li>Cliquez sur le résultat avec le ✓ bleu (compte vérifié officiel)</li>
                  <li>Cliquez sur <strong>« Démarrer »</strong> ou tapez <code className="bg-muted px-1.5 py-0.5 rounded font-mono">/start</code></li>
                  <li>Tapez <code className="bg-muted px-1.5 py-0.5 rounded font-mono">/newbot</code> et envoyez</li>
                  <li>BotFather demande : <em>"Alright, a new bot. How are we going to call it?"</em></li>
                  <li>Tapez un nom lisible, par exemple : <code className="bg-muted px-1.5 py-0.5 rounded font-mono">AutoFlow Factures</code></li>
                  <li>BotFather demande un <strong>username</strong> (doit finir par <code>bot</code>)</li>
                  <li>Tapez par exemple : <code className="bg-muted px-1.5 py-0.5 rounded font-mono">autoflow_factures_bot</code></li>
                  <li>🎉 BotFather vous répond avec un <strong>Token API</strong> qui ressemble à :</li>
                </ol>
                <div className="bg-background border rounded p-2 font-mono text-[11px] ml-4">
                  <code>7123456789:AAH1bGciOiJIUzI1NiIsInR5cCI6...</code>
                </div>
                <div className="flex items-start gap-2 ml-2 mt-1 p-2 bg-amber-50 dark:bg-amber-950/30 rounded text-amber-800 dark:text-amber-200">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span><strong>IMPORTANT :</strong> Copiez et gardez ce token précieusement. Ne le partagez avec personne ! Vous en aurez besoin à l'étape 3.</span>
                </div>
              </div>

              {/* Étape 2 */}
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <p className="font-semibold text-sm">📌 Étape 2 : Obtenir votre Chat ID</p>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground ml-2">
                  <li>Dans Telegram, recherchez <code className="bg-muted px-1.5 py-0.5 rounded font-mono">@userinfobot</code></li>
                  <li>Cliquez sur <strong>« Démarrer »</strong></li>
                  <li>Le bot vous répond immédiatement avec votre <strong>ID numérique</strong></li>
                  <li>Notez ce numéro (ex: <code>123456789</code>) — c'est votre Chat ID</li>
                </ol>
                <p className="text-muted-foreground ml-2 mt-1 text-[10px]">
                  💡 Ce Chat ID est aussi utile pour recevoir des notifications (factures, devis) sur votre Telegram.
                </p>
              </div>

              {/* Étape 3 */}
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <p className="font-semibold text-sm">📌 Étape 3 : Enregistrer le Token</p>
                <p className="text-muted-foreground ml-2">
                  Le token de votre bot doit être enregistré comme secret <code className="bg-muted px-1.5 py-0.5 rounded">TELEGRAM_BOT_TOKEN</code> dans le backend.
                  Ce secret est déjà configuré — si vous changez de bot, demandez la mise à jour.
                </p>
              </div>

              {/* Étape 4 */}
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <p className="font-semibold text-sm">📌 Étape 4 : Activer le Webhook</p>
                <p className="text-muted-foreground ml-2">
                  Ouvrez votre navigateur (Chrome, Safari...) et collez cette URL <strong>en remplaçant</strong> <code>VOTRE_TOKEN</code> par le token copié à l'étape 1 :
                </p>
                <div className="bg-background border rounded p-2.5 text-[11px] break-all ml-2 font-mono">
                  https://api.telegram.org/bot<span className="text-primary font-bold">VOTRE_TOKEN</span>/setWebhook?url={webhookUrl}
                </div>
                <p className="text-muted-foreground ml-2 mt-1">
                  <strong>Exemple concret :</strong>
                </p>
                <div className="bg-background border rounded p-2.5 text-[10px] break-all ml-2 font-mono text-muted-foreground">
                  https://api.telegram.org/bot<span className="text-primary">7123456789:AAH1bGci...</span>/setWebhook?url={webhookUrl}
                </div>
                <p className="text-muted-foreground ml-2 mt-1">
                  ✅ Vous devez voir dans votre navigateur : <code className="bg-muted px-1.5 py-0.5 rounded">{`{"ok":true,"result":true,"description":"Webhook was set"}`}</code>
                </p>
              </div>

              {/* Étape 5 */}
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <p className="font-semibold text-sm">📌 Étape 5 : Tester !</p>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground ml-2">
                  <li>Retournez dans Telegram, recherchez le nom de votre bot (ex: <code>@autoflow_factures_bot</code>)</li>
                  <li>Cliquez sur <strong>« Démarrer »</strong> ou envoyez <code className="bg-muted px-1.5 py-0.5 rounded font-mono">/start</code></li>
                  <li>Le bot doit répondre avec le message d'accueil AutoFlow Pro</li>
                  <li>📸 <strong>Prenez une photo d'une facture</strong> avec votre téléphone et envoyez-la</li>
                  <li>⏳ Le bot analyse le document avec l'IA (5-15 secondes)</li>
                  <li>✅ Le bot confirme avec les données extraites (fournisseur, montant, catégorie...)</li>
                  <li>La dépense apparaît automatiquement dans ce tableau ci-dessous</li>
                </ol>
                <p className="text-muted-foreground ml-2 mt-2">
                  💡 <strong>Astuce :</strong> Ajoutez une légende à votre photo pour préciser le contexte.<br/>
                  Exemples : <em>"carburant Clio AA-123-BB"</em>, <em>"électricité local"</em>, <em>"comptable trimestre"</em>
                </p>
              </div>

              {/* Webhook URL */}
              <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg text-[11px] break-all">
                <span className="font-medium shrink-0">🔗 Webhook URL :</span>
                <code className="text-muted-foreground flex-1 font-mono">{webhookUrl}</code>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast({ title: "URL copiée !" }); }}>
                  <Copy className="h-3.5 w-3.5" />
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
                <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} ({v.registration})</SelectItem>
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
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" /> Chargement...
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
                {uploading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Enregistrement...</> : "Ajouter"}
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
            <ExpenseFormFields showFileUpload={!editExpense?.file_url} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditExpense(null)}>Annuler</Button>
              <Button onClick={handleSave} disabled={uploading || extracting}>
                {uploading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Enregistrement...</> : "Enregistrer"}
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
              previewUrl.toLowerCase().includes(".pdf") ? (
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
