import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditIcon, ArrowLeft, Users, AlertTriangle, Calendar, MapPin, Clock, ExternalLink, Eye, FileText, UserCheck, Gavel, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Committee, User } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function CommitteeDetails() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    userId: string;
    name: string;
    role: string;
  } | null>(null);
  const [newRole, setNewRole] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);

  const { data: committee, isLoading, error } = useQuery({
    queryKey: [`/api/committees/${id}`],
    enabled: !!id,
  });

  const { data: committeeEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: [`/api/committees/${id}/events`],
    enabled: !!id,
  });

  const { data: eventDetails, isLoading: isLoadingEventDetails } = useQuery({
    queryKey: [`/api/events/${selectedEvent?.id}`],
    enabled: !!selectedEvent?.id,
  });

  const { data: committeeActivities, isLoading: isLoadingActivities } = useQuery({
    queryKey: [`/api/committees/${id}/activities`],
    enabled: !!id,
  });

  const { data: committeeBills, isLoading: isLoadingBills } = useQuery({
    queryKey: [`/api/committees/${id}/activities?type=Projeto de Lei`],
    enabled: !!id,
  });



  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!committee) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-6">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-2xl font-bold mb-2">Comissão não encontrada</h2>
              <p className="text-muted-foreground mb-6">
                A comissão solicitada não foi encontrada ou pode ter sido removida.
              </p>
              <Button onClick={() => setLocation("/committees")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCommitteeActive = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    return now <= end;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const handleRoleChange = (member: any) => {
    setSelectedMember({
      userId: member.userId,
      name: member.user.name,
      role: member.role,
    });
    setNewRole(member.role);
    setRoleDialogOpen(true);
  };

  const updateMemberRole = async () => {
    if (!selectedMember || !newRole) return;

    try {
      await apiRequest("PUT", `/api/committees/${id}/members/${selectedMember.userId}`, {
        role: newRole,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/committees", id] });

      toast({
        title: "Função atualizada",
        description: `A função de ${selectedMember.name} foi atualizada para ${newRole}.`,
      });
    } catch (error) {
      console.error("Erro ao atualizar função:", error);
      toast({
        title: "Erro ao atualizar função",
        description: "Ocorreu um erro ao atualizar a função do membro na comissão.",
        variant: "destructive",
      });
    } finally {
      setRoleDialogOpen(false);
      setSelectedMember(null);
    }
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setEventDetailsOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/committees")}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <Badge
              variant={
                committee.endDate && isCommitteeActive(committee.endDate.toString())
                  ? "default"
                  : "outline"
              }
            >
              {committee.endDate && isCommitteeActive(committee.endDate.toString())
                ? "Vigente"
                : "Encerrada"}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{committee.name}</h1>
          <p className="text-muted-foreground">
            {committee.type} • Período: {committee.startDate ? formatDate(committee.startDate.toString()) : 'Data não informada'} a{" "}
            {committee.endDate ? formatDate(committee.endDate.toString()) : 'Data não informada'}
          </p>
        </div>
        {user?.role === "admin" && (
          <Button
            variant="outline"
            onClick={() => setLocation(`/committees/edit/${id}`)}
          >
            <EditIcon className="h-4 w-4 mr-2" />
            Editar Comissão
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{committee.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Tipo de Comissão
                </dt>
                <dd>{committee.type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Data de Início
                </dt>
                <dd>{committee.startDate ? formatDate(committee.startDate.toString()) : 'Data não informada'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Data de Término
                </dt>
                <dd>{committee.endDate ? formatDate(committee.endDate.toString()) : 'Data não informada'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Status
                </dt>
                <dd>
                  {committee.endDate && isCommitteeActive(committee.endDate.toString())
                    ? "Vigente"
                    : "Encerrada"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Quantidade de Membros
                </dt>
                <dd>{committee.members?.length || 0} membros</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">Membros da Comissão</TabsTrigger>
          <TabsTrigger value="events">Reuniões</TabsTrigger>
          <TabsTrigger value="bills">Projetos de Lei</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="mt-6">
          <Card>
        <CardHeader>
          <CardTitle>Membros da Comissão</CardTitle>
        </CardHeader>
        <CardContent>
          {!committee.members || committee.members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">
                Nenhum membro na comissão
              </h3>
              <p className="text-sm text-muted-foreground">
                Esta comissão não possui membros designados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função na Comissão</TableHead>
                    {user?.role === "admin" && <TableHead>Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {committee.members.map((member: any) => (
                    <TableRow key={member.userId}>
                      <TableCell className="font-medium">
                        {member.user.name}
                      </TableCell>
                      <TableCell>{member.user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.role === "Presidente"
                              ? "default"
                              : member.role === "Vice-Presidente"
                              ? "secondary"
                              : member.role === "Relator"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {member.role}
                        </Badge>
                      </TableCell>
                      {user?.role === "admin" && (
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(member)}
                          >
                            Alterar Função
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
        
        <TabsContent value="events" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Reuniões da Comissão</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingEvents ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Carregando reuniões...</p>
                </div>
              ) : !committeeEvents || committeeEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-semibold">
                    Nenhuma reunião encontrada
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Esta comissão ainda não possui reuniões agendadas.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {committeeEvents.map((event: any) => (
                    <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleEventClick(event)}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            Reunião {event.eventNumber}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(event.eventDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {event.eventTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            event.status === "Concluido"
                              ? "secondary"
                              : event.status === "Andamento"
                              ? "default"
                              : event.status === "Cancelado"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {event.status}
                        </Badge>
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </Button>
                        {event.videoUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a href={event.videoUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Assistir
                            </a>
                          </Button>
                        )}
                        {event.mapUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a href={event.mapUrl} target="_blank" rel="noopener noreferrer">
                              <MapPin className="h-4 w-4 mr-1" />
                              Localização
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bills" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Projetos de Lei</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBills ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Carregando projetos de lei...</p>
                </div>
              ) : !committeeBills || committeeBills.length === 0 ? (
                <div className="text-center py-8">
                  <Gavel className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-semibold">
                    Nenhum projeto de lei encontrado
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Esta comissão ainda não possui projetos de lei associados.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {committeeBills.map((bill: any) => (
                    <div key={bill.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            Projeto de Lei #{bill.activityNumber}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(bill.activityDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge
                            variant={
                              bill.approved === true
                                ? "default"
                                : bill.approved === false
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {bill.approved === true
                              ? "Aprovado"
                              : bill.approved === false
                              ? "Rejeitado"
                              : "Em Tramitação"}
                          </Badge>
                          {bill.approvalType && (
                            <Badge variant="outline" className="text-xs">
                              {bill.approvalType === "committees" ? "Comissões" : "Vereadores"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {bill.description}
                      </p>
                      
                      {bill.authors && bill.authors.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-1">Autores:</p>
                          <div className="flex flex-wrap gap-1">
                            {bill.authors.map((author: any) => (
                              <Badge key={author.userId} variant="outline" className="text-xs">
                                {author.user.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {bill.filePath && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={`/api/activities/${bill.id}/download`} target="_blank">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/activities/${bill.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </Button>
                      </div>
                      
                      {bill.approvalComment && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                          <p className="font-medium">Comentário da aprovação:</p>
                          <p className="text-gray-600">{bill.approvalComment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Função do Membro</DialogTitle>
            <DialogDescription>
              Selecione a nova função para {selectedMember?.name} na comissão.
            </DialogDescription>
          </DialogHeader>
          <Select
            value={newRole}
            onValueChange={setNewRole}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Presidente">Presidente</SelectItem>
              <SelectItem value="Vice-Presidente">Vice-Presidente</SelectItem>
              <SelectItem value="Relator">Relator</SelectItem>
              <SelectItem value="1º Suplente">1º Suplente</SelectItem>
              <SelectItem value="2º Suplente">2º Suplente</SelectItem>
              <SelectItem value="3º Suplente">3º Suplente</SelectItem>
              <SelectItem value="Membro">Membro</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={updateMemberRole}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={eventDetailsOpen} onOpenChange={setEventDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent && `Reunião ${selectedEvent.eventNumber} - ${committee.name}`}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent && format(new Date(selectedEvent.eventDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {selectedEvent?.eventTime}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingEventDetails ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando detalhes do evento...</p>
            </div>
          ) : eventDetails ? (
            <div className="space-y-6">
              {/* Event Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Informações do Evento</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(selectedEvent.eventDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEvent.eventTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEvent.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          selectedEvent.status === "Concluido"
                            ? "secondary"
                            : selectedEvent.status === "Andamento"
                            ? "default"
                            : selectedEvent.status === "Cancelado"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {selectedEvent.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Descrição</h3>
                  <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                </div>
              </div>

              {/* Activities */}
              {eventDetails.activities && eventDetails.activities.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Atividades da Reunião ({eventDetails.activities.length})
                  </h3>
                  <div className="space-y-3">
                    {eventDetails.activities.map((activity: any) => (
                      <div key={activity.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{activity.activityType} #{activity.activityNumber}</h4>
                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                          </div>
                          <Badge variant="outline">
                            {activity.approved ? "Aprovado" : "Pendente"}
                          </Badge>
                        </div>
                        {activity.authors && activity.authors.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Autores: {activity.authors.map((author: any) => author.user.name).join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {eventDetails.documents && eventDetails.documents.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documentos ({eventDetails.documents.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {eventDetails.documents.map((document: any) => (
                      <div key={document.id} className="border rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-blue-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{document.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">{document.description}</p>
                            {document.filePath && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                asChild
                              >
                                <a href={`/api/documents/${document.id}/download`} target="_blank">
                                  Download
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendance */}
              {eventDetails.attendance && eventDetails.attendance.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Presença ({eventDetails.attendance.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {eventDetails.attendance.map((attendance: any) => (
                      <div key={attendance.userId} className="flex items-center gap-3 p-2 border rounded">
                        <div className="flex-1">
                          <span className="font-medium">{attendance.user.name}</span>
                        </div>
                        <Badge
                          variant={
                            attendance.status === "Presente"
                              ? "default"
                              : attendance.status === "Ausente"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {attendance.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Não foi possível carregar os detalhes do evento.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}