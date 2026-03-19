import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, Plus, CheckCircle2, Smartphone, Monitor, FileText, Megaphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Déjà installée !</h1>
          <p className="text-muted-foreground">L'application est déjà installée sur votre appareil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 px-6 pt-16 pb-12 text-center">
        <div className="mx-auto max-w-md">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-6">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Installer AutoFlow Pro</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Accédez à votre espace de gestion directement depuis l'écran d'accueil, comme une application native.
          </p>
        </div>
      </div>

      <div className="px-6 py-10 max-w-md mx-auto space-y-8">
        {/* Install button (Android / Desktop) */}
        {installed ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground">Installation réussie !</h2>
            <p className="text-sm text-muted-foreground mt-1">Retrouvez AutoFlow Pro sur votre écran d'accueil.</p>
          </div>
        ) : deferredPrompt ? (
          <div className="space-y-4">
            <Button onClick={handleInstall} className="w-full h-14 text-base gap-3 rounded-xl" size="lg">
              <Download className="h-5 w-5" />
              Installer l'application
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Rapide, sans passer par un store. Fonctionne hors-ligne.
            </p>
          </div>
        ) : null}

        {/* iOS instructions — always visible */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Share className="h-5 w-5 text-primary" />
            Installation sur iPhone / iPad
          </h2>
          <p className="text-sm text-muted-foreground">Ouvrez cette page dans <strong>Safari</strong>, puis :</p>
          <div className="space-y-3">
            {[
              { step: 1, icon: <Share className="h-4 w-4" />, text: "Appuyez sur le bouton Partager (icône carrée avec flèche vers le haut) en bas de Safari" },
              { step: 2, icon: <Plus className="h-4 w-4" />, text: "Faites défiler et appuyez sur « Sur l'écran d'accueil »" },
              { step: 3, icon: <CheckCircle2 className="h-4 w-4" />, text: "Confirmez en appuyant sur « Ajouter »" },
            ].map(({ step, icon, text }) => (
              <div key={step} className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {step}
                </div>
                <div className="flex items-center gap-2 text-sm text-card-foreground pt-1">
                  {icon}
                  <span>{text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generic fallback for desktop */}
        {!isIOS && !deferredPrompt && !installed && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Installation sur ordinateur
            </h2>
            <div className="rounded-xl border border-border bg-card p-5 space-y-3 text-sm text-card-foreground">
              <p><strong>Chrome / Edge :</strong> Cliquez sur l'icône d'installation dans la barre d'adresse ou utilisez le menu ⋮ → « Installer l'application ».</p>
              <p><strong>Mobile Android :</strong> Menu ⋮ → « Ajouter à l'écran d'accueil ».</p>
            </div>
          </div>
        )}

        {/* Generic fallback instructions */}
        {!isIOS && !deferredPrompt && !installed && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Comment installer
            </h2>
            <div className="rounded-xl border border-border bg-card p-5 space-y-3 text-sm text-card-foreground">
              <p><strong>Chrome / Edge :</strong> Cliquez sur l'icône d'installation dans la barre d'adresse ou utilisez le menu ⋮ → « Installer l'application ».</p>
              <p><strong>Firefox :</strong> Les PWA ne sont pas encore supportées sur Firefox desktop.</p>
              <p><strong>Mobile Android :</strong> Menu ⋮ → « Ajouter à l'écran d'accueil ».</p>
            </div>
          </div>
        )}

        {/* Documentation PDFs */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Documentation</h2>
          <div className="grid grid-cols-1 gap-3">
            <a
              href="/AutoFlowPro_Guide_Installation.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-card-foreground text-sm">Guide d'installation & d'utilisation</p>
                <p className="text-xs text-muted-foreground mt-0.5">PDF — Installation pas à pas, modules, rôles</p>
              </div>
              <Download className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
            </a>
            <a
              href="/AutoFlowPro_Brochure_Commerciale.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Megaphone className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-card-foreground text-sm">Brochure commerciale</p>
                <p className="text-xs text-muted-foreground mt-0.5">PDF — Présentation, tarifs, fonctionnalités</p>
              </div>
              <Download className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
            </a>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Avantages</h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { title: "Accès rapide", desc: "Lancement depuis l'écran d'accueil" },
              { title: "Mode hors-ligne", desc: "Consultez vos données sans connexion" },
              { title: "Notifications", desc: "Restez informé en temps réel" },
              { title: "Léger", desc: "Aucune installation via le store" },
            ].map((b) => (
              <div key={b.title} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium text-card-foreground text-sm">{b.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
