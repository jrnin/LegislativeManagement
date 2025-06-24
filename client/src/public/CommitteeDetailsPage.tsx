import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Calendar, 
  FileText, 
  ArrowLeft, 
  Clock,
  MapPin,
  Download,
  Vote
} from "lucide-react";
import { Link, useRoute } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CommitteeMember {
  userId: string;
  role: string;
  addedAt: string;
  user: User;
}

interface Committee {
  id: number;
  name: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  members: CommitteeMember[];
}

interface Event {
  id: number;
  eventNumber: number;
  eventDate: string;
  eventTime: string;
  location: string;
  category: string;
  description: string;
  status: string;
}

interface LegislativeActivity {
  id: number;
  activityNumber: number;
  activityDate: string;
  description: string;
  activityType: string;
  approvalType: string;
  fileName: string | null;
  filePath: string | null;
  fileType: string | null;
}

export default function CommitteeDetailsPage() {
  const [match, params] = useRoute("/comissoes/:id");
  const committeeId = params?.id;

  const { data: committee, isLoading: committeeLoading } = useQuery({
    queryKey: ['/api/public/committees', committeeId],
    queryFn: async () => {
      const response = await fetch(`/api/public/committees/${committeeId}`);
      if (!response.ok) {
        throw new Error('Falha ao carregar comissão');
      }
      return response.json();
    },
    enabled: !!committeeId
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/committees', committeeId, 'events'],
    queryFn: async () => {
      const response = await fetch(`/api/committees/${committeeId}/events`, {
        credentials: 'include'
      });
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!committeeId
  });

  const { data: votingActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/committees', committeeId, 'voting-activities'],
    queryFn: async () => {
      const response = await fetch(`/api/committees/${committeeId}/voting-activities`, {
        credentials: 'include'
      });
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!committeeId
  });

  if (committeeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!committee) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Comissão não encontrada
          </h1>
          <Link href="/comissoes">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar às Comissões
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const roleOrder = {
    "Presidente": 1,
    "Vice-Presidente": 2,
    "Relator": 3,
    "1º Suplente": 4,
    "2º Suplente": 5,
    "3º Suplente": 6,
    "Membro": 7
  };

  const sortedMembers = committee.members.sort((a, b) => {
    return (roleOrder[a.role as keyof typeof roleOrder] || 99) - 
           (roleOrder[b.role as keyof typeof roleOrder] || 99);
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/comissoes">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar às Comissões
            </Button>
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {committee.name}
                </h1>
                <p className="text-gray-600 text-lg mb-4 lg:mb-0">
                  {committee.description}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Badge variant="secondary" className="text-sm">
                  {committee.type}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {committee.members.length} membros
                </Badge>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Período: {format(new Date(committee.startDate), "dd/MM/yyyy", { locale: ptBR })} até {format(new Date(committee.endDate), "dd/MM/yyyy", { locale: ptBR })}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Criada em {format(new Date(committee.createdAt), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Reuniões
            </TabsTrigger>
            <TabsTrigger value="voting" className="flex items-center gap-2">
              <Vote className="h-4 w-4" />
              Votações
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Membros da Comissão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {sortedMembers.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {member.user.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {member.user.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={member.role === "Presidente" ? "default" : "outline"}>
                          {member.role}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Desde {format(new Date(member.addedAt), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Reuniões da Comissão
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse p-4 border rounded-lg">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : events && events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((event: Event) => (
                      <div key={event.id} className="p-4 border rounded-lg">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">
                                #{event.eventNumber}
                              </Badge>
                              <Badge variant={event.status === 'realizada' ? 'default' : 'secondary'}>
                                {event.status}
                              </Badge>
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1">
                              {event.description}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {format(new Date(event.eventDate), "dd/MM/yyyy", { locale: ptBR })} às {event.eventTime}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {event.location}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma reunião encontrada para esta comissão</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voting Tab */}
          <TabsContent value="voting">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="h-5 w-5" />
                  Documentos para Votação
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse p-4 border rounded-lg">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : votingActivities && votingActivities.length > 0 ? (
                  <div className="space-y-4">
                    {votingActivities.map((activity: LegislativeActivity) => (
                      <div key={activity.id} className="p-4 border rounded-lg">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">
                                #{activity.activityNumber}
                              </Badge>
                              <Badge variant="secondary">
                                {activity.activityType}
                              </Badge>
                              <Badge variant="default">
                                Votação Comissões
                              </Badge>
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1">
                              {activity.description}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(activity.activityDate), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                          </div>
                          {activity.fileName && activity.filePath && (
                            <div className="mt-4 lg:mt-0">
                              <Button variant="outline" size="sm" asChild>
                                <a 
                                  href={`/api/documents/download/${activity.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  {activity.fileName}
                                </a>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum documento para votação encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}