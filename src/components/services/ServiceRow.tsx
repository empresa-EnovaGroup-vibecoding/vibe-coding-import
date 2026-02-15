import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Clock } from "lucide-react";

interface ServiceRowProps {
  service: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    duration: number;
    price: number;
  };
  isSelected: boolean;
  isOwner: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (service: ServiceRowProps["service"]) => void;
  onDelete: (id: string) => void;
}

export function ServiceRow({
  service,
  isSelected,
  isOwner,
  onToggleSelect,
  onEdit,
  onDelete,
}: ServiceRowProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
        isSelected ? "bg-primary/5" : "hover:bg-muted/30"
      }`}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggleSelect(service.id)}
      />

      {/* Name ............ Price */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {service.name}
          </span>
          <span className="flex-1 border-b border-dotted border-muted-foreground/20 min-w-4" />
          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
            Q{Number(service.price).toFixed(2)}
          </span>
        </div>
        {service.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {service.description}
          </p>
        )}
      </div>

      {/* Duration badge */}
      <Badge variant="outline" className="text-[10px] font-normal gap-1 shrink-0 hidden sm:inline-flex">
        <Clock className="h-3 w-3" />
        {service.duration} min
      </Badge>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(service)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        {isOwner && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(service.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
