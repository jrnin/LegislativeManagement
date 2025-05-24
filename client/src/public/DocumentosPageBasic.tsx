import React, { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export default function DocumentosPageBasic() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  
  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };
  
  // Carregar documentos diretamente usando fetch
  useEffect(() => {
    async function fetchDocuments() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/public/documents?limit=15');
        
        if (!response.ok) {
          throw new Error('Erro ao carregar documentos');
        }
        
        const data = await response.json();
        setDocuments(data.documents || []);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar documentos:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setIsLoading(false);
      }
    }
    
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

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <FileText size={30} className="text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-800">Documentos Públicos</h1>
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
          <p className="text-red-500 mb-4">Ocorreu um erro ao carregar os documentos: {error.message}</p>
        </div>
      ) : (
        <div>
          {documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
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
                    <a href={`/documentos/${doc.id}`} className="text-blue-600 hover:underline text-sm cursor-pointer">
                      Ver detalhes
                    </a>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-lg">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhum documento encontrado</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Não foram encontrados documentos. Por favor, tente novamente mais tarde.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}