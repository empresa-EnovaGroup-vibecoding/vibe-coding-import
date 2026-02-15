import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed as standalone
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone) return;

    // Don't show if user already dismissed this session
    const wasDismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    if (isIOS()) {
      // iOS: show guide after 3 seconds
      const timer = setTimeout(() => setShowIOSGuide(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop: listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      setInstallEvent(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowIOSGuide(false);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  if (dismissed) return null;

  // iOS guide
  if (showIOSGuide) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-[199] sm:left-auto sm:right-4 sm:w-80">
        <div className="rounded-xl border border-primary/20 bg-card p-4 shadow-lg space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm font-medium">Instalar Aura</p>
            </div>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 -mt-1 -mr-1" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">1</span>
              <span>Toca <Share className="inline h-3.5 w-3.5 text-primary" /> en Safari</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">2</span>
              <span>"Agregar a pantalla de inicio"</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">3</span>
              <span>Toca "Agregar"</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop install prompt
  if (!installEvent) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[199] sm:left-auto sm:right-4 sm:w-80">
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-card p-4 shadow-lg">
        <Download className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Instalar Aura</p>
          <p className="text-xs text-muted-foreground">Acceso rapido desde tu pantalla de inicio</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" className="h-8" onClick={handleInstall}>
            Instalar
          </Button>
        </div>
      </div>
    </div>
  );
}
