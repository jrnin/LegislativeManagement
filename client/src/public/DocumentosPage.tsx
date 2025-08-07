import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, 
  Search, 
  Calendar, 
  FilterX, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Helmet } from 'react-helmet';

// Interface para documento
interface Document {
  id: number;
  documentNumber: number;
  documentType: string;
  documentDate: string;
  authorType: string;
  description: string;
  filePath?: string;
  fileName?: string;
  fileType?: string;
  status: string;
  activityId?: number;
  eventId?: number;
  parentDocumentId?: number;
  createdAt: string;
  updatedAt: string;
}

// Interface para paginação
interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Interface para filtros disponíveis
interface Filters {
  documentTypes: string[];
  statusTypes: string[];
}

// Interface para a resposta da API
interface DocumentsResponse {
  documents: Document[];
  pagination: Pagination;
  filters: Filters;
}

export default function DocumentosPage() {
  // Estados para filtros e paginação
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Construir query string para filtros
  const getQueryString = () => {
    const params = new URLSearchParams();
    if (page > 1) params.append('page', page.toString());
    if (limit !== 10) params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return params.toString();
  };

  // Buscar documentos da API
  const { data, isLoading, error, refetch } = useQuery<DocumentsResponse>({
    queryKey: [`/api/public/documents?${getQueryString()}`],
  });

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setSearch('');
    setType('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Executar busca quando filtros mudam
  useEffect(() => {
    refetch();
  }, [page, limit, search, type, status, startDate, endDate, refetch]);

  // Função para baixar arquivo
  const downloadFile = (document: Document) => {
    if (document.filePath) {
      window.open(document.filePath, '_blank');
    }
  };

  // Determinar cor do badge de status
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'vigente':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'revogada':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'alterada':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'suspenso':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    }
  };

  // Renderizar grid de documentos
  const renderDocumentGrid = () => {
    if (!data || !data.documents.length) {
      return (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhum documento encontrado</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Tente ajustar os filtros ou realizar uma nova busca para encontrar o que procura.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.documents.map(doc => (
          <Card key={doc.id} className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-md flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    {doc.documentType} Nº {doc.documentNumber}
                  </CardTitle>
                  <CardDescription>
                    {formatDate(doc.documentDate)}
                  </CardDescription>
                </div>
                <Badge className={getStatusBadgeClass(doc.status)}>
                  {doc.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 line-clamp-3">{doc.description}</p>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Link href={`/public/documentos/${doc.id}`}>
                <span className="text-xs text-blue-600 hover:underline flex items-center">
                  Ver detalhes
                  <ChevronRight className="h-3 w-3 ml-1" />
                </span>
              </Link>
              {doc.filePath && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-blue-600 hover:underline flex items-center"
                  onClick={() => downloadFile(doc)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Baixar
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  // Renderizar tabela de documentos
  const renderDocumentTable = () => {
    if (!data || !data.documents.length) {
      return (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhum documento encontrado</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Tente ajustar os filtros ou realizar uma nova busca para encontrar o que procura.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.documents.map(doc => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm">{doc.documentType}</td>
                <td className="px-4 py-4 text-sm">{doc.documentNumber}</td>
                <td className="px-4 py-4 text-sm">{formatDate(doc.documentDate)}</td>
                <td className="px-4 py-4 text-sm">
                  <div className="line-clamp-2">{doc.description}</div>
                </td>
                <td className="px-4 py-4 text-sm text-right">
                  <Badge className={getStatusBadgeClass(doc.status)}>
                    {doc.status}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-sm text-right">
                  <div className="flex justify-end space-x-2">
                    <Link href={`/public/documentos/${doc.id}`}>
                      <span className="text-blue-600 hover:underline text-xs">
                        Ver detalhes
                      </span>
                    </Link>
                    {doc.filePath && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => downloadFile(doc)}
                      >
                        Baixar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizar paginação
  const renderPagination = () => {
    if (!data || !data.pagination || data.pagination.pages <= 1) {
      return null;
    }

    return (
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
        <div className="text-sm text-gray-500 w-full md:w-auto text-center md:text-left">
          Mostrando {(data.pagination.page - 1) * data.pagination.limit + 1} a{' '}
          {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}{' '}
          de {data.pagination.total} documentos
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {Array.from({ length: Math.min(5, data.pagination.pages) }, (_, i) => {
            let pageNum;
            if (data.pagination.pages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= data.pagination.pages - 2) {
              pageNum = data.pagination.pages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            
            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(data?.pagination.pages || 1, p + 1))}
            disabled={page === (data?.pagination.pages || 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (

    
    <div className="max-w-7xl mx-auto py-12 px-4">
      <Helmet>
        <title>Documentos Públicos - Sistema Legislativo</title>
        <meta name="description" content="Acesse documentos oficiais, decretos, leis, e outros documentos públicos do Sistema Legislativo." />
      </Helmet>

      <div className="flex items-center gap-3 mb-8">
        <FileText size={30} className="text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-800">Documentos Públicos</h1>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Pesquisar documentos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10"
                  />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-48">
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os tipos</SelectItem>
                      {data?.filters.documentTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full md:w-48">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os status</SelectItem>
                      {data?.filters.statusTypes.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-auto">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Data inicial</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="w-full md:w-auto">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Data final</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="flex items-center w-full md:w-auto justify-center"
                >
                  <FilterX className="h-4 w-4 mr-2" />
                  Limpar filtros
                </Button>
                
                <Button 
                  onClick={() => refetch()} 
                  className="flex items-center w-full md:w-auto justify-center"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {data?.pagination.total || 0} documentos encontrados
        </div>
        
        <Tabs defaultValue="grid" onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="grid">Grade</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500">Carregando documentos...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <p className="text-red-500 mb-4">Ocorreu um erro ao carregar os documentos.</p>
          <Button onClick={() => refetch()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div>
          {viewMode === 'grid' ? renderDocumentGrid() : renderDocumentTable()}
          {renderPagination()}
        </div>
      )}
    </div>
  );
}