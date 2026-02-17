import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Mail } from "lucide-react";
import { toast } from "sonner";

const BUYER_DOCS = [
  { id: "id_buyer", label: "Pièce d'identité (CNI ou passeport)" },
  { id: "domicile", label: "Justificatif de domicile (- de 3 mois)" },
  { id: "hebergement", label: "Attestation d'hébergement + Pièce d'identité de l'hébergeur (si hébergé)" },
  { id: "permis", label: "Permis de conduire" },
  { id: "assurance", label: "Attestation d'assurance" },
];

const SELLER_DOCS = [
  { id: "rib", label: "RIB société" },
  { id: "carte_grise", label: "Copie de carte grise" },
  { id: "cession", label: "Certificat de cession (Cerfa n°15776)" },
];

interface Props {
  clientName: string;
  children: React.ReactNode;
}

export default function DocumentChecklistDialog({ clientName, children }: Props) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"acheteur" | "vendeur">("acheteur");
  const [selected, setSelected] = useState<string[]>([]);

  const docs = role === "acheteur" ? BUYER_DOCS : SELLER_DOCS;

  const handleRoleChange = (val: string) => {
    setRole(val as "acheteur" | "vendeur");
    setSelected([]);
  };

  const toggleDoc = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  };

  const selectAll = () => {
    setSelected(docs.map((d) => d.id));
  };

  const buildMessage = () => {
    const selectedDocs = docs.filter((d) => selected.includes(d.id));
    if (selectedDocs.length === 0) return "";

    const roleLabel = role === "acheteur" ? "l'achat" : "la vente";
    const lines = selectedDocs.map((d, i) => `${i + 1}. ${d.label}`);

    return `Bonjour ${clientName},\n\nVoici la liste des documents nécessaires pour ${roleLabel} de votre véhicule :\n\n${lines.join("\n")}\n\nMerci de nous les transmettre dès que possible.\n\nCordialement,\nAutoFlow Pro`;
  };

  const sendEmail = () => {
    const msg = buildMessage();
    if (!msg) {
      toast.error("Sélectionnez au moins un document");
      return;
    }
    const subject = `Documents requis — ${role === "acheteur" ? "Achat" : "Vente"} véhicule`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    toast.success("Email ouvert");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Checklist documents — {clientName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={role} onValueChange={handleRoleChange} className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="acheteur" className="flex-1">Acheteur</TabsTrigger>
            <TabsTrigger value="vendeur" className="flex-1">Vendeur</TabsTrigger>
          </TabsList>

          <TabsContent value={role} className="mt-4 space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-primary hover:underline"
              >
                Tout sélectionner
              </button>
            </div>
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 py-1.5">
                <Checkbox
                  id={doc.id}
                  checked={selected.includes(doc.id)}
                  onCheckedChange={() => toggleDoc(doc.id)}
                />
                <Label htmlFor={doc.id} className="text-sm cursor-pointer">
                  {doc.label}
                </Label>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="mt-4">
          <Button onClick={sendEmail} className="w-full gap-2">
            <Mail className="h-4 w-4" />
            Envoyer par Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
