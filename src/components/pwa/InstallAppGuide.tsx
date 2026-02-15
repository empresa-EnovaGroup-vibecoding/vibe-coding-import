import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Share, PlusSquare, MoreVertical, Download, CheckCircle2 } from "lucide-react";

type DeviceType = "ios" | "android" | "desktop";

function getDevice(): DeviceType {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone === true);
}

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const IOS_STEPS: Step[] = [
  {
    icon: <Share className="h-5 w-5" />,
    title: "Toca el boton de Compartir",
    description: "Es el cuadrito con la flecha hacia arriba, en la barra de Safari",
  },
  {
    icon: <PlusSquare className="h-5 w-5" />,
    title: "\"Agregar a pantalla de inicio\"",
    description: "Desliza las opciones hacia abajo hasta encontrar esta opcion",
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "Toca \"Agregar\"",
    description: "Nexus aparecera como app en tu pantalla de inicio con el icono morado",
  },
];

const ANDROID_STEPS: Step[] = [
  {
    icon: <MoreVertical className="h-5 w-5" />,
    title: "Toca el menu de 3 puntos",
    description: "Esta en la esquina superior derecha de Chrome",
  },
  {
    icon: <Download className="h-5 w-5" />,
    title: "\"Instalar aplicacion\" o \"Agregar a inicio\"",
    description: "Si aparece un banner abajo, tambien puedes tocar \"Instalar\" ahi",
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "Confirma la instalacion",
    description: "Nexus aparecera como app en tu pantalla de inicio",
  },
];

const DESKTOP_STEPS: Step[] = [
  {
    icon: <Download className="h-5 w-5" />,
    title: "Busca el icono de instalar",
    description: "En Chrome, aparece en la barra de direcciones (lado derecho) o en el menu",
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "Haz clic en \"Instalar\"",
    description: "Nexus se abrira como una ventana independiente sin barras del navegador",
  },
];

export function InstallAppGuide() {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setDevice(getDevice());
    setInstalled(isStandalone());
  }, []);

  if (installed) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium">App instalada</p>
            <p className="text-sm text-muted-foreground">Nexus ya esta instalada en este dispositivo</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const steps = device === "ios" ? IOS_STEPS : device === "android" ? ANDROID_STEPS : DESKTOP_STEPS;
  const deviceLabel = device === "ios" ? "iPhone / iPad" : device === "android" ? "Android" : "Computadora";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Instalar Nexus como app
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Instala Nexus en tu {deviceLabel} para acceso rapido sin abrir el navegador.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-primary">{step.icon}</span>
                  <p className="font-medium text-sm">{step.title}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {device !== "desktop" && (
          <div className="mt-4 rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
            Despues de instalar, Nexus se abre en pantalla completa, sin barras del navegador, y se actualiza automaticamente.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
