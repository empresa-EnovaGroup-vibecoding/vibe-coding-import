import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

interface TablePaginationProps {
  page: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  page,
  totalCount,
  pageSize = PAGE_SIZE,
  onPageChange,
}: TablePaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalCount);

  if (totalCount <= pageSize) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Mostrando {from}-{to} de {totalCount}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          {page + 1} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="gap-1"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export { PAGE_SIZE };
