import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** "numbered" shows individual page buttons with ellipsis, "simple" shows "Page X of Y" */
  variant?: "numbered" | "simple";
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  variant = "numbered",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  if (variant === "simple") {
    return (
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous page"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next page"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        aria-label="Previous page"
        className="h-9 w-9 p-0 cursor-pointer bg-transparent"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
        const isNearCurrent = Math.abs(page - currentPage) <= 1;
        const isEdge = page === 1 || page === totalPages;
        const showPage = isEdge || isNearCurrent;

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

      <Button
        variant="outline"
        size="sm"
        aria-label="Next page"
        className="h-9 w-9 p-0 cursor-pointer bg-transparent"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
