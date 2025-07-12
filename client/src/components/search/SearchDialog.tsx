import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Search, X, ArrowRight, Calendar, Users, Building, FileText, Files } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';

export type SearchResult = {
  id: string | number;
  title: string;
  description?: string;
  type: 'user' | 'legislature' | 'event' | 'activity' | 'document';
  date?: string;
  status?: string;
  category?: string;
  url: string;
  highlight?: string;
};

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch search results based on the term and active tab
  const { data: searchResults, isLoading } = useQuery<SearchResult[]>({
    queryKey: [
      `/api/search?q=${encodeURIComponent(debouncedSearchTerm)}${activeTab !== 'all' ? `&type=${activeTab}` : ''}`,
      debouncedSearchTerm,
      activeTab
    ],
    enabled: debouncedSearchTerm.length > 2,
  });

  // Reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [open]);

  // Navigate to the result and close dialog
  const handleSelect = (result: SearchResult) => {
    setLocation(result.url);
    onOpenChange(false);
  };

  // Use the results from the API which are already filtered
  const filteredResults = searchResults || [];

  // Get icon for each result type
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="h-4 w-4 text-slate-500" />;
      case 'legislature':
        return <Building className="h-4 w-4 text-blue-500" />;
      case 'event':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'activity':
        return <FileText className="h-4 w-4 text-amber-500" />;
      case 'document':
        return <Files className="h-4 w-4 text-purple-500" />;
      default:
        return <ArrowRight className="h-4 w-4" />;
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Get badge for status
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusMap: Record<string, string> = {
      'aberto': 'status-badge-open',
      'andamento': 'status-badge-in-progress',
      'concluido': 'status-badge-completed',
      'cancelado': 'status-badge-canceled',
      'pendente': 'bg-amber-50 text-amber-700 border-amber-200',
      'aprovado': 'bg-green-50 text-green-700 border-green-200',
      'ativo': 'bg-green-50 text-green-700 border-green-200',
      'inativo': 'bg-gray-50 text-gray-700 border-gray-200',
    };
    
    const className = statusMap[status.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200';
    
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-xl">Busca avançada</DialogTitle>
        </DialogHeader>
        
        <div className="border-t border-b">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
            <CommandInput
              ref={inputRef}
              placeholder="Buscar em todos os módulos..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="pl-12 py-6 shadow-none focus:ring-0 border-0 outline-none"
            />
            {searchTerm && (
              <button 
                className="absolute right-4 top-3.5 p-1 rounded-full hover:bg-slate-100"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            )}
          </div>
        </div>
        
        <Tabs 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="p-1"
        >
          <TabsList className="p-1 bg-slate-50">
            <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
            <TabsTrigger value="user" className="text-xs">Usuários</TabsTrigger>
            <TabsTrigger value="legislature" className="text-xs">Legislaturas</TabsTrigger>
            <TabsTrigger value="event" className="text-xs">Eventos</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">Atividades</TabsTrigger>
            <TabsTrigger value="document" className="text-xs">Documentos</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <Command className="rounded-t-none border-t-0">
              <CommandList>
                <ScrollArea className="h-[300px]">
                  {searchTerm.length <= 2 ? (
                    <div className="py-6 text-center text-sm text-slate-500">
                      Digite pelo menos 3 caracteres para iniciar a busca
                    </div>
                  ) : isLoading ? (
                    <div className="py-6 text-center">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm text-slate-500">Buscando...</p>
                    </div>
                  ) : filteredResults.length === 0 ? (
                    <CommandEmpty className="py-6 text-center">
                      Nenhum resultado encontrado para "{searchTerm}"
                    </CommandEmpty>
                  ) : (
                    <>
                      <CommandGroup heading="Resultados da busca">
                        {filteredResults.map((result) => (
                          <CommandItem
                            key={`${result.type}-${result.id}`}
                            onSelect={() => handleSelect(result)}
                            className="px-4 py-3 cursor-pointer"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {getResultIcon(result.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="text-sm font-medium text-slate-900 truncate">
                                    {result.title}
                                  </h4>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {result.date && (
                                      <span className="text-xs text-slate-500">
                                        {formatDate(result.date)}
                                      </span>
                                    )}
                                    {getStatusBadge(result.status)}
                                  </div>
                                </div>
                                {result.description && (
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                    {result.description}
                                  </p>
                                )}
                                {result.highlight && (
                                  <div className="mt-1 text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded">
                                    ...{result.highlight}...
                                  </div>
                                )}
                                <div className="mt-1 flex items-center gap-2">
                                  {result.category && (
                                    <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {result.category}
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-400 capitalize">
                                    {result.type === 'activity' ? 'Atividade' : 
                                     result.type === 'document' ? 'Documento' : 
                                     result.type === 'event' ? 'Evento' : 
                                     result.type === 'legislature' ? 'Legislatura' : 'Usuário'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </ScrollArea>
              </CommandList>
            </Command>
          </TabsContent>
        </Tabs>
        
        <div className="p-3 text-xs text-slate-500 border-t bg-slate-50">
          Dica: Pressione <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700">↑</kbd> e <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700">↓</kbd> para navegar, <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700">Enter</kbd> para selecionar, e <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700">Esc</kbd> para fechar.
        </div>
      </DialogContent>
    </Dialog>
  );
}