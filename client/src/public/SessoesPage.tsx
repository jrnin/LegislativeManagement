import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateSimpleSafe } from "@/lib/dateUtils";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Filter,
  Download,
  FileText,
  Search,
  ChevronDown,
  Eye,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Link } from 'wouter';

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  status: string;
  description: string;
  eventNumber: number;
  legislatureId?: number;
  mapUrl?: string;
  eventDate: string;
  eventTime: string;
  category: string;
}

interface EventDocument {
  id: number;
  fileName: string;
  filePath: string;
  documentType: string;
  eventId: number;
}

export default function SessoesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLegislature, setSelectedLegislature] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Fetch all events
  const { data: allEvents = [], isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ['/api/public/events/all'],
    queryFn: async () => {
      const response = await fetch('/api/public/events/all');
      if (!response.ok) {
        throw new Error('Erro ao carregar eventos');
      }
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch legislatures for filter
  const { data: legislatures = [] } = useQuery({
    queryKey: ['/api/public/legislatures'],
    queryFn: async () => {
      const response = await fetch('/api/public/legislatures');
      if (!response.ok) {
        throw new Error('Erro ao carregar legislaturas');
      }
      return response.json();
    }
  });

  // Filter events based on search criteria
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event: Event) => {
      const matchesSearch = searchTerm === '' || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedType === '' || selectedType === 'all' || event.category === selectedType;
      const matchesStatus = selectedStatus === '' || selectedStatus === 'all' || event.status === selectedStatus;
      const matchesLegislature = selectedLegislature === '' || selectedLegislature === 'all' || 
        event.legislatureId?.toString() === selectedLegislature;

      const eventDate = new Date(event.eventDate);
      const matchesStartDate = startDate === '' || eventDate >= new Date(startDate);
      const matchesEndDate = endDate === '' || eventDate <= new Date(endDate);

      return matchesSearch && matchesType && matchesStatus && 
             matchesLegislature && matchesStartDate && matchesEndDate;
    });
  }, [allEvents, searchTerm, selectedType, selectedStatus, selectedLegislature, startDate, endDate]);

  // Pagination logic
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedStatus, selectedLegislature, startDate, endDate]);

  // Get unique event types for filter
  const eventTypes = useMemo(() => {
    const types = [...new Set(allEvents.map((event: Event) => event.category))];
    return types.filter(Boolean);
  }, [allEvents]);

  // Get unique statuses for filter
  const eventStatuses = useMemo(() => {
    const statuses = [...new Set(allEvents.map((event: Event) => event.status))];
    return statuses.filter(Boolean);
  }, [allEvents]);

  const formatEventDate = (dateString: string) => {
    try {
      // Parse the date string and handle timezone correctly
      const date = new Date(dateString + 'T12:00:00'); // Add time to avoid UTC conversion issues
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'aberto':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'andamento':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'concluido':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'sessão ordinária':
      case 'sessao ordinaria':
        return 'bg-blue-50 text-blue-700 border-blue-300 relative';
      case 'sessão extraordinária':
      case 'sessao extraordinaria':
        return 'bg-orange-50 text-orange-700 border-orange-300 relative';
      case 'reunião comissão':
      case 'reuniao comissao':
        return 'bg-purple-50 text-purple-700 border-purple-300 relative';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-300 relative';
    }
  };

  const getEventTypeDot = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'sessão ordinária':
      case 'sessao ordinaria':
        return 'bg-blue-500';
      case 'sessão extraordinária':
      case 'sessao extraordinaria':
        return 'bg-orange-500';
      case 'reunião comissão':
      case 'reuniao comissao':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedLegislature('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const downloadEventDocuments = async (eventId: number) => {
    try {
      const response = await fetch(`/api/public/events/${eventId}/documents`);
      if (response.ok) {
        const documents = await response.json();
        
        if (documents.length === 0) {
          alert('Nenhum documento disponível para este evento.');
          return;
        }

        // Download each document
        for (const doc of documents) {
          const downloadResponse = await fetch(`/api/public/documents/download/${doc.id}`);
          if (downloadResponse.ok) {
            const blob = await downloadResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = doc.fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        }
      } else {
        alert('Erro ao baixar documentos do evento.');
      }
    } catch (error) {
      console.error('Erro ao baixar documentos:', error);
      alert('Erro ao baixar documentos do evento.');
    }
  };

  // Debug logging
  console.log('SessoesPage render:', { 
    eventsLoading, 
    eventsError, 
    allEventsCount: allEvents.length,
    filteredEventsCount: filteredEvents.length
  });

  if (eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{color: '#48654e'}} />
          <p className="text-gray-600">Carregando sessões...</p>
        </div>
      </div>
    );
  }

  if (eventsError) {
    console.error('Events error:', eventsError);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar sessões</h1>
          <p className="text-gray-600">Não foi possível carregar as sessões. Tente novamente mais tarde.</p>
          <p className="text-xs text-gray-500 mt-2">Erro: {eventsError.message}</p>
        </div>
      </div>
    );
  }

  if (!allEvents || allEvents.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Nenhuma sessão encontrada</h1>
          <p className="text-gray-600">Não há sessões cadastradas no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sessões - Portal Público</title>
        <meta name="description" content="Consulte todas as sessões da Câmara Municipal com filtros por data, tipo e status." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4" style={{color: '#48654e'}}>
                Sessões da Câmara Municipal
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Acompanhe todas as sessões e eventos legislativos com informações atualizadas em tempo real
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{color: '#48654e'}}>
                <Filter className="h-5 w-5" />
                Filtros de Busca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="search">Buscar por nome ou descrição</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Digite para buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="type">Tipo de Evento</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {eventTypes.filter(type => type && type.trim()).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      {eventStatuses.filter(status => status && status.trim()).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="legislature">Legislatura</Label>
                  <Select value={selectedLegislature} onValueChange={setSelectedLegislature}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as legislaturas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as legislaturas</SelectItem>
                      {legislatures.map((leg: any) => (
                        <SelectItem key={leg.id} value={leg.id.toString()}>
                          Legislatura {leg.number} ({leg.startDate?.slice(0, 4)} - {leg.endDate?.slice(0, 4)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="startDate">Data de início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Data de fim</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {filteredEvents.length} sessão(ões) encontrada(s)
                  {filteredEvents.length > 0 && (
                    <span className="ml-2 text-gray-500">
                      • Página {currentPage} de {totalPages}
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={clearFilters} size="sm">
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <div className="space-y-6">
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nenhuma sessão encontrada
                  </h3>
                  <p className="text-gray-500">
                    {allEvents.length === 0 
                      ? 'Ainda não há sessões cadastradas no sistema.'
                      : 'Ajuste os filtros para encontrar as sessões desejadas.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              currentEvents.map((event: Event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className={getEventTypeColor(event.category)}>
                            <div className={`w-2 h-2 rounded-full mr-2 ${getEventTypeDot(event.category)}`}></div>
                            {event.category}
                          </Badge>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl mb-2" style={{color: '#48654e'}}>
                          {event.title}
                        </CardTitle>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        Sessão #{event.eventNumber}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full" style={{backgroundColor: '#f0f4f0'}}>
                          <Calendar className="h-4 w-4" style={{color: '#48654e'}} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Data</p>
                          <p className="font-medium">{formatDateSimpleSafe(event.eventDate)}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full" style={{backgroundColor: '#f0f4f0'}}>
                          <Clock className="h-4 w-4" style={{color: '#48654e'}} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Horário</p>
                          <p className="font-medium">{event.time}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full" style={{backgroundColor: '#f0f4f0'}}>
                          <MapPin className="h-4 w-4" style={{color: '#48654e'}} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Local</p>
                          <p className="font-medium">{event.location}</p>
                        </div>
                      </div>
                    </div>

                    {event.description && (
                      <>
                        <Separator className="my-4" />
                        <div className="mb-4">
                          <p className="text-gray-700 line-clamp-3">
                            {event.description}
                          </p>
                        </div>
                      </>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Link href={`/eventos/${event.id}`}>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </Link>
                      
                      <Button 
                        variant="outline"
                        onClick={() => downloadEventDocuments(event.id)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Baixar Documentos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {filteredEvents.length > itemsPerPage && (
            <Card className="mt-6">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPrevious}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page;
                      
                      if (totalPages <= 5) {
                        // Show all pages if we have 5 or fewer
                        page = i + 1;
                      } else {
                        // Calculate visible page range
                        const half = Math.floor(5 / 2);
                        let start = Math.max(1, currentPage - half);
                        let end = Math.min(totalPages, start + 4);
                        
                        // Adjust start if we're too close to the end
                        if (end - start < 4) {
                          start = Math.max(1, end - 4);
                        }
                        
                        page = start + i;
                      }
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNext}
                      disabled={currentPage === totalPages}
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-center mt-3">
                  <p className="text-sm text-gray-600">
                    Exibindo {startIndex + 1}-{Math.min(endIndex, filteredEvents.length)} de {filteredEvents.length} sessões
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}