import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode, Camera, X } from "lucide-react";
import { toast } from "sonner";

interface QRScannerProps {
  onScan: (result: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRScanner({ onScan, isOpen, onOpenChange }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanning = async () => {
    if (!containerRef.current) return;

    try {
      scannerRef.current = new Html5Qrcode("qr-reader");
      
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
          onOpenChange(false);
        },
        () => {
          // QR code not found - silently continue scanning
        }
      );
      
      setIsScanning(true);
    } catch {
      toast.error("Error al acceder a la cámara. Verifica los permisos.");
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Scanner cleanup failed silently
      }
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the container is mounted
      const timer = setTimeout(() => {
        startScanning();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) stopScanning();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Escanear Código QR
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            id="qr-reader"
            ref={containerRef}
            className="w-full aspect-square bg-muted rounded-lg overflow-hidden"
          />
          <p className="text-sm text-muted-foreground text-center">
            Apunta la cámara al código QR del producto
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            {!isScanning && (
              <Button className="flex-1" onClick={startScanning}>
                <Camera className="h-4 w-4 mr-2" />
                Reiniciar Cámara
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
