import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EvaluationPhotoUploaderProps {
  tenantId: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

export default function EvaluationPhotoUploader({
  tenantId,
  photos,
  onPhotosChange,
}: EvaluationPhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `${tenantId}/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from("clinical-photos")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          toast.error(`Error al subir ${file.name}`);
          console.error("Upload error:", error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("clinical-photos")
          .getPublicUrl(filePath);

        newUrls.push(urlData.publicUrl);
      }

      if (newUrls.length > 0) {
        onPhotosChange([...photos, ...newUrls]);
        toast.success(`${newUrls.length} foto(s) subida(s)`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Error al subir fotos");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (url: string) => {
    const path = url.split("/clinical-photos/")[1];
    if (path) {
      await supabase.storage.from("clinical-photos").remove([path]);
    }
    onPhotosChange(photos.filter((p) => p !== url));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Camera className="h-4 w-4" />
        Fotos ({photos.length})
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {photos.map((url, i) => (
            <div key={i} className="relative group aspect-square">
              <img
                src={url}
                alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="gap-2"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {uploading ? "Subiendo..." : "Agregar Fotos"}
      </Button>
    </div>
  );
}
