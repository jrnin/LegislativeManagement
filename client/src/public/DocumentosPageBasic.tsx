import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Search, Filter, ChevronDown, ChevronUp, X, Calendar, Tag, LayoutGrid, List, FileDown, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// Interface para documento
interface Document {
  id: number;
  documentNumber: number;
  documentType: string;
  documentDate: string;
  description: string;
  status: string;
  filePath?: string;
  fileName?: string;
}

// Interface para a resposta da API
interface DocumentsResponse {
  documents: Document[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters: {
    documentTypes: string[];
    statusTypes: string[];
  };
}

export default function DocumentosPageBasic() {
  // Estados para filtros e paginação
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filterOptions, setFilterOptions] = useState<{
    documentTypes: string[];
    statusTypes: string[];
  }>({
    documentTypes: [],
    statusTypes: []
  });
  
  // Estados para filtros
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Construir query string para filtros
  const getQueryString = () => {
    const params = new URLSearchParams();
    params.append('limit', '15');
    if (search) params.append('search', search);
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    return params.toString();
  };
  
  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setSearch('');
    setType('');
    setStatus('');
  };

  // Função para carregar documentos com os filtros aplicados
  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/public/documents?${getQueryString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar documentos');
      }
      
      const data: DocumentsResponse = await response.json();
      setDocuments(data.documents || []);
      setFilterOptions({
        documentTypes: data.filters?.documentTypes || [],
        statusTypes: data.filters?.statusTypes || []
      });
      setTotalDocuments(data.pagination?.total || 0);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar documentos:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Efeito para carregar documentos na inicialização
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Determinar cor do badge de status
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'vigente':
        return 'bg-green-100 text-green-800';
      case 'revogada':
        return 'bg-red-100 text-red-800';
      case 'alterada':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspenso':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Alternar exibição dos filtros
  const toggleFilters = () => {
    if (isFilterOpen) {
      setIsFilterVisible(false);
      setTimeout(() => {
        setIsFilterOpen(false);
      }, 300); // Aguardar a animação terminar
    } else {
      setIsFilterOpen(true);
      setIsFilterVisible(true);
    }
  };

  // Aplicar filtros e buscar documentos
  const applyFilters = () => {
    fetchDocuments();
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <FileText size={30} className="text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Documentos Públicos</h1>
        </div>
        
        <div className="flex gap-2">
          <div className="border rounded-md p-1 flex">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('grid')}
              title="Visualização em grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('list')}
              title="Visualização em lista"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={toggleFilters}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {isFilterOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Filtros animados */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: isFilterVisible ? 'auto' : 0,
              opacity: isFilterVisible ? 1 : 0,
            }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <Card className="mb-8 border border-blue-100 shadow-sm">
              <CardContent className="pt-6 pb-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <div className="flex items-center mb-2">
                        <Search className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Pesquisar por texto</span>
                      </div>
                      <Input
                        placeholder="Digite palavras-chave..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center mb-2">
                        <Tag className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Tipo de documento</span>
                      </div>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos os tipos</SelectItem>
                          {filterOptions.documentTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <div className="flex items-center mb-2">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Situação</span>
                      </div>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as situações" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todas as situações</SelectItem>
                          {filterOptions.statusTypes.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Limpar
                    </Button>
                    
                    <Button 
                      onClick={applyFilters} 
                      className="flex items-center gap-2"
                    >
                      <Search className="h-4 w-4" />
                      Aplicar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resumo dos filtros aplicados */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6 flex flex-wrap gap-2 items-center"
      >
        <span className="text-sm text-gray-500">
          {totalDocuments} documento{totalDocuments !== 1 ? 's' : ''} encontrado{totalDocuments !== 1 ? 's' : ''}
        </span>
        
        {search && (
          <Badge variant="outline" className="flex items-center gap-1 bg-blue-50">
            <span>Texto: {search}</span>
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => {
                setSearch('');
                applyFilters();
              }}
            />
          </Badge>
        )}
        
        {type && (
          <Badge variant="outline" className="flex items-center gap-1 bg-blue-50">
            <span>Tipo: {type}</span>
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => {
                setType('');
                applyFilters();
              }}
            />
          </Badge>
        )}
        
        {status && (
          <Badge variant="outline" className="flex items-center gap-1 bg-blue-50">
            <span>Situação: {status}</span>
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => {
                setStatus('');
                applyFilters();
              }}
            />
          </Badge>
        )}
      </motion.div>

      {/* Lista de documentos */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500">Carregando documentos...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <p className="text-red-500 mb-4">Ocorreu um erro ao carregar os documentos: {error.message}</p>
        </div>
      ) : (
        <div>
          {documents.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents.map((doc, index) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <Card className="h-full hover:shadow-md transition-shadow flex flex-col">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-md flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                {doc.documentType} Nº {doc.documentNumber}
                              </CardTitle>
                              <p className="text-sm text-gray-500">{formatDate(doc.documentDate)}</p>
                            </div>
                            <Badge className={getStatusBadgeClass(doc.status)}>
                              {doc.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <p className="text-sm text-gray-700 line-clamp-3">{doc.description}</p>
                        </CardContent>
                        <CardFooter className="pt-2 border-t mt-auto">
                          <a href={`/documentos/${doc.id}`} className="text-blue-600 hover:underline text-sm cursor-pointer">
                            Ver detalhes
                          </a>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-md border shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Tipo / Número</TableHead>
                        <TableHead className="w-[120px]">Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-[100px]">Situação</TableHead>
                        <TableHead className="w-[100px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc, index) => (
                        <motion.tr
                          key={doc.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.2 }}
                          className="border-b last:border-b-0"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" />
                              <span>
                                {doc.documentType} Nº {doc.documentNumber}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(doc.documentDate)}</TableCell>
                          <TableCell className="max-w-md">
                            <p className="truncate">{doc.description}</p>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeClass(doc.status)}>
                              {doc.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <a 
                                href={`/documentos/${doc.id}`}
                                className="inline-flex items-center justify-center p-1 rounded-md text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                                title="Ver detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                              {doc.filePath && (
                                <a 
                                  href={doc.filePath} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center p-1 rounded-md text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                                  title="Baixar documento"
                                >
                                  <FileDown className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-20 bg-gray-50 rounded-lg"
            >
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhum documento encontrado</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Não foram encontrados documentos com os filtros selecionados. Tente ajustar os critérios de busca.
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}