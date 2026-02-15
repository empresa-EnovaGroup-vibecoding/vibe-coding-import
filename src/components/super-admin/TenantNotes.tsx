import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface TenantNotesProps {
  tenantId: string;
}

interface Note {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
}

export function TenantNotes({ tenantId }: TenantNotesProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");

  const { data: notes, isLoading } = useQuery({
    queryKey: ["super-admin", "tenant-notes", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_notes")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Note[]) ?? [];
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from("tenant_notes")
        .insert({
          tenant_id: tenantId,
          content,
          created_by: user!.id,
        } as Record<string, unknown>);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "tenant-notes", tenantId] });
      setNewNote("");
      toast.success("Nota agregada");
    },
    onError: (error) => {
      toast.error("Error: " + (error as Error).message);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("tenant_notes")
        .delete()
        .eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "tenant-notes", tenantId] });
      toast.success("Nota eliminada");
    },
    onError: (error) => {
      toast.error("Error: " + (error as Error).message);
    },
  });

  const handleAdd = () => {
    const trimmed = newNote.trim();
    if (!trimmed) return;
    addNoteMutation.mutate(trimmed);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquarePlus className="h-5 w-5" />
          Notas de Soporte
        </CardTitle>
        <CardDescription>Registro interno de interacciones con este negocio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add note */}
        <div className="space-y-2">
          <Textarea
            placeholder="Ej: Hable con el cliente el 15/feb, quiere extender trial..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={addNoteMutation.isPending || !newNote.trim()}
          >
            {addNoteMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MessageSquarePlus className="h-4 w-4 mr-2" />
            )}
            Agregar Nota
          </Button>
        </div>

        {/* Notes list */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notes && notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border p-3 space-y-1 group"
              >
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(note.created_at), {
                      locale: es,
                      addSuffix: true,
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => deleteNoteMutation.mutate(note.id)}
                    disabled={deleteNoteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            Sin notas todavia
          </p>
        )}
      </CardContent>
    </Card>
  );
}
