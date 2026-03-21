import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function TelegramAdminSettings() {
  const queryClient = useQueryClient();
  const [newChatId, setNewChatId] = useState("");
  const [newNom, setNewNom] = useState("");
  const [adding, setAdding] = useState(false);

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ["telegram-admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("telegram_admins" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("telegram_admins" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram-admins"] });
      toast.success("Administrateur Telegram supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const addAdmin = async () => {
    const chatIdNum = parseInt(newChatId, 10);
    if (!chatIdNum || isNaN(chatIdNum)) {
      toast.error("Chat ID invalide");
      return;
    }
    setAdding(true);
    try {
      const { error } = await supabase.from("telegram_admins" as any).insert({
        chat_id: chatIdNum,
        nom: newNom.trim() || null,
      } as any);
      if (error) {
        if (error.message.includes("unique") || error.message.includes("duplicate")) {
          toast.error("Ce Chat ID est déjà enregistré");
        } else {
          throw error;
        }
        return;
      }
      toast.success("Administrateur Telegram ajouté");
      setNewChatId("");
      setNewNom("");
      queryClient.invalidateQueries({ queryKey: ["telegram-admins"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-card-foreground text-sm">💡 Comment obtenir un Chat ID Telegram</p>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>Ouvrez Telegram et cherchez <strong>@userinfobot</strong></li>
          <li>Envoyez-lui <code className="bg-background border border-border rounded px-1 py-0.5">/start</code></li>
          <li>Il vous renverra votre <strong>Chat ID</strong> (un nombre)</li>
        </ol>
        <p className="mt-1">Les administrateurs autorisés peuvent utiliser les commandes <code className="bg-background border border-border rounded px-1 py-0.5">/facture</code> et <code className="bg-background border border-border rounded px-1 py-0.5">/devis</code> du bot.</p>
      </div>

      {/* Admin list */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : admins.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun administrateur Telegram configuré.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {admins.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0088CC]/10 text-[#0088CC]">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{a.nom || "Sans nom"}</p>
                  <p className="text-xs text-muted-foreground">Chat ID: {a.chat_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{a.role || "admin"}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm(`Supprimer l'administrateur "${a.nom || a.chat_id}" ?`)) {
                      deleteMutation.mutate(a.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Ajouter un administrateur Telegram
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Chat ID *</Label>
            <Input
              type="number"
              value={newChatId}
              onChange={(e) => setNewChatId(e.target.value)}
              placeholder="Ex: 7219387456"
            />
          </div>
          <div>
            <Label className="text-xs">Nom (optionnel)</Label>
            <Input
              value={newNom}
              onChange={(e) => setNewNom(e.target.value)}
              placeholder="Jean Dupont"
            />
          </div>
        </div>
        <Button onClick={addAdmin} disabled={adding || !newChatId} size="sm">
          <Save className="h-4 w-4 mr-1.5" />
          {adding ? "..." : "Ajouter"}
        </Button>
      </div>
    </div>
  );
}
