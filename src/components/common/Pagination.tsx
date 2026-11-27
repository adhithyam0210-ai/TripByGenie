import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#EFE7DA] bg-[#F8F1E7]/30 text-xs text-[#173247]/70">
      <div>
        {totalItems !== undefined && pageSize !== undefined ? (
          <span>
            Showing <strong className="text-[#082C43]">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-[#082C43]">
              {Math.min(currentPage * pageSize, totalItems)}
            </strong>{' '}
            of <strong className="text-[#082C43]">{totalItems}</strong> entries
          </span>
        ) : (
          <span>
            Page <strong className="text-[#082C43]">{currentPage}</strong> of{' '}
            <strong className="text-[#082C43]">{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-[#EFE7DA] bg-white text-[#082C43] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F8F1E7] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .map((p, idx, arr) => {
            const prev = arr[idx - 1];
            const showEllipsis = prev && p - prev > 1;

            return (
              <React.Fragment key={p}>
                {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                <button
                  onClick={() => onPageChange(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    p === currentPage
                      ? 'bg-[#FF0000] text-white'
                      : 'border border-[#EFE7DA] bg-white text-[#082C43] hover:bg-[#F8F1E7]'
                  }`}
                >
                  {p}
                </button>
              </React.Fragment>
            );
          })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-[#EFE7DA] bg-white text-[#082C43] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F8F1E7] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
