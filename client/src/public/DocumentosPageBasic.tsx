import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { FileText, Loader2, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

// Interface para paginação
interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Interface para a resposta da API
interface DocumentsResponse {
  documents: Document[];
  pagination: Pagination;
  filters: {
    documentTypes: string[];
    statusTypes: string[];
  };
}

export default function DocumentosPageBasic() {
  // Estados para filtros e paginação
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  
  // Construir query string para filtros
  const getQueryString = () => {
    const params = new URLSearchParams();
    if (page > 1) params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    return params.toString();
  };

  // Buscar documentos da API
  const { data, isLoading, error, refetch } = useQuery<DocumentsResponse>({
    queryKey: ['/api/public/documents', getQueryString()],
    queryFn: async () => {
      const response = await fetch(`/api/public/documents?${getQueryString()}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar documentos');
      }
      return response.json();
    }
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
    setPage(1);
  };

  // Executar busca quando filtros mudam
  useEffect(() => {
    refetch();
  }, [page, limit, search, type, status, refetch]);

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
    <div className="container mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <FileText size={30} className="text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-800">Documentos Públicos</h1>
      </div>

      {/* Filtros */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Pesquisar na descrição..."
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
                      {data?.filters?.documentTypes?.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full md:w-48">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Situação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as situações</SelectItem>
                      {data?.filters?.statusTypes?.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar filtros
              </Button>
              
              <Button 
                onClick={() => refetch()} 
                className="flex items-center"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div>
          {data && data.documents && data.documents.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.documents.map((doc) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
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
                    <CardContent>
                      <p className="text-sm text-gray-700 line-clamp-3">{doc.description}</p>
                    </CardContent>
                    <CardFooter className="pt-2 border-t">
                      <Link href={`/public/documentos/${doc.id}`}>
                        <span className="text-blue-600 hover:underline text-sm cursor-pointer">
                          Ver detalhes
                        </span>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              {renderPagination()}
            </>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-lg">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhum documento encontrado</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Não foram encontrados documentos com os filtros selecionados. Tente ajustar os critérios de busca.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}