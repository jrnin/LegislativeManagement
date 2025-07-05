import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, Calendar, FileText, ChevronRight, Clock, MapPin, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Committee {
  id: number;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  description: string;
  members: Array<{
    userId: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

interface CommitteeEvent {
  id: number;
  eventNumber: number;
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  location: string;
  category: string;
  status: string;
  legislatureId: number;
  committees: Array<{
    id: number;
    name: string;
  }>;
}

export default function ComissoesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<CommitteeEvent | null>(null);

  const { data: committees = [], isLoading } = useQuery<Committee[]>({
    queryKey: ["/api/public/committees"],
  });

  // Buscar eventos de reunião de comissão
  const { data: committeeEvents = [], isLoading: loadingEvents } = useQuery<CommitteeEvent[]>({
    queryKey: ["/api/public/events/all", { category: "Reunião Comissão" }],
    queryFn: async () => {
      const response = await fetch("/api/public/events/all?category=Reunião Comissão");
      if (!response.ok) {
        throw new Error("Erro ao buscar eventos");
      }
      return response.json();
    }
  });

  const filteredCommittees = committees.filter((committee: Committee) => {
    const matchesSearch = committee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         committee.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || committee.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const uniqueTypes = Array.from(new Set(committees.map((c) => c.type)));

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const isCommitteeActive = (endDate: string) => {
    return new Date(endDate) > new Date();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-64">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Comissões da Câmara Municipal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conheça as comissões permanentes e temporárias da Câmara Municipal, 
            seus membros e áreas de atuação
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar comissões por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Lista de Comissões */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {filteredCommittees.map((committee: Committee) => (
            <Card key={committee.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {committee.name}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {committee.type}
                      </Badge>
                      <Badge 
                        variant={isCommitteeActive(committee.endDate) ? "default" : "outline"}
                        className="text-xs"
                      >
                        {isCommitteeActive(committee.endDate) ? "Ativa" : "Encerrada"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {committee.description}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {formatDate(committee.startDate)} - {formatDate(committee.endDate)}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{committee.members.length} membros</span>
                  </div>
                </div>

                {/* Membros */}
                {committee.members.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Membros:</h4>
                    <div className="space-y-1">
                      {committee.members.slice(0, 3).map((member) => (
                        <div key={member.userId} className="text-xs text-gray-600 flex justify-between">
                          <span>{member.user.name}</span>
                          <span className="font-medium text-blue-600">{member.role}</span>
                        </div>
                      ))}
                      {committee.members.length > 3 && (
                        <div className="text-xs text-gray-500">
                          + {committee.members.length - 3} outros membros
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reuniões de Comissão */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Reuniões de Comissão
          </h2>
          
          {loadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-48">
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : committeeEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {committeeEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                          {event.title}
                        </CardTitle>
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            Evento #{event.eventNumber}
                          </Badge>
                          <Badge 
                            variant={event.status === "Programado" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(event.eventDate), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{event.eventTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      {event.committees && event.committees.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.committees.map((committee) => (
                            <Badge key={committee.id} variant="outline" className="text-xs">
                              {committee.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-bold">
                              {event.title}
                            </DialogTitle>
                            <DialogDescription>
                              Detalhes da reunião de comissão
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700">Data</label>
                                <p className="text-sm text-gray-600">
                                  {format(new Date(event.eventDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Horário</label>
                                <p className="text-sm text-gray-600">{event.eventTime}</p>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Local</label>
                              <p className="text-sm text-gray-600">{event.location}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Status</label>
                              <p className="text-sm text-gray-600">{event.status}</p>
                            </div>
                            {event.committees && event.committees.length > 0 && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">Comissões Envolvidas</label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {event.committees.map((committee) => (
                                    <Badge key={committee.id} variant="secondary">
                                      {committee.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div>
                              <label className="text-sm font-medium text-gray-700">Descrição</label>
                              <p className="text-sm text-gray-600 mt-1">
                                {event.description || "Sem descrição disponível."}
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma reunião de comissão agendada
              </h3>
              <p className="text-gray-600">
                Não há reuniões de comissão programadas no momento.
              </p>
            </div>
          )}
        </div>

        {/* Estatísticas */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Estatísticas das Comissões
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {committees.length}
              </div>
              <div className="text-gray-600">Total de Comissões</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {committees.filter((c: Committee) => isCommitteeActive(c.endDate)).length}
              </div>
              <div className="text-gray-600">Comissões Ativas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {committees.reduce((total: number, c: Committee) => total + c.members.length, 0)}
              </div>
              <div className="text-gray-600">Total de Membros</div>
            </div>
          </div>
        </div>

        {/* Mensagem quando nenhuma comissão é encontrada */}
        {filteredCommittees.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma comissão encontrada
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros de busca para encontrar as comissões desejadas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}