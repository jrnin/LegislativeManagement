import React from 'react';
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
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function EventDetailsPage() {
  const { id } = useParams();
  
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['/api/public/events', id],
    queryFn: async () => {
      const response = await fetch(`/api/public/events/${id}`);
      if (!response.ok) {
        throw new Error('Evento não encontrado');
      }
      return response.json();
    },
    enabled: !!id
  });

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
          <div className="max-w-4xl mx-auto">
            {/* Event Header */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-3" style={{borderColor: '#7FA653', color: '#63783D'}}>
                      {event.type}
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
                      <p className="font-semibold">{event.time}</p>
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
                  <div>
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

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle style={{color: '#48654e'}}>Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Número do Evento:</span>
                    <span className="ml-2">#{event.eventNumber}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Categoria:</span>
                    <span className="ml-2">{event.category}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-500 mb-4">
                    Para mais informações, entre em contato com a Câmara Municipal.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/public/eventos">
                      <Button variant="outline">
                        Ver todos os eventos
                      </Button>
                    </Link>
                    
                    <Link href="/">
                      <Button style={{backgroundColor: '#48654e'}} className="text-white">
                        Voltar ao início
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}