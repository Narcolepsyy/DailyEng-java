import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Optional total-item count shown after the pagination buttons */
  totalLabel?: string;
  /** Use smart ellipsis (for large page counts) vs simple buttons */
  useEllipsis?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalLabel,
  useEllipsis = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {/* Prev */}
      <Button
        variant="outline"
        size="sm"
        className="h-9 w-9 p-0 cursor-pointer bg-transparent"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page buttons */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
        if (useEllipsis) {
          const showPage =
            page === 1 ||
            page === totalPages ||
            Math.abs(page - currentPage) <= 1;

          const showEllipsis =
            (page === 2 && currentPage > 3) ||
            (page === totalPages - 1 && currentPage < totalPages - 2);

          if (showEllipsis) {
            return (
              <span key={page} className="px-2 text-muted-foreground">
                ...
              </span>
            );
          }

          if (!showPage) return null;
        }

        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            className="h-9 w-9 p-0 cursor-pointer"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        );
      })}

      {/* Next */}
      <Button
        variant="outline"
        size="sm"
        className="h-9 w-9 p-0 cursor-pointer bg-transparent"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {totalLabel ? (
        <span className="ml-4 text-sm text-muted-foreground">{totalLabel}</span>
      ) : null}
    </div>
  );
}
