import { useTrialStatus } from "@/hooks/useTrialStatus";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Rocket } from "lucide-react";

interface TrialExpiredGateProps {
  children: React.ReactNode;
}

export default function TrialExpiredGate({ children }: TrialExpiredGateProps) {
  const { loading, isTrialActive, hasSubscription } = useTrialStatus();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Allow access to subscription page always
  if (isTrialActive || hasSubscription) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Période d'essai terminée</h1>
        <p className="text-muted-foreground">
          Votre essai gratuit de 30 jours est arrivé à son terme. 
          Pour continuer à utiliser AutoFlow Pro, choisissez un abonnement adapté à votre activité.
        </p>
        <Button onClick={() => navigate("/abonnement")} className="gap-2">
          <Rocket className="h-4 w-4" />
          Voir les plans d'abonnement
        </Button>
      </div>
    </div>
  );
}
