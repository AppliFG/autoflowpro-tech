import { useState } from "react";
import { Search, Loader2, CheckCircle2, AlertTriangle, Car, Fingerprint, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { rechercherParPlaque, formatPlaque } from "@/services/plaqueService";
import { ConnecteurConfig, isConnecteurReady } from "@/types/connecteurs";

export interface PlaqueResultData {
  vin: string;
  immatriculation: string;
  marque: string;
  modele: string;
  version: string;
  annee: number | null;
  dateMiseCirculation: string;
  energie: string;
  couleur: string;
  puissanceFiscale: number | null;
  puissanceDin: number | null;
  co2: number | null;
  cylindree: string;
  nombrePlaces: number | null;
  nombrePortes: number | null;
  boiteVitesse: string;
  typeVehicule: string;
  carrosserie: string;
  poids: string;
  codeMoteur: string;
  typeMine: string;
}

interface PlaqueScannerProps {
  onDecoded: (data: PlaqueResultData) => void;
  connecteurs?: ConnecteurConfig[];
}

export default function PlaqueScanner({ onDecoded, connecteurs }: PlaqueScannerProps) {
  const { toast } = useToast();
  const [plaque, setPlaque] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [resultSummary, setResultSummary] = useState("");
  const [vinResult, setVinResult] = useState("");

  // Vérifier quel connecteur est configuré
  const hasApiToken = connecteurs && isConnecteurReady(connecteurs, "api-plaque-immatriculation");
  const hasSIV = connecteurs && isConnecteurReady(connecteurs, "siv-ants");

  const handleSearch = async () => {
    if (!plaque.trim()) { toast({ title: "Saisissez une plaque", variant: "destructive" }); return; }
    setLoading(true);
    setStatus("idle");

    try {
      const result = await rechercherParPlaque(plaque, connecteurs);

      onDecoded({
        vin: result.vin, immatriculation: result.immatriculation,
        marque: result.marque, modele: result.modele, version: result.version,
        annee: result.annee, dateMiseCirculation: result.dateMiseCirculation,
        energie: result.energie, couleur: result.couleur,
        puissanceFiscale: result.puissanceFiscale, puissanceDin: result.puissanceCh,
        co2: result.co2, cylindree: result.cylindree,
        nombrePlaces: result.nombrePlaces, nombrePortes: result.nombrePortes,
        boiteVitesse: result.boiteVitesse, typeVehicule: result.typeVehicule,
        carrosserie: result.carrosserie, poids: result.poids,
        codeMoteur: result.codeMoteur, typeMine: result.typeMine,
      });

      const parts = [result.marque, result.modele, result.annee, result.energie].filter(Boolean);
      setResultSummary(parts.join(" · "));
      setVinResult(result.vin);
      setStatus("success");
      toast({ title: "Véhicule identifié !", description: `${result.marque} ${result.modele} — VIN récupéré` });
    } catch (error: any) {
      setStatus("error");
      setResultSummary(error.message || "Erreur");
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-xl border-2 p-5 space-y-4 transition-all ${
      status === "success" ? "bg-emerald-50/60 border-emerald-300" :
      status === "error" ? "bg-red-50/60 border-red-200" :
      "bg-gradient-to-br from-blue-50/60 to-sky-50/60 border-blue-200"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className={`h-5 w-5 ${status === "success" ? "text-emerald-600" : "text-blue-600"}`} />
          <Label className="font-semibold text-gray-900 text-base">Identification par plaque</Label>
        </div>
        <div className="flex gap-1.5">
          {!hasApiToken && !hasSIV && (
            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 gap-1">
              <Settings2 className="h-2.5 w-2.5" />Mode démo — Configurez votre API dans Paramètres → Fournisseurs
            </Badge>
          )}
          {hasApiToken && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">API Plaque connectée</Badge>}
          {hasSIV && <Badge className="bg-blue-100 text-blue-700 text-[10px]">SIV/ANTS connecté</Badge>}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <div className="h-7 w-2.5 bg-blue-700 rounded-sm" />
            <span className="text-[10px] text-blue-700 font-bold leading-none">F</span>
          </div>
          <Input
            placeholder="AA-123-BB"
            value={plaque}
            onChange={(e) => { setPlaque(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "")); if (status !== "idle") setStatus("idle"); }}
            onBlur={() => setPlaque(formatPlaque(plaque))}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-14 text-center font-mono text-2xl tracking-[0.3em] font-bold h-16 bg-white border-2 border-gray-300 focus:border-blue-500 uppercase"
            maxLength={10}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading || plaque.length < 5} className={`gap-2 h-16 px-8 text-base ${status === "success" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}>
          {loading ? <><Loader2 className="h-5 w-5 animate-spin" />Recherche...</> :
           status === "success" ? <><CheckCircle2 className="h-5 w-5" />Trouvé !</> :
           <><Search className="h-5 w-5" />Rechercher</>}
        </Button>
      </div>

      {status === "success" && resultSummary && (
        <div className="bg-emerald-100 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm"><CheckCircle2 className="h-4 w-4" />{resultSummary}</div>
          {vinResult && <div className="flex items-center gap-2 text-emerald-700 text-xs"><Fingerprint className="h-3.5 w-3.5" /><span className="font-mono tracking-wider">VIN : {vinResult}</span></div>}
          <p className="text-[10px] text-emerald-600">✓ Tous les champs ont été pré-remplis. Vérifiez et ajoutez le prix d'achat / vente + n° livre de police.</p>
        </div>
      )}

      {status === "error" && resultSummary && (
        <div className="bg-red-100 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm"><AlertTriangle className="h-4 w-4 shrink-0" />{resultSummary}</div>
      )}

      {status === "idle" && <p className="text-[10px] text-gray-400">Saisissez la plaque → la recherche récupère automatiquement : VIN, marque, modèle, version, année, énergie, puissance Ch DIN + CV fiscaux, CO2, couleur, boîte, carrosserie, code moteur...</p>}
    </div>
  );
}
