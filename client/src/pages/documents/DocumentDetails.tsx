import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Download, 
  FileText, 
  Calendar, 
  User, 
  Building, 
  Tag,
  Eye,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Document } from "@shared/schema";

export default function DocumentDetails() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const documentId = parseInt(id || "0");

  const { data: document, isLoading } = useQuery<Document>({
    queryKey: ["/api/documents", documentId],
    queryFn: () => apiRequest(`/api/documents/${documentId}`)
  });

  const { data: activities } = useQuery({
    queryKey: ["/api/activities"],
  });

  const { data: events } = useQuery({
    queryKey: ["/api/events"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/documents/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Documento excluído",
        description: "O documento foi excluído com sucesso.",
      });
      setLocation("/documents");
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir documento",
        description: error.message,
      });
    },
  });

  const handleEdit = () => {
    setLocation(`/documents/${documentId}/edit`);
  };

  const handleDelete = () => {
    deleteMutation.mutate(documentId);
  };

  const handleDownload = () => {
    window.open(`/api/files/documents/${documentId}?download=true`, '_blank');
  };

  const handleView = () => {
    window.open(`/api/files/documents/${documentId}`, '_blank');
  };

  const getDocumentTypeBadge = (type: string) => {
    const typeColors: Record<string, { bg: string; text: string }> = {
      "Pauta": { bg: "bg-blue-100", text: "text-blue-800" },
      "Decreto": { bg: "bg-green-100", text: "text-green-800" },
      "Decreto Legislativo": { bg: "bg-purple-100", text: "text-purple-800" },
      "Lei Complementar": { bg: "bg-red-100", text: "text-red-800" },
      "Oficio": { bg: "bg-yellow-100", text: "text-yellow-800" },
      "Parecer": { bg: "bg-orange-100", text: "text-orange-800" },
      "Ata": { bg: "bg-indigo-100", text: "text-indigo-800" },
      "Lista de Presença": { bg: "bg-teal-100", text: "text-teal-800" },
      "Portaria": { bg: "bg-pink-100", text: "text-pink-800" }
    };
    
    const colors = typeColors[type] || { bg: "bg-gray-100", text: "text-gray-800" };
    return `${colors.bg} ${colors.text}`;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, { bg: string; text: string }> = {
      "Vigente": { bg: "bg-green-100", text: "text-green-800" },
      "Revogada": { bg: "bg-red-100", text: "text-red-800" },
      "Alterada": { bg: "bg-yellow-100", text: "text-yellow-800" },
      "Suspenso": { bg: "bg-purple-100", text: "text-purple-800" }
    };
    
    const colors = statusColors[status] || { bg: "bg-gray-100", text: "text-gray-800" };
    return `${colors.bg} ${colors.text}`;
  };

  const getLinkedActivity = () => {
    if (!document?.activityId || !activities) return null;
    return activities.find((activity: any) => activity.id === document.activityId);
  };

  const getLinkedEvent = () => {
    if (!document?.eventId || !events) return null;
    return events.find((event: any) => event.id === document.eventId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Documento não encontrado</h3>
            <p className="text-gray-500 mb-4">O documento solicitado não foi encontrado no sistema.</p>
            <Button onClick={() => setLocation("/documents")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Documentos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const linkedActivity = getLinkedActivity();
  const linkedEvent = getLinkedEvent();
  const documentYear = new Date(document.documentDate).getFullYear();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/documents")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {document.documentType} Nº {document.documentNumber}/{documentYear}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Criado em {format(new Date(document.createdAt || ''), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {document.filePath && (
                <>
                  <Button variant="outline" size="sm" onClick={handleView}>
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PDF Viewer */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Visualização do Documento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {document.filePath ? (
                  <div className="w-full h-[600px] border rounded-lg overflow-hidden">
                    <iframe
                      src={`/api/files/documents/${documentId}`}
                      className="w-full h-full"
                      title={`${document.documentType} Nº ${document.documentNumber}/${documentYear}`}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[600px] text-gray-500">
                    <FileText className="h-16 w-16 mb-4" />
                    <p className="text-lg font-medium mb-2">Nenhum arquivo anexado</p>
                    <p className="text-sm">Este documento não possui arquivo PDF anexado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Information */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Tipo</span>
                  <Badge className={getDocumentTypeBadge(document.documentType)}>
                    {document.documentType}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <Badge className={getStatusBadge(document.status)}>
                    {document.status}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Data do Documento</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(document.documentDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Building className="h-4 w-4 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Autor</p>
                      <Badge variant={document.authorType === "Legislativo" ? "default" : "secondary"}>
                        {document.authorType}
                      </Badge>
                    </div>
                  </div>

                  {document.fileName && (
                    <div className="flex items-start">
                      <FileText className="h-4 w-4 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium">Arquivo</p>
                        <p className="text-sm text-gray-600">{document.fileName}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {document.description || "Nenhuma descrição fornecida."}
                </p>
              </CardContent>
            </Card>

            {/* Related Items */}
            {(linkedActivity || linkedEvent) && (
              <Card>
                <CardHeader>
                  <CardTitle>Itens Relacionados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {linkedActivity && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            Atividade Legislativa
                          </p>
                          <p className="text-sm text-blue-700">
                            {linkedActivity.activityType} Nº {linkedActivity.activityNumber}/
                            {new Date(linkedActivity.activityDate).getFullYear()}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            {linkedActivity.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/activities/${linkedActivity.id}`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {linkedEvent && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            Evento Relacionado
                          </p>
                          <p className="text-sm text-green-700">
                            {linkedEvent.category} Nº {linkedEvent.eventNumber}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            {format(new Date(linkedEvent.eventDate), "dd/MM/yyyy", { locale: ptBR })} - {linkedEvent.eventTime}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/events/${linkedEvent.id}`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">ID do Sistema</span>
                  <span className="font-mono">{document.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Criado em</span>
                  <span>
                    {format(new Date(document.createdAt || ''), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {document.updatedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Atualizado em</span>
                    <span>
                      {format(new Date(document.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                )}
                {document.fileType && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo do Arquivo</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {document.fileType}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}