import { useTrialStatus } from "@/hooks/useTrialStatus";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function TrialBanner() {
  const { loading, isTrialActive, daysRemaining, hasSubscription, installDate } = useTrialStatus();
  const navigate = useNavigate();

  if (loading || hasSubscription || !installDate) return null;

  if (!isTrialActive) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between w-full">
          <span>Votre période d'essai de 30 jours est terminée. Souscrivez un abonnement pour continuer.</span>
          <Button size="sm" variant="outline" onClick={() => navigate("/abonnement")} className="ml-4 shrink-0">
            Voir les plans
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (daysRemaining <= 7) {
    return (
      <Alert className="mb-4 border-warning bg-warning/10">
        <Clock className="h-4 w-4 text-warning" />
        <AlertDescription className="flex items-center justify-between w-full">
          <span className="text-warning-foreground">
            Il vous reste <strong>{daysRemaining} jour{daysRemaining > 1 ? "s" : ""}</strong> d'essai gratuit.
          </span>
          <Button size="sm" variant="outline" onClick={() => navigate("/abonnement")} className="ml-4 shrink-0">
            Souscrire
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
