import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Calendar, MapPin, User, FileText, Clock, Check, X, MessageSquare, Download, UserCheck, RefreshCw, Vote, ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react";

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
  const [isManagingAttendance, setIsManagingAttendance] = useState<boolean>(false);
  const [councilors, setCouncilors] = useState<any[]>([]);
  const [loadingCouncilors, setLoadingCouncilors] = useState<boolean>(false);
  const [attendanceNotes, setAttendanceNotes] = useState<string>("");
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState<boolean>(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState<boolean>(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Fetch event details
  const { data: eventDetails, isLoading, isError } = useQuery({
    queryKey: [`/api/events/${eventId}/details`],
    queryFn: async () => {
      console.log(`Fetching event details for ID: ${eventId}`);
      return await apiRequest<any>(`/api/events/${eventId}/details`);
    },
    enabled: !!eventId
  });
  
  // Fetch user votes
  const { data: userVotes, refetch: refetchUserVotes } = useQuery({
    queryKey: [`/api/events/${eventId}/document-votes`],
    queryFn: async () => {
      if (!eventDetails) return [];
      
      // Get document IDs from event directly
      const documents = eventDetails.documents || [];
      const documentIds = documents.map((doc: any) => doc.id).filter((id: number) => !!id);
      
      console.log(`Found ${documentIds.length} documents for voting in event ${eventId}`);
      
      if (!documentIds?.length) return [];
      
      const promises = documentIds.map((docId: number) => 
        apiRequest<any>(`/api/documents/${docId}/my-vote`)
          .catch((err) => {
            console.error(`Error fetching vote for document ${docId}:`, err);
            return null;
          })
      );
      
      const results = await Promise.all(promises);
      return results.filter(Boolean);
    },
    enabled: !!eventDetails && isAuthenticated
  });
  
  // Fetch activities that require approval
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState<boolean>(false);
  const [approvalComment, setApprovalComment] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const filePreviewRef = useRef<HTMLIFrameElement>(null);
  
  // Mutation for approving activity
  const approveActivityMutation = useMutation({
    mutationFn: async ({ activityId, approved, comment }: { activityId: number, approved: boolean, comment?: string }) => {
      return await apiRequest(
        "POST",
        `/api/activities/${activityId}/approve`,
        { approved, comment }
      );
    },
    onSuccess: () => {
      // Invalidate the activities query to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/details`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/approval-activities`] });
      setIsApprovalDialogOpen(false);
      toast({
        title: "Atividade atualizada",
        description: "O status de aprovação da atividade foi atualizado com sucesso."
      });
    },
    onError: (error) => {
      console.error("Error approving activity:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o status de aprovação da atividade.",
        variant: "destructive"
      });
    }
  });
  
  const { data: activitiesRequiringApproval, isLoading: loadingApprovalActivities } = useQuery({
    queryKey: [`/api/events/${eventId}/approval-activities`],
    queryFn: async () => {
      if (!eventDetails) return [];
      
      // Get activities that require approval
      const activities = eventDetails.activities || [];
      console.log("Activities in event:", activities);
      
      // Use correct property names from the database
      return activities.filter((activity: any) => {
        console.log("Activity:", activity);
        return activity.needsApproval === true && activity.approved === null;
      });
    },
    enabled: !!eventId && !!eventDetails
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
        "POST",
        `/api/events/${eventId}/attendance`,
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
    if (!eventId || !user?.id) return;
    
    try {
      console.log("Tentando registrar presença para usuário:", user.id);
      
      await apiRequest(
        "POST",
        `/api/events/${eventId}/attendance`,
        {
          userId: user.id, // Enviar explicitamente o ID do usuário
          status: attendanceStatus,
          notes: attendanceNotes,
        }
      );
      
      toast({
        title: "Presença registrada",
        description: "Sua presença foi registrada com sucesso."
      });
      
      refetchUserAttendance();
      setIsAttendanceDialogOpen(false);
    } catch (error) {
      console.error("Erro ao registrar presença:", error);
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activities">Atividades</TabsTrigger>
          <TabsTrigger value="attendance">Lista de Presença</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="approvals">Votações</TabsTrigger>
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
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(activity.activityDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-4">
                        <p>{activity.description}</p>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Autores:</h4>
                          <div className="flex flex-wrap gap-2">
                            {activity.authors?.map((author: any) => (
                              <div key={author.id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={author.profileImageUrl || ""} />
                                  <AvatarFallback>{author.name?.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{author.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {activity.filePath && (
                          <div className="mt-4">
                            <Button 
                              variant="outline" 
                              className="gap-2"
                              onClick={() => window.open(`/api/files/activities/${activity.id}`, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                              Baixar Anexo
                            </Button>
                          </div>
                        )}
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
              {isAuthenticated && user?.role === "admin" && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsManagingAttendance(!isManagingAttendance)}
                  className="gap-2"
                >
                  {isManagingAttendance ? (
                    <>
                      <X className="w-4 h-4" />
                      Cancelar
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Gerenciar Presenças
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {isManagingAttendance && isAuthenticated && user?.role === "admin" && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Registrar Presenças</CardTitle>
                  <CardDescription>Registre a presença dos vereadores neste evento</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCouncilors ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {councilors.length === 0 ? (
                        <p>Nenhum vereador encontrado</p>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {councilors.map((councilor) => {
                            const councilAttendance = attendance.find((a: any) => a.userId === councilor.id);
                            
                            return (
                              <Card key={councilor.id} className={councilAttendance ? "border-green-200" : ""}>
                                <CardContent className="p-4">
                                  <div className="flex flex-col space-y-3">
                                    <div className="flex items-center gap-3">
                                      <Avatar>
                                        <AvatarImage src={councilor.profileImageUrl || ""} alt={councilor.name} />
                                        <AvatarFallback>{councilor.name?.substring(0, 2) || "?"}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">{councilor.name}</p>
                                        <p className="text-sm text-muted-foreground">Vereador</p>
                                      </div>
                                    </div>
                                    
                                    {councilAttendance ? (
                                      <div className="flex items-center p-2 bg-green-50 rounded-md">
                                        <Check className="w-4 h-4 mr-2 text-green-600" />
                                        <span className="text-sm">Registrado como <strong>{councilAttendance.status}</strong></span>
                                      </div>
                                    ) : (
                                      <div className="flex gap-2 mt-2">
                                        <Button 
                                          size="sm" 
                                          className="flex-1"
                                          onClick={() => handleCouncilorAttendance(councilor.id, "Presente")}
                                        >
                                          Presente
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          className="flex-1"
                                          onClick={() => handleCouncilorAttendance(councilor.id, "Justificado")}
                                        >
                                          Justificar
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                      
                      <div className="flex justify-end">
                        <Button 
                          variant="ghost" 
                          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "attendance"] })}
                          className="gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Atualizar Lista
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {attendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserCheck className="w-12 h-12 mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium">Nenhuma presença registrada</h3>
                <p className="text-muted-foreground">Ainda não há registros de presença para este evento.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vereador</TableHead>
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Documentos</h2>
              {isAuthenticated && user?.role === "admin" && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/documents/new?eventId=${eventId}`)}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Novo Documento para este Evento
                </Button>
              )}
            </div>
            
            {!eventDetails.documents || eventDetails.documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="w-12 h-12 mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium">Nenhum documento registrado</h3>
                <p className="text-muted-foreground">Este evento ainda não possui documentos associados.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Documentos do Evento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Autor</TableHead>
                          <TableHead>Situação</TableHead>
                          <TableHead>Arquivo</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eventDetails.documents.map((document: any) => (
                          <TableRow key={document.id}>
                            <TableCell className="font-medium">{document.documentNumber}</TableCell>
                            <TableCell>{document.documentType}</TableCell>
                            <TableCell>
                              {document.documentDate ? format(new Date(document.documentDate), "dd/MM/yyyy") : "-"}
                            </TableCell>
                            <TableCell>{document.authorType}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                className={
                                  document.status === "Vigente" 
                                    ? "bg-green-100 text-green-800 hover:bg-green-100" 
                                    : document.status === "Revogada" 
                                      ? "bg-red-100 text-red-800 hover:bg-red-100"
                                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                }
                              >
                                {document.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {document.fileName ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => window.open(`/api/files/documents/${document.id}`, '_blank')}
                                  className="gap-1"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="max-w-[100px] truncate">{document.fileName}</span>
                                </Button>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate(`/documents/${document.id}`)}
                              >
                                Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="approvals" className="pt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Votações</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  Pendentes
                </Badge>
              </div>
            </div>
            
            {loadingApprovalActivities ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : activitiesRequiringApproval?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Vote className="w-12 h-12 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">Sem atividades para votação</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Não há atividades legislativas que necessitam de aprovação neste evento.
                </p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activitiesRequiringApproval?.map((activity: any) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">{activity.activityNumber}</TableCell>
                        <TableCell>
                          {format(new Date(activity.activityDate), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>{activity.activityType}</TableCell>
                        <TableCell className="max-w-xs truncate">{activity.description}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedActivity(activity);
                              setSelectedActivityId(activity.id);
                              setApprovalComment("");
                              setIsApprovalDialogOpen(true);
                            }}
                          >
                            <Vote className="w-4 h-4 mr-1" />
                            Analisar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Dialogs for voting and attendance confirmation */}      
      <Dialog open={isVoteDialogOpen} onOpenChange={setIsVoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Votar no Documento</DialogTitle>
            <DialogDescription>
              Registre seu voto e comentário opcional para este documento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selecione seu voto:</h4>
              <div className="flex flex-wrap gap-2">
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
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Comentário (opcional):</h4>
              <Textarea 
                placeholder="Adicione um comentário ao seu voto"
                value={voteComment}
                onChange={(e) => setVoteComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVoteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleVoteSubmit} disabled={!voteValue}>Enviar Voto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Presença</DialogTitle>
            <DialogDescription>
              Confirme sua presença neste evento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Status:</h4>
              <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Presente">Presente</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                  <SelectItem value="Justificado">Justificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Observações (opcional):</h4>
              <Textarea 
                placeholder="Adicione uma observação se necessário"
                value={attendanceNotes}
                onChange={(e) => setAttendanceNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAttendanceDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAttendanceSubmit}>Confirmar Presença</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Aprovação de Atividade */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Analisar Atividade Legislativa</DialogTitle>
            <DialogDescription>
              Revise o arquivo da atividade e aprove ou rejeite a solicitação.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {selectedActivity && (
              <>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{selectedActivity.description}</h3>
                  <p className="text-sm text-muted-foreground">
                    Nº {selectedActivity.activityNumber} - {selectedActivity.activityType}
                  </p>
                  <p className="text-sm">
                    Data: {new Date(selectedActivity.activityDate).toLocaleDateString('pt-BR')}
                  </p>
                  
                  {selectedActivity.fileName && (
                    <div className="border rounded-md p-2 mt-4">
                      <h4 className="font-medium mb-2">Arquivo anexado:</h4>
                      <iframe 
                        ref={filePreviewRef}
                        src={`/api/files/activities/${selectedActivity.id}?download=false`}
                        className="w-full h-[400px] border rounded"
                        title="Visualização do documento"
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="approvalComment">Comentário (opcional):</Label>
                  <Textarea
                    id="approvalComment"
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    placeholder="Digite um comentário sobre sua decisão..."
                    className="resize-none"
                  />
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                approveActivityMutation.mutate({
                  activityId: selectedActivityId!,
                  approved: false,
                  comment: approvalComment
                });
              }}
              disabled={approveActivityMutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Rejeitar
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={() => {
                approveActivityMutation.mutate({
                  activityId: selectedActivityId!,
                  approved: true,
                  comment: approvalComment
                });
              }}
              disabled={approveActivityMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4" />
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}