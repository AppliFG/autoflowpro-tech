import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  vehicleLabel: string;
}

export default function InvoiceDialog({ open, onOpenChange, vehicleId, vehicleLabel }: InvoiceDialogProps) {
  const [clientNom, setClientNom] = useState("");
  const [clientAdresse, setClientAdresse] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultNumber, setResultNumber] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!clientNom.trim()) {
      toast.error("Le nom du client est requis");
      return;
    }
    setGenerating(true);
    setResultUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-invoice", {
        body: {
          vehicle_id: vehicleId,
          client_nom: clientNom,
          client_adresse: clientAdresse,
          invoice_number: invoiceNumber || undefined,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setResultUrl(data.url);
      setResultNumber(data.invoice_number);
      toast.success(`Facture ${data.invoice_number} générée avec succès`);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setClientNom("");
    setClientAdresse("");
    setInvoiceNumber("");
    setResultUrl(null);
    setResultNumber(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Générer une facture
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Véhicule</p>
            <p className="text-sm font-medium text-card-foreground">{vehicleLabel}</p>
          </div>

          <div>
            <Label htmlFor="invoiceNum">N° de facture (optionnel)</Label>
            <Input
              id="invoiceNum"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Auto-généré si vide"
            />
          </div>

          <div>
            <Label htmlFor="clientName">Nom de l'acheteur *</Label>
            <Input
              id="clientName"
              value={clientNom}
              onChange={(e) => setClientNom(e.target.value)}
              placeholder="Jean Dupont"
            />
          </div>

          <div>
            <Label htmlFor="clientAddr">Adresse de l'acheteur</Label>
            <Textarea
              id="clientAddr"
              rows={2}
              value={clientAdresse}
              onChange={(e) => setClientAdresse(e.target.value)}
              placeholder="12 rue de la Paix, 75001 Paris"
            />
          </div>

          {resultUrl && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-primary">✅ Facture {resultNumber} générée</p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href={resultUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-1.5" />
                  Télécharger le PDF
                </a>
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Fermer</Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Génération...</>
            ) : (
              <><FileText className="h-4 w-4 mr-1.5" /> Générer la facture</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
