import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interface simplificada para documento
interface Document {
  id: number;
  documentNumber: number;
  documentType: string;
  documentDate: string;
  description: string;
  status: string;
}

export default function DocumentosPageBasic() {
  // Buscar documentos da API
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/public/documents'],
  });

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
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
          <p className="text-red-500 mb-4">Ocorreu um erro ao carregar os documentos.</p>
          <Button variant="outline">
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div>
          {data && data.documents && data.documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.documents.map((doc: Document) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-md">
                      {doc.documentType} Nº {doc.documentNumber}
                    </CardTitle>
                    <p className="text-sm text-gray-500">{formatDate(doc.documentDate)}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-4 line-clamp-3">{doc.description}</p>
                    <div className="flex justify-between items-center">
                      <Link href={`/public/documentos/${doc.id}`}>
                        <span className="text-blue-600 hover:underline text-sm cursor-pointer">
                          Ver detalhes
                        </span>
                      </Link>
                      <div className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {doc.status}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-lg">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhum documento encontrado</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Não foram encontrados documentos no sistema.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}