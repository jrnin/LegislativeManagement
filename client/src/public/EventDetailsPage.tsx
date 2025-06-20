import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowLeft, 
  ExternalLink,
  Loader2,
  AlertCircle,
  FileText,
  Users,
  Vote,
  Activity,
  GitCommit,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock as ClockIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function EventDetailsPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch comprehensive event details with activities, documents, attendance
  const { data: eventDetails, isLoading, error } = useQuery({
    queryKey: ['/api/public/events', id, 'details'],
    queryFn: async () => {
      const response = await fetch(`/api/public/events/${id}/details`);
      if (!response.ok) {
        throw new Error('Evento não encontrado');
      }
      return response.json();
    },
    enabled: !!id
  });

  // Extract data from comprehensive response
  const event = eventDetails;
  const activities = eventDetails?.activities || [];
  const documents = eventDetails?.documents || [];
  const attendance = eventDetails?.attendance || [];
  const legislature = eventDetails?.legislature;

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getYouTubeEmbedUrl = (url: string): string | undefined => {
    if (!url) return undefined;
    
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    
    return undefined;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{color: '#48654e'}} />
          <p className="text-gray-600">Carregando detalhes do evento...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Evento não encontrado</h1>
          <p className="text-gray-600 mb-6">
            O evento que você está procurando não existe ou foi removido.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{event.title} - Portal Público</title>
        <meta name="description" content={`Detalhes do evento: ${event.title}. ${event.description}`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao início
                </Button>
              </Link>
              
              <Badge className={getStatusColor(event.status)}>
                {event.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Event Header */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-3" style={{borderColor: '#7FA653', color: '#63783D'}}>
                      {event.category}
                    </Badge>
                    <CardTitle className="text-3xl font-bold mb-4" style={{color: '#48654e'}}>
                      {event.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full" style={{backgroundColor: '#f0f4f0'}}>
                      <Calendar className="h-5 w-5" style={{color: '#48654e'}} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Data</p>
                      <p className="font-semibold">{formatEventDate(event.eventDate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full" style={{backgroundColor: '#f0f4f0'}}>
                      <Clock className="h-5 w-5" style={{color: '#48654e'}} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Horário</p>
                      <p className="font-semibold">{event.eventTime}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full" style={{backgroundColor: '#f0f4f0'}}>
                      <MapPin className="h-5 w-5" style={{color: '#48654e'}} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Local</p>
                      <p className="font-semibold">{event.location}</p>
                      {event.mapUrl && (
                        <a 
                          href={event.mapUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-1"
                        >
                          Ver no mapa <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Description */}
                {event.description && (
                  <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3" style={{color: '#48654e'}}>
                      Descrição
            </h3>
            <div className="prose max-w-none">
             <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {event.description}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video and Gallery Card */}
            {event.videoUrl && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-lg" style={{color: '#48654e'}}>
                    Vídeo da Sessão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Video Column - Left */}
                    <div>
                      <div 
                        className="aspect-video rounded-lg overflow-hidden relative cursor-pointer group"
                        style={{
                          background: 'linear-gradient(135deg, #48654e 0%, #7FA653 100%)'
                        }}
                        onClick={() => window.open(event.videoUrl, '_blank')}
                      >
                        {/* Background overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                        
                        {/* Content */}
                        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white p-6">
                          {/* Brasão/Logo placeholder */}
                          <div className="mb-3">
                            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                              <svg className="w-10 h-10 text-green-700" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                              </svg>
                            </div>
                          </div>
                          
                          {/* Play button */}
                          <div className="mb-4">
                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                          
                          {/* Session info */}
                          <div className="text-center">
                            <div className="bg-black bg-opacity-60 px-4 py-2 rounded-lg mb-2">
                              <p className="text-sm font-medium uppercase tracking-wider">
                                SESSÃO ORDINÁRIA
                              </p>
                              <p className="text-lg font-bold">
                                CÂMARA MUNICIPAL DE JAÍBA
                              </p>
                            </div>
                            <p className="text-sm opacity-90">
                              {formatEventDate(event.eventDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Event title below video */}
                      <div className="mt-3 text-center">
                        <h4 className="font-semibold text-gray-800">
                          {event.category} #{event.eventNumber} - {formatEventDate(event.eventDate)}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {event.description}
                        </p>
                      </div>
                    </div>

                    {/* Gallery Column - Right */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4" style={{color: '#48654e'}}>
                        Galeria de Imagens
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Sample gallery images - these would come from the event data */}
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-pointer">
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 group-hover:from-gray-300 group-hover:to-gray-400 transition-all duration-300">
                            <div className="text-center">
                              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                              </svg>
                              <p className="text-xs text-gray-500">Plenário</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-pointer">
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200 group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300">
                            <div className="text-center">
                              <svg className="w-8 h-8 mx-auto mb-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                              <p className="text-xs text-green-600">Mesa</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-pointer">
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                            <div className="text-center">
                              <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                              </svg>
                              <p className="text-xs text-blue-600">Galeria</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-pointer">
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300">
                            <div className="text-center">
                              <svg className="w-8 h-8 mx-auto mb-2 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H19V1h-2v1H7V1H5v1H4.5C3.67 2 3 2.67 3 3.5V5h18V3.5C21 2.67 20.33 2 19.5 2z"/>
                              </svg>
                              <p className="text-xs text-purple-600">Exterior</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Gallery description */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Imagens da sessão capturadas durante o evento. Clique nas imagens para ampliar e visualizar os detalhes da sessão legislativa.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Information Tabs */}
            <Card>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-5 bg-gray-50 border-b rounded-none">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Visão Geral
                    </TabsTrigger>
                    <TabsTrigger value="activities" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Atividades
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documentos
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Lista de Presença
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="flex items-center gap-2">
                      <GitCommit className="h-4 w-4" />
                      Linha do Tempo
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4" style={{color: '#48654e'}}>
                          Informações do Evento
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-500">Número do Evento:</span>
                            <span className="ml-2">#{event.eventNumber}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Categoria:</span>
                            <span className="ml-2">{event.category}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Status:</span>
                            <Badge className={`ml-2 ${getStatusColor(event.status)}`}>
                              {event.status}
                            </Badge>
                          </div>
                          {legislature && (
                            <div>
                              <span className="font-medium text-gray-500">Legislatura:</span>
                              <span className="ml-2">{legislature.number}ª Legislatura</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
                        <Card className="text-center">
                          <CardContent className="pt-6">
                            <Activity className="h-8 w-8 mx-auto mb-2" style={{color: '#48654e'}} />
                            <div className="text-2xl font-bold" style={{color: '#48654e'}}>
                              {activities.length}
                            </div>
                            <p className="text-sm text-gray-600">Atividades</p>
                          </CardContent>
                        </Card>
                        
                        <Card className="text-center">
                          <CardContent className="pt-6">
                            <FileText className="h-8 w-8 mx-auto mb-2" style={{color: '#48654e'}} />
                            <div className="text-2xl font-bold" style={{color: '#48654e'}}>
                              {documents.length}
                            </div>
                            <p className="text-sm text-gray-600">Documentos</p>
                          </CardContent>
                        </Card>
                        
                        <Card className="text-center">
                          <CardContent className="pt-6">
                            <Users className="h-8 w-8 mx-auto mb-2" style={{color: '#48654e'}} />
                            <div className="text-2xl font-bold" style={{color: '#48654e'}}>
                              {attendance.length}
                            </div>
                            <p className="text-sm text-gray-600">Presenças</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="activities" className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold" style={{color: '#48654e'}}>
                        Atividades Legislativas
                      </h3>
                      
                      {activities.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhuma atividade legislativa cadastrada para este evento.</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-96">
                          <div className="space-y-4">
                            {activities.map((activity: any) => (
                              <Card key={activity.id} className="border-l-4" style={{borderLeftColor: '#48654e'}}>
                                <CardContent className="pt-6">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline">
                                          Atividade #{activity.activityNumber}
                                        </Badge>
                                        <Badge className={
                                          activity.status === 'Aprovado' ? 'bg-green-100 text-green-800' :
                                          activity.status === 'Rejeitado' ? 'bg-red-100 text-red-800' :
                                          'bg-yellow-100 text-yellow-800'
                                        }>
                                          {activity.status}
                                        </Badge>
                                      </div>
                                      <h4 className="font-semibold mb-2">{activity.title}</h4>
                                      <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
                                      
                                      {activity.authors && activity.authors.length > 0 && (
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-sm font-medium text-gray-500">Autores:</span>
                                          <div className="flex gap-2">
                                            {activity.authors.map((author: any) => (
                                              <Badge key={author.id} variant="secondary" className="text-xs">
                                                {author.name}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      <p className="text-xs text-gray-500">
                                        Data: {format(new Date(activity.activityDate), "dd/MM/yyyy", { locale: ptBR })}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold" style={{color: '#48654e'}}>
                        Documentos do Evento
                      </h3>
                      
                      {documents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum documento disponível para este evento.</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-96">
                          <div className="space-y-4">
                            {documents.map((document: any) => (
                              <Card key={document.id}>
                                <CardContent className="pt-6">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <FileText className="h-4 w-4" style={{color: '#48654e'}} />
                                        <span className="font-semibold">{document.fileName || `Documento #${document.documentNumber}`}</span>
                                        <Badge className={
                                          document.status === 'Publicado' ? 'bg-green-100 text-green-800' :
                                          document.status === 'Rascunho' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'
                                        }>
                                          {document.status}
                                        </Badge>
                                      </div>
                                      
                                      {document.description && (
                                        <p className="text-gray-600 text-sm mb-3">{document.description}</p>
                                      )}
                                      
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>Tipo: {document.documentType}</span>
                                        {document.documentDate && (
                                          <span>
                                            Data: {format(new Date(document.documentDate), "dd/MM/yyyy", { locale: ptBR })}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      {document.filePath && (
                                        <>
                                          <Button size="sm" variant="outline">
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                          <Button size="sm" variant="outline">
                                            <Download className="h-4 w-4" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="attendance" className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold" style={{color: '#48654e'}}>
                        Lista de Presença
                      </h3>
                      
                      {attendance.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum registro de presença disponível para este evento.</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-96">
                          <div className="space-y-4">
                            {attendance.map((record: any) => (
                              <Card key={record.id}>
                                <CardContent className="pt-6">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Avatar>
                                        <AvatarImage src={record.user?.profileImageUrl} />
                                        <AvatarFallback>
                                          {record.user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      
                                      <div>
                                        <h4 className="font-semibold">{record.user?.name || 'Usuário não identificado'}</h4>
                                        <p className="text-sm text-gray-500">{record.user?.role}</p>
                                        {record.notes && (
                                          <p className="text-xs text-gray-400 mt-1">{record.notes}</p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="text-right">
                                      <Badge className={
                                        record.status === 'Presente' ? 'bg-green-100 text-green-800' :
                                        record.status === 'Ausente' ? 'bg-red-100 text-red-800' :
                                        record.status === 'Justificado' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                      }>
                                        {record.status}
                                      </Badge>
                                      {record.registeredAt && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          {format(new Date(record.registeredAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="timeline" className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold" style={{color: '#48654e'}}>
                        Linha do Tempo do Evento
                      </h3>
                      
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                        
                        <div className="space-y-6">
                          {/* Event creation */}
                          <div className="relative flex items-start">
                            <div className="absolute left-4 w-4 h-4 rounded-full" style={{backgroundColor: '#48654e'}}></div>
                            <div className="ml-12">
                              <div className="flex items-center gap-2 mb-1">
                                <ClockIcon className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">Evento Criado</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {event.createdAt && format(new Date(event.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>

                          {/* Activities timeline */}
                          {activities.map((activity: any, index: number) => (
                            <div key={activity.id} className="relative flex items-start">
                              <div className="absolute left-4 w-4 h-4 rounded-full bg-blue-500"></div>
                              <div className="ml-12">
                                <div className="flex items-center gap-2 mb-1">
                                  <Activity className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm font-medium">Atividade #{activity.activityNumber}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {activity.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{activity.title}</p>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(activity.activityDate), "dd/MM/yyyy", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                          ))}

                          {/* Documents timeline */}
                          {documents.map((document: any) => (
                            <div key={document.id} className="relative flex items-start">
                              <div className="absolute left-4 w-4 h-4 rounded-full bg-purple-500"></div>
                              <div className="ml-12">
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="h-4 w-4 text-purple-500" />
                                  <span className="text-sm font-medium">
                                    {document.fileName || `Documento #${document.documentNumber}`}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {document.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{document.documentType}</p>
                                {document.documentDate && (
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(document.documentDate), "dd/MM/yyyy", { locale: ptBR })}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Event date */}
                          <div className="relative flex items-start">
                            <div className="absolute left-4 w-4 h-4 rounded-full bg-green-500"></div>
                            <div className="ml-12">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">Data do Evento</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {formatEventDate(event.eventDate)} às {event.eventTime}
                              </p>
                              <p className="text-xs text-gray-500">{event.location}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/sessoes">
                <Button variant="outline">
                  Ver todas as sessões
                </Button>
              </Link>
              
              <Link href="/">
                <Button style={{backgroundColor: '#48654e'}} className="text-white">
                  Voltar ao início
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}