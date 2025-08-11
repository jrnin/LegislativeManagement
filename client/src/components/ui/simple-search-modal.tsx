import { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Badge } from './badge';
import { 
  Search, 
  FileText, 
  Calendar, 
  Newspaper, 
  Gavel,
  Loader2,
  X,
  Users,
  Building
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

interface SimpleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'all' | 'document' | 'activity' | 'event' | 'news' | 'user';

const searchTabs = [
  { key: 'all', label: 'Todos os resultados', icon: Search },
  { key: 'document', label: 'Documentos', icon: FileText },
  { key: 'activity', label: 'Atividades Legislativas', icon: Gavel },
  { key: 'event', label: 'Eventos', icon: Calendar },
  { key: 'news', label: 'Notícias', icon: Newspaper },
  { key: 'user', label: 'Usuários', icon: Users }
] as const;

export function SimpleSearchModal({ isOpen, onClose }: SimpleSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const inputRef = useRef<HTMLInputElement>(null);

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
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Search API call using public endpoint with type filter
  const { data: searchResults = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ['/api/public/search', debouncedQuery, activeTab],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const typeParam = activeTab === 'all' ? '' : `&type=${activeTab}`;
      const response = await fetch(`/api/public/search?q=${encodeURIComponent(debouncedQuery)}${typeParam}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleResultClick = () => {
    onClose();
  };

  // Filter results based on active tab and get counts
  const filteredResults = activeTab === 'all' 
    ? searchResults 
    : searchResults.filter(result => result.type === activeTab);

  // Get counts by type
  const getTabCount = (tabType: TabType) => {
    if (tabType === 'all') return searchResults.length;
    return searchResults.filter(result => result.type === tabType).length;
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-gray-800">Buscar no Site</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Search Input */}
        <div className="px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-800" />
            <Input 
              ref={inputRef}
              type="text"
              placeholder="Digite sua palavra-chave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 text-black dark:text-white"
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

        {/* Search Tabs */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-2">
          <div className="flex flex-wrap gap-2">
            {searchTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-colors
                    ${activeTab === tab.key
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  {debouncedQuery && debouncedQuery.length >= 2 && (
                    <Badge 
                      variant="secondary" 
                      className={`ml-1 text-xs ${
                        activeTab === tab.key
                          ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {getTabCount(tab.key)}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="max-h-[400px] overflow-y-auto">
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

                  {!isLoading && filteredResults.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Nenhum resultado encontrado</p>
                      <p className="text-sm mt-2">
                        Tente usar palavras-chave diferentes{activeTab !== 'all' ? ` em ${searchTabs.find(tab => tab.key === activeTab)?.label}` : ''}
                      </p>
                    </div>
                  )}

                  {!isLoading && filteredResults.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {filteredResults.length} resultado{filteredResults.length !== 1 ? 's' : ''} encontrado{filteredResults.length !== 1 ? 's' : ''}
                        {activeTab !== 'all' && ` em ${searchTabs.find(tab => tab.key === activeTab)?.label}`}
                      </p>
                      
                      {filteredResults.map((result) => (
                        <Link
                          key={result.id}
                          href={result.url}
                          onClick={handleResultClick}
                        >
                          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {getResultIcon(result.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                                    {result.title}
                                  </h3>
                                  <Badge
                                    className={`${getResultTypeBadgeColor(result.type)} text-xs shrink-0`}
                                  >
                                    {getResultTypeLabel(result.type)}
                                  </Badge>
                                </div>
                                
                                {result.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                    {result.description}
                                  </p>
                                )}
                                
                                {result.date && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {new Date(result.date).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}