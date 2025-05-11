import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Calendar, MapPin, User, FileText, Clock, Check, X, MessageSquare, Download, UserCheck, RefreshCw } from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const VoteOption = ({ value, label, selected, onClick }: 
  { value: string, label: string, selected: boolean, onClick: () => void }) => {
  
  const colorMap = {
    'Favorável': 'bg-green-100 border-green-500 text-green-700',
    'Contrário': 'bg-red-100 border-red-500 text-red-700',
    'Abstenção': 'bg-yellow-100 border-yellow-500 text-yellow-700',
  };
  
  const color = colorMap[value as keyof typeof colorMap] || 'bg-gray-100 border-gray-500 text-gray-700';
  
  return (
    <button
      type="button"
      className={`border-2 rounded-md p-3 flex items-center justify-center gap-2 min-w-[120px] transition-all ${color} ${selected ? 'ring-2 ring-offset-2' : ''}`}
      onClick={onClick}
    >
      {selected && <Check size={16} />}
      {label}
    </button>
  );
};

export default function EventDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const eventId = Number(id);
  
  const [voteValue, setVoteValue] = useState<string>("");
  const [voteComment, setVoteComment] = useState<string>("");
  const [attendanceStatus, setAttendanceStatus] = useState<string>("Presente");
  const [attendanceNotes, setAttendanceNotes] = useState<string>("");
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState<boolean>(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState<boolean>(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>(null);
  const [councilors, setCouncilors] = useState<any[]>([]);
  const [isManagingAttendance, setIsManagingAttendance] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loadingCouncilors, setLoadingCouncilors] = useState<boolean>(false);
  
  // Fetch event details
  const { data: eventDetails, isLoading, isError } = useQuery({
    queryKey: ["/api/events", eventId, "details"],
    queryFn: async () => {
      return await apiRequest<any>(`/api/events/${eventId}/details`);
    },
    enabled: !!eventId
  });
  
  // Fetch user votes
  const { data: userVotes, refetch: refetchUserVotes } = useQuery({
    queryKey: ["/api/documents", "votes", "user"],
    queryFn: async () => {
      if (!eventDetails) return [];
      
      const activities = eventDetails.activities || [];
      const documentIds = activities
        .flatMap((activity: any) => activity.relatedDocuments || [])
        .filter((docId: number) => !!docId);
        
      if (!documentIds?.length) return [];
      
      const promises = documentIds.map((docId: number) => 
        apiRequest<any>(`/api/documents/${docId}/my-vote`)
          .catch(() => null)
      );
      
      const results = await Promise.all(promises);
      return results.filter(Boolean);
    },
    enabled: !!eventDetails && isAuthenticated
  });
  
  // Fetch councilors when managing attendance
  useEffect(() => {
    const fetchCouncilors = async () => {
      if (isAuthenticated && isManagingAttendance) {
        try {
          setLoadingCouncilors(true);
          const response = await apiRequest<any[]>('/api/councilors');
          setCouncilors(response || []);
        } catch (error) {
          console.error('Error fetching councilors:', error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar a lista de vereadores",
            variant: "destructive"
          });
        } finally {
          setLoadingCouncilors(false);
        }
      }
    };

    fetchCouncilors();
  }, [isAuthenticated, isManagingAttendance, toast]);

  // Check if user already registered attendance
  const { data: userAttendance, refetch: refetchUserAttendance } = useQuery({
    queryKey: ["/api/events", eventId, "attendance", "user"],
    queryFn: async () => {
      const attendanceList = await apiRequest<any[]>(`/api/events/${eventId}/attendance`);
      return (attendanceList || []).find((a: any) => a.userId === user?.id);
    },
    enabled: !!eventId && isAuthenticated
  });
  
  const handleVoteSubmit = async () => {
    if (!currentDocumentId || !voteValue) return;
    
    try {
      await apiRequest(
        "POST",
        `/api/documents/${currentDocumentId}/vote`, 
        {
          vote: voteValue,
          comment: voteComment
        }
      );
      
      toast({
        title: "Voto registrado",
        description: "Seu voto foi registrado com sucesso."
      });
      
      refetchUserVotes();
      setIsVoteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar voto. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  const handleCouncilorAttendance = async (userId: string, status: string) => {
    if (!isAuthenticated || !eventId) return;
    
    try {
      await apiRequest(
        `/api/events/${eventId}/attendance`,
        "POST",
        {
          userId,
          status,
          notes: `Presença registrada por ${user?.name}`,
          registeredBy: user?.id
        }
      );
      
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "attendance"] });
      
      toast({
        title: "Presença registrada",
        description: `Presença do vereador foi registrada como ${status}.`
      });
    } catch (error) {
      console.error('Error registering attendance:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a presença do vereador.",
        variant: "destructive"
      });
    }
  };

  const handleAttendanceSubmit = async () => {
    if (!eventId) return;
    
    try {
      await apiRequest(
        "POST",
        `/api/events/${eventId}/attendance`,
        {
          status: attendanceStatus,
          notes: attendanceNotes
        }
      );
      
      toast({
        title: "Presença registrada",
        description: "Sua presença foi registrada com sucesso."
      });
      
      refetchUserAttendance();
      setIsAttendanceDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar presença. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  const openVoteDialog = (documentId: number) => {
    setCurrentDocumentId(documentId);
    
    // Check if user already voted
    const existingVote = userVotes?.find((v: any) => v.documentId === documentId);
    if (existingVote) {
      setVoteValue(existingVote.vote);
      setVoteComment(existingVote.comment || "");
    } else {
      setVoteValue("");
      setVoteComment("");
    }
    
    setIsVoteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (isError || !eventDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h2 className="text-2xl font-bold">Evento não encontrado</h2>
        <p className="text-muted-foreground">O evento solicitado não existe ou foi removido.</p>
        <Button onClick={() => navigate("/events")}>Voltar para Eventos</Button>
      </div>
    );
  }
  
  const { event, legislature, activities, attendance } = {
    event: eventDetails,
    legislature: eventDetails.legislature,
    activities: eventDetails.activities || [],
    attendance: eventDetails.attendance || []
  };
  
  const eventDate = new Date(event.eventDate);
  const formattedDate = format(eventDate, "PPP", { locale: ptBR });
  const formattedTime = event.eventTime;
  
  const mapUrl = event.mapUrl || 
    `https://maps.google.com/?q=${encodeURIComponent(event.location)}`;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aberto": return "bg-green-100 text-green-800";
      case "Cancelado": return "bg-red-100 text-red-800";
      case "Concluido": return "bg-blue-100 text-blue-800";
      case "Adiado": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  const getUserVoteForDocument = (documentId: number) => {
    return userVotes?.find((v: any) => v.documentId === documentId);
  };
  
  return (
    <div className="container px-4 sm:px-6 lg:px-8 mx-auto py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Evento #{event.eventNumber}
          </h1>
          <p className="text-xl text-muted-foreground">
            {event.description}
          </p>
        </div>
        <Badge className={`text-sm px-3 py-1 ${getStatusColor(event.status)}`}>
          {event.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detalhes do Evento</CardTitle>
            <CardDescription>
              Informações sobre o evento na {legislature.number}ª Legislatura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{formattedDate}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Horário</p>
                  <p className="font-medium">{formattedTime}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 sm:col-span-2">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Local</p>
                  <p className="font-medium">{event.location}</p>
                  {mapUrl && (
                    <a 
                      href={mapUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Ver no mapa
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="mb-2 text-lg font-medium">Sobre</h3>
              <p className="text-muted-foreground">
                {event.description}
              </p>
            </div>
            
            {!userAttendance && isAuthenticated && event.status === "Aberto" && (
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={() => setIsAttendanceDialogOpen(true)}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  Registrar Presença
                </Button>
              </div>
            )}
            
            {userAttendance && (
              <div className="flex items-center p-4 border rounded-md bg-green-50 border-green-200">
                <Check className="w-5 h-5 mr-2 text-green-600" />
                <span>Você registrou presença como <strong>{userAttendance.status}</strong></span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Informações da Legislatura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm text-muted-foreground">Número</h3>
                <p className="font-medium">{legislature.number}ª Legislatura</p>
              </div>
              
              <div>
                <h3 className="text-sm text-muted-foreground">Período</h3>
                <p className="font-medium">
                  {format(new Date(legislature.startDate), "dd/MM/yyyy")} a {format(new Date(legislature.endDate), "dd/MM/yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="activities" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activities">Atividades</TabsTrigger>
          <TabsTrigger value="attendance">Lista de Presença</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activities" className="pt-4">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="w-12 h-12 mb-4 text-muted-foreground" />
              <h3 className="text-xl font-medium">Nenhuma atividade registrada</h3>
              <p className="text-muted-foreground">Este evento ainda não possui atividades legislativas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Atividades Legislativas</h2>
              <Accordion type="single" collapsible className="w-full">
                {activities.map((activity: any) => (
                  <AccordionItem key={activity.id} value={`item-${activity.id}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-col items-start text-left gap-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-normal">
                            #{activity.activityNumber}
                          </Badge>
                          <span>{activity.type}</span>
                        </div>
                        <h3 className="text-base font-medium">
                          {activity.description}
                        </h3>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Data</p>
                          <p className="font-medium">
                            {format(new Date(activity.activityDate), "PPP", { locale: ptBR })}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="font-medium">{activity.status}</p>
                        </div>
                        
                        <div className="sm:col-span-2">
                          <p className="text-sm text-muted-foreground">Descrição</p>
                          <p>{activity.description}</p>
                        </div>
                        
                        {activity.authors?.length > 0 && (
                          <div className="sm:col-span-2">
                            <p className="text-sm text-muted-foreground mb-2">Autores</p>
                            <div className="flex flex-wrap gap-2">
                              {activity.authors.map((author: any) => (
                                <div key={author.id} className="flex items-center gap-2 p-2 border rounded-md">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={author.profileImageUrl || ""} alt={author.name} />
                                    <AvatarFallback>{author.name.substring(0, 2)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{author.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Seção para visualização do arquivo */}
                        {(activity.filePath || activity.fileName) && (
                          <div className="sm:col-span-2 mt-4">
                            <p className="text-sm text-muted-foreground mb-2">Arquivo</p>
                            <div className="flex items-center gap-2 p-3 border rounded-md bg-slate-50">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <span className="text-sm font-medium flex-1 truncate">
                                {activity.fileName || "Documento da atividade"}
                              </span>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="ml-auto" 
                                onClick={() => window.open(`/api/files/activities/${activity.id}`, '_blank')}
                              >
                                Visualizar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => window.open(`/api/files/activities/${activity.id}?download=true`, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => navigate(`/legislative-activities/${activity.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="attendance" className="pt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Lista de Presença</h2>
              {isAuthenticated && event.status === "Aberto" && !userAttendance && (
                <Button 
                  onClick={() => setIsAttendanceDialogOpen(true)}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  Registrar Presença
                </Button>
              )}
            </div>
            
            {attendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <User className="w-12 h-12 mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium">Nenhuma presença registrada</h3>
                <p className="text-muted-foreground">Este evento ainda não possui registros de presença.</p>
              </div>
            ) : (
              <Table>
                <TableCaption>Lista de presença do evento</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participante</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registrado em</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={record.user?.profileImageUrl || ""} alt={record.user?.name} />
                          <AvatarFallback>{record.user?.name?.substring(0, 2) || "?"}</AvatarFallback>
                        </Avatar>
                        <span>{record.user?.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={
                            record.status === "Presente" 
                              ? "bg-green-100 text-green-800 hover:bg-green-100" 
                              : record.status === "Ausente" 
                                ? "bg-red-100 text-red-800 hover:bg-red-100"
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.registeredAt 
                          ? format(new Date(record.registeredAt), "PPp", { locale: ptBR })
                          : "-"}
                      </TableCell>
                      <TableCell>{record.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="documents" className="pt-4">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Documentos</h2>
            
            {activities.length === 0 || !activities.some((a: any) => a.relatedDocuments?.length > 0) ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="w-12 h-12 mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium">Nenhum documento registrado</h3>
                <p className="text-muted-foreground">Este evento ainda não possui documentos associados.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {activities
                  .filter((activity: any) => activity.relatedDocuments?.length > 0)
                  .map((activity: any) => (
                    <Card key={activity.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Documentos da Atividade #{activity.activityNumber}
                        </CardTitle>
                        <CardDescription>
                          {activity.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Seu Voto</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activity.relatedDocuments.map((documentId: number) => {
                              const document = activity.documents?.find((d: any) => d.id === documentId);
                              const userVote = getUserVoteForDocument(documentId);
                              
                              if (!document) return null;
                              
                              return (
                                <TableRow key={document.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{document.description}</p>
                                      <p className="text-sm text-muted-foreground">
                                        #{document.documentNumber}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {document.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {userVote ? (
                                      <Badge 
                                        variant="outline" 
                                        className={
                                          userVote.vote === "Favorável"
                                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                                            : userVote.vote === "Contrário"
                                              ? "bg-red-100 text-red-800 hover:bg-red-100"
                                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                        }
                                      >
                                        {userVote.vote}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">Não votou</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => navigate(`/documents/${document.id}`)}
                                      >
                                        Ver Documento
                                      </Button>
                                      {isAuthenticated && (
                                        <Button 
                                          size="sm" 
                                          onClick={() => openVoteDialog(document.id)}
                                        >
                                          {userVote ? "Editar Voto" : "Votar"}
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Dialog for voting */}
      <Dialog open={isVoteDialogOpen} onOpenChange={setIsVoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Voto</DialogTitle>
            <DialogDescription>
              Escolha uma opção para registrar seu voto e adicione um comentário se desejar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex gap-2 justify-center flex-wrap">
              <VoteOption 
                value="Favorável" 
                label="Favorável" 
                selected={voteValue === "Favorável"}
                onClick={() => setVoteValue("Favorável")}
              />
              <VoteOption 
                value="Contrário" 
                label="Contrário" 
                selected={voteValue === "Contrário"}
                onClick={() => setVoteValue("Contrário")}
              />
              <VoteOption 
                value="Abstenção" 
                label="Abstenção" 
                selected={voteValue === "Abstenção"}
                onClick={() => setVoteValue("Abstenção")}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="comment" className="text-sm font-medium">
                Comentário (opcional)
              </label>
              <Textarea
                id="comment"
                placeholder="Adicione um comentário ao seu voto..."
                value={voteComment}
                onChange={(e) => setVoteComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsVoteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              onClick={handleVoteSubmit}
              disabled={!voteValue}
            >
              Confirmar Voto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for attendance */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Presença</DialogTitle>
            <DialogDescription>
              Registre sua presença no evento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status de Presença
              </label>
              <Select 
                value={attendanceStatus} 
                onValueChange={setAttendanceStatus}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Presente">Presente</SelectItem>
                  <SelectItem value="Justificado">Justificado</SelectItem>
                  <SelectItem value="Ausente">Ausente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Observações (opcional)
              </label>
              <Textarea
                id="notes"
                placeholder="Adicione observações sobre sua presença..."
                value={attendanceNotes}
                onChange={(e) => setAttendanceNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsAttendanceDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              onClick={handleAttendanceSubmit}
            >
              Confirmar Presença
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}