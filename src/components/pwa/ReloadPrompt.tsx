import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[200] sm:left-auto sm:right-4 sm:w-80">
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-card p-4 shadow-lg">
        <RefreshCw className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Nueva version disponible</p>
          <p className="text-xs text-muted-foreground">Actualiza para ver los cambios</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setNeedRefresh(false)}>
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" className="h-8" onClick={() => updateServiceWorker(true)}>
            Actualizar
          </Button>
        </div>
      </div>
    </div>
  );
}
