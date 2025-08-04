import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Componentes compatíveis com a implementação existente
export const PaginationContent = ({ children, className = "", ...props }: { children: React.ReactNode, className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`} {...props}>
    {children}
  </div>
);

export const PaginationItem = ({ children, className = "", ...props }: { children: React.ReactNode, className?: string }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const PaginationPrevious = ({ onClick, disabled, className = "", ...props }: { onClick?: () => void, disabled?: boolean, className?: string }) => (
  <Button
    variant="outline"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-1 ${className}`}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    Anterior
  </Button>
);

export const PaginationNext = ({ onClick, disabled, className = "", ...props }: { onClick?: () => void, disabled?: boolean, className?: string }) => (
  <Button
    variant="outline"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-1 ${className}`}
    {...props}
  >
    Próximo
    <ChevronRight className="h-4 w-4" />
  </Button>
);

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemName?: string; // 'atividades', 'documentos', etc.
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemName = 'itens'
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Calcular números das páginas a serem exibidas
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Máximo de páginas visíveis
    
    if (totalPages <= maxVisible) {
      // Se total de páginas é menor que o máximo, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para páginas com ellipsis
      if (currentPage <= 4) {
        // Início: 1 2 3 4 5 ... 20
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Final: 1 ... 16 17 18 19 20
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Meio: 1 ... 8 9 10 ... 20
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
      {/* Informações dos resultados */}
      <div className="text-sm text-gray-600">
        Exibindo {startItem} a {endItem} de {totalItems} {itemName}
      </div>

      {/* Controles de paginação */}
      <div className="flex items-center gap-2">
        {/* Botão anterior */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        {/* Números das páginas */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-gray-500"
                >
                  ...
                </span>
              );
            }

            const pageNumber = page as number;
            const isActive = pageNumber === currentPage;

            return (
              <Button
                key={pageNumber}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNumber)}
                className={`min-w-[40px] ${
                  isActive 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>

        {/* Botão próximo */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1"
        >
          Próximo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}