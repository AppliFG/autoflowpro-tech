import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { decodePlaque, detectPlaqueType, type PlaqueType } from "@/services/plaqueService";
import type { PlaqueDecodedData } from "@/types/vehicle";

interface Props {
  onDecoded: (data: PlaqueDecodedData) => void;
}

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
      <div className="flex items-center gap-2 mb-3">
        <Search className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm text-card-foreground">Identification par plaque</span>
        {isDemo !== null && (
          <Badge variant={isDemo ? "secondary" : "default"} className="text-[10px] ml-auto">
            {isDemo ? "Mode démo" : "API connectée"}
          </Badge>
        )}
      </div>
      <div className="flex gap-2">
        {/* Plaque FR style */}
        <div className="flex items-stretch border-2 border-primary/40 rounded-lg overflow-hidden flex-1 max-w-xs bg-background">
          <div className="w-8 bg-blue-700 flex items-center justify-center text-white text-[10px] font-bold">F</div>
          <input
            type="text"
            value={plaque}
            onChange={(e) => setPlaque(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="AA-123-BB"
            className="flex-1 px-3 py-2 font-mono text-lg font-bold tracking-widest text-center bg-transparent outline-none text-card-foreground uppercase"
            maxLength={10}
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
      {found && (
        <div className="flex items-center gap-1.5 mt-2 text-green-600 text-xs">
          <CheckCircle className="h-3.5 w-3.5" />
          Véhicule identifié — champs pré-remplis
        </div>
      )}
    </div>
  );
}
