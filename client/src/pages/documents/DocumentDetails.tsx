import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, FileText, Calendar, User, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Document {
  id: number;
  documentNumber: string;
  title: string;
  description: string;
  documentType: string;
  filePath: string;
  uploadedBy: string;
  uploadDate: string;
  eventId?: number;
  activityId?: number;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  event?: {
    id: number;
    eventNumber: string;
    category: string;
    eventDate: string;
  };
  activity?: {
    id: number;
    activityNumber: string;
    activityType: string;
    description: string;
  };
}

export default function DocumentDetails() {
  const { id } = useParams<{ id: string }>();
  const documentId = parseInt(id || "0");

  const { data: document, isLoading, error } = useQuery<Document>({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const response = await apiRequest<Document>(`/api/documents/${documentId}`);
      return response;
    },
    enabled: !!documentId,
  });

  const handleDownload = () => {
    if (document?.filePath) {
      const downloadUrl = `/api/documents/${documentId}/download`;
      window.open(downloadUrl, '_blank');
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'Projeto de Lei':
        return 'bg-blue-100 text-blue-800';
      case 'Projeto de Decreto Legislativo':
        return 'bg-pink-100 text-pink-800';
      case 'Emenda':
        return 'bg-green-100 text-green-800';
      case 'Requerimento':
        return 'bg-yellow-100 text-yellow-800';
      case 'Moção':
        return 'bg-purple-100 text-purple-800';
      case 'Ofício':
        return 'bg-orange-100 text-orange-800';
      case 'Parecer':
        return 'bg-red-100 text-red-800';
      case 'Ata':
        return 'bg-gray-100 text-gray-800';
      case 'Lista de Presença':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Erro ao carregar detalhes do documento</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Detalhes do Documento</h1>
        <p className="text-gray-600">#{document.documentNumber}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informações do Documento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="font-medium text-gray-700">Título:</label>
              <p className="text-gray-900">{document.title}</p>
            </div>
            
            <div>
              <label className="font-medium text-gray-700">Tipo:</label>
              <div className="mt-1">
                <Badge className={getDocumentTypeColor(document.documentType)}>
                  {document.documentType}
                </Badge>
              </div>
            </div>
            
            {document.description && (
              <div>
                <label className="font-medium text-gray-700">Descrição:</label>
                <p className="text-gray-900 whitespace-pre-wrap">{document.description}</p>
              </div>
            )}
            
            <div>
              <label className="font-medium text-gray-700">Data de Upload:</label>
              <p className="text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {document.uploadDate && !isNaN(new Date(document.uploadDate).getTime()) 
                  ? format(new Date(document.uploadDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                  : 'Data não disponível'
                }
              </p>
            </div>
            
            {document.user && (
              <div>
                <label className="font-medium text-gray-700">Enviado por:</label>
                <p className="text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {document.user.name}
                </p>
              </div>
            )}
            
            <div className="pt-4">
              <Button onClick={handleDownload} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Baixar Documento
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Associated Content */}
        <Card>
          <CardHeader>
            <CardTitle>Conteúdo Associado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {document.event && (
              <div>
                <label className="font-medium text-gray-700">Evento Associado:</label>
                <Card className="mt-2">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Evento #{document.event.eventNumber}</p>
                        <p className="text-sm text-gray-600">{document.event.category}</p>
                        <p className="text-sm text-gray-500">
                          {document.event.eventDate && !isNaN(new Date(document.event.eventDate).getTime()) 
                            ? format(new Date(document.event.eventDate), "dd/MM/yyyy", { locale: ptBR })
                            : 'Data não disponível'
                          }
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Evento
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {document.activity && (
              <div>
                <label className="font-medium text-gray-700">Atividade Associada:</label>
                <Card className="mt-2">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{document.activity.activityType} #{document.activity.activityNumber}</p>
                        <p className="text-sm text-gray-600">{document.activity.description}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Atividade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {!document.event && !document.activity && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Este documento não está associado a nenhum evento ou atividade específica.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}