import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { decodePlaque, detectPlaqueType, type PlaqueType } from "@/services/plaqueService";
import type { PlaqueDecodedData } from "@/types/vehicle";

interface Props {
  onDecoded: (data: PlaqueDecodedData) => void;
}

const PLAQUE_TYPE_LABELS: Record<PlaqueType, string> = {
  SIV: "Plaque SIV",
  FNI: "Plaque FNI (ancien format)",
  EU: "Plaque européenne",
  unknown: "Format inconnu",
};

export default function PlaqueScanner({ onDecoded }: Props) {
  const [plaque, setPlaque] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState(false);
  const [plaqueType, setPlaqueType] = useState<PlaqueType | null>(null);

  const handleSearch = async () => {
    if (!plaque.trim()) return;
    setLoading(true);
    setError(null);
    setFound(false);
    try {
      const result = await decodePlaque(plaque);
      setIsDemo(result.isDemo);
      setPlaqueType(result.plaqueType);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setFound(true);
        onDecoded(result.data);
      }
    } catch {
      setError("Erreur inattendue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 mb-5">
      <div className="flex items-center gap-2 mb-1">
        <Search className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm text-card-foreground">Identification par plaque</span>
        {isDemo !== null && (
          <Badge variant={isDemo ? "secondary" : "default"} className="text-[10px] ml-auto">
            {isDemo ? "Mode démo" : "API connectée"}
          </Badge>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">
        Formats acceptés : SIV (AA-123-BB), FNI ancien (1234 AB 75), plaques européennes
      </p>
      <div className="flex gap-2">
        <div className="flex items-stretch border-2 border-primary/40 rounded-lg overflow-hidden flex-1 max-w-xs bg-background">
          <div className="w-8 bg-blue-700 flex items-center justify-center text-white text-[10px] font-bold">F</div>
          <input
            type="text"
            value={plaque}
            onChange={(e) => setPlaque(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="AA-123-BB"
            className="flex-1 px-3 py-2 font-mono text-lg font-bold tracking-widest text-center bg-transparent outline-none text-card-foreground uppercase"
            maxLength={12}
          />
          <div className="w-8 bg-blue-700 flex items-center justify-center text-white text-[10px] font-bold">EU</div>
        </div>
        <Button onClick={handleSearch} disabled={loading || !plaque.trim()} size="default">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-destructive text-xs">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
      {found && plaqueType && (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1.5 text-green-600 text-xs">
            <CheckCircle className="h-3.5 w-3.5" />
            Véhicule identifié — champs pré-remplis
          </div>
          <Badge variant="outline" className="text-[9px]">{PLAQUE_TYPE_LABELS[plaqueType]}</Badge>
        </div>
      )}
    </div>
  );
}
