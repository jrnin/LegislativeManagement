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
      const response = await fetch(`/api/public/documents?${getQueryString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar documentos: ${response.status}`);
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
        {/* Barra de Busca Principal */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar documentos
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Digite o número, tipo ou palavras-chave do documento..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 h-12 text-base"
                />
              </div>
            </div>
            
            <Button 
              onClick={applyFilters} 
              className="h-12 px-8 bg-blue-600 hover:bg-blue-700"
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>

        {/* Filtros Avançados */}
        <div className="bg-gray-50 rounded-lg border p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Tipo:</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  {filterOptions.documentTypes.map((docType, index) => (
                    <SelectItem key={`${docType}-${index}`} value={docType}>{docType}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Situação:</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas as situações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as situações</SelectItem>
                  {filterOptions.statusTypes.map((statusType, index) => (
                    <SelectItem key={`${statusType}-${index}`} value={statusType}>{statusType}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(search || type || status) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            )}
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

        {/* Cabeçalho dos Resultados */}
        <div className="mb-6 bg-white rounded-lg border p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Documentos Encontrados</h2>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {totalDocuments} {totalDocuments === 1 ? 'documento' : 'documentos'}
              </Badge>
            </div>
            
            {totalDocuments > 0 && (
              <div className="text-sm text-gray-500">
                Ordenado por data (mais recente primeiro)
              </div>
            )}
          </div>
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
              <div className="space-y-4">
                {documents.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      {/* Informações principais do documento */}
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {doc.documentType} Nº {doc.documentNumber}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <span>Data: {formatDate(doc.documentDate)}</span>
                              </span>
                              <span>•</span>
                              <span>{doc.fileName || 'Documento PDF'}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Descrição */}
                        <div className="mb-4">
                          <p className="text-gray-700 leading-relaxed">
                            {doc.description}
                          </p>
                        </div>
                        
                        {/* Status e ações na mesma linha */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">Situação:</span>
                            <Badge className={getStatusBadgeClass(doc.status)}>
                              {doc.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/documentos/${doc.id}`, '_blank')}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Visualizar
                            </Button>
                            
                            {doc.filePath ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                              >
                                <Download className="h-4 w-4" />
                                Baixar PDF
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="flex items-center gap-2 opacity-50"
                              >
                                <Download className="h-4 w-4" />
                                Indisponível
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
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