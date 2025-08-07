import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Input } from './input';
import { Button } from './button';
import { Badge } from './badge';
import { Separator } from './separator';
import { ScrollArea } from './scroll-area';
import { 
  Search, 
  FileText, 
  Calendar, 
  Newspaper, 
  Gavel,
  ExternalLink,
  Loader2,
  X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';

interface SearchResult {
  id: string;
  type: 'activity' | 'event' | 'document' | 'news';
  title: string;
  description?: string;
  slug?: string;
  url: string;
  date?: string;
  category?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Debug log
  console.log('SearchModal renderizado, isOpen:', isOpen);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search API call
  const { data: searchResults = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ['/api/search', debouncedQuery],
    queryFn: () => fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`).then(res => res.json()),
    enabled: debouncedQuery.length >= 2,
  });

  const handleResultClick = (result: SearchResult) => {
    onClose();
    // Navigation will be handled by Link component
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'activity':
        return <Gavel className="w-4 h-4 text-blue-600" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-green-600" />;
      case 'document':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'news':
        return <Newspaper className="w-4 h-4 text-orange-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getResultTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'activity':
        return 'Atividade Legislativa';
      case 'event':
        return 'Evento';
      case 'document':
        return 'Documento';
      case 'news':
        return 'Notícia';
      default:
        return 'Resultado';
    }
  };

  const getResultTypeBadgeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'activity':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'event':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'document':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'news':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar no Site
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Digite sua palavra-chave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[400px]">
            <div className="px-6 py-4">
              {!debouncedQuery && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Pesquise no site</p>
                  <p className="text-sm mt-2">
                    Digite pelo menos 2 caracteres para começar a busca
                  </p>
                </div>
              )}

              {debouncedQuery && debouncedQuery.length >= 2 && (
                <>
                  {isLoading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Buscando...
                      </span>
                    </div>
                  )}

                  {!isLoading && searchResults.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Nenhum resultado encontrado</p>
                      <p className="text-sm mt-2">
                        Tente usar palavras-chave diferentes
                      </p>
                    </div>
                  )}

                  {!isLoading && searchResults.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {searchResults.length} resultado(s) encontrado(s)
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          "{debouncedQuery}"
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {searchResults.map((result) => (
                          <Link key={result.id} href={result.url}>
                            <div
                              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
                              onClick={() => handleResultClick(result)}
                            >
                              <div className="flex-shrink-0 mt-1">
                                {getResultIcon(result.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs ${getResultTypeBadgeColor(result.type)}`}
                                  >
                                    {getResultTypeLabel(result.type)}
                                  </Badge>
                                  {result.category && (
                                    <Badge variant="outline" className="text-xs">
                                      {result.category}
                                    </Badge>
                                  )}
                                </div>
                                
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {result.title}
                                </h4>
                                
                                {result.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                    {result.description}
                                  </p>
                                )}
                                
                                {result.date && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                    {new Date(result.date).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex-shrink-0">
                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        <Separator />
        
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Pressione <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">ESC</kbd> para fechar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> para abrir resultado
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}