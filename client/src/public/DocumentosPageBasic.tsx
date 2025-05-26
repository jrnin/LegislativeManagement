import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Search, Filter, X, Download, Eye } from 'lucide-react';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';

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
  const [totalDocuments, setTotalDocuments] = useState(0);
  
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

  // Aplicar filtros e buscar documentos
  const applyFilters = () => {
    fetchDocuments();
  };

  // Função para download do documento
  const handleDownload = (doc: Document) => {
    if (!doc.filePath) return;
    
    const link = document.createElement('a');
    link.href = doc.filePath;
    link.download = doc.fileName || `${doc.documentType}-${doc.documentNumber}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Helmet>
        <title>Documentos Públicos | Sistema Legislativo</title>
        <meta name="description" content="Consulte documentos públicos da Câmara Municipal com ferramentas de busca e filtros avançados." />
      </Helmet>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4">Documentos Públicos</h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                Acesse documentos oficiais, leis, decretos, atas e outros arquivos públicos da 
                Câmara Municipal. Utilize ferramentas de busca avançada para encontrar informações específicas.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FileText size={64} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        {/* Filtros Horizontais */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Filter className="h-5 w-5 mr-2 text-blue-600" />
            Filtrar Documentos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pesquisar por texto
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Digite palavras-chave..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de documento
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Situação
              </label>
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
            
            <div className="flex flex-col justify-end">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
                
                <Button 
                  onClick={applyFilters} 
                  className="flex-1"
                >
                  <Search className="h-4 w-4 mr-1" />
                  Buscar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo dos filtros aplicados */}
        {(search || type || status) && (
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500">
              Filtros aplicados:
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
          </div>
        )}

        {/* Resultados */}
        <div className="mb-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {totalDocuments} documento{totalDocuments !== 1 ? 's' : ''} encontrado{totalDocuments !== 1 ? 's' : ''}
          </span>
        </div>

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
              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[200px] font-semibold">Documento</TableHead>
                      <TableHead className="w-[120px] font-semibold">Data</TableHead>
                      <TableHead className="font-semibold">Descrição</TableHead>
                      <TableHead className="w-[120px] font-semibold">Situação</TableHead>
                      <TableHead className="w-[180px] text-center font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc, index) => (
                      <motion.tr
                        key={doc.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {doc.documentType} Nº {doc.documentNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                {doc.fileName || 'Documento PDF'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(doc.documentDate)}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-gray-700 line-clamp-2" title={doc.description}>
                            {doc.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeClass(doc.status)}>
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/documentos/${doc.id}`, '_blank')}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              Visualizar
                            </Button>
                            {doc.filePath ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                                className="flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                Download
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="flex items-center gap-1 opacity-50"
                              >
                                <Download className="h-3 w-3" />
                                Indisponível
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
    </>
  );
}