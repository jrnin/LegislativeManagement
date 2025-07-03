import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Loader2, 
  Calendar, 
  Users, 
  FileText, 
  Edit, 
  Trash2, 
  Download, 
  ArrowLeft,
  Activity,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Vote,
  Plus,
  Check,
  X
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/utils/formatters";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function ActivityDetails() {
  const { id } = useParams<{ id: string }>();
  const activityId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [activityVote, setActivityVote] = useState<boolean | null>(null);
  const [voteComment, setVoteComment] = useState("");
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [showAdminVoteDialog, setShowAdminVoteDialog] = useState(false);
  const [selectedCouncilors, setSelectedCouncilors] = useState<{
    [userId: string]: { selected: boolean; vote: boolean | null; comment: string }
  }>({});
  const fileViewerRef = useRef<HTMLIFrameElement>(null);

  interface ActivityType {
    id: number;
    activityType: string;
    activityNumber: number;
    description: string;
    activityDate: string;
    status: string;
    createdAt?: string;
    filePath?: string;
    fileName?: string;
    eventId?: number;
    approved?: boolean;
    approvedBy?: string;
    approvedAt?: string;
    approvalComment?: string;
    authors?: Array<{
      id: string;
      name: string;
      profileImageUrl?: string;
    }>;
  }
  
  interface TimelineEvent {
    id: number;
    activityId: number;
    eventType: string;
    description: string;
    eventDate: string;
    createdAt: string;
    createdBy?: string;
    user?: {
      id: string;
      name: string;
      profileImageUrl?: string;
    };
  }
  
  interface ActivityVote {
    id: number;
    activityId: number;
    userId: string;
    vote: boolean;
    comment?: string;
    votedAt?: string;
    createdAt: string;
    user?: {
      id: string;
      name: string;
      profileImageUrl?: string;
    };
  }
  
  interface VoteStats {
    totalVotes: number;
    approveCount: number;
    rejectCount: number;
    approvePercentage: number;
    rejectPercentage: number;
  }

  // Buscar detalhes da atividade
  const { 
    data: activity, 
    isLoading: loadingActivity 
  } = useQuery<ActivityType>({
    queryKey: [`/api/activities/${activityId}`],
    enabled: !isNaN(activityId)
  });

  // Buscar timeline da atividade
  const {
    data: timeline = [] as TimelineEvent[],
    isLoading: loadingTimeline
  } = useQuery<TimelineEvent[]>({
    queryKey: [`/api/activities/${activityId}/timeline`],
    enabled: !isNaN(activityId) && !!activity
  });

  // Interface para resposta de votos
  interface VotesResponse {
    votes: ActivityVote[];
  }

  // Buscar votos da atividade
  const {
    data: votesData,
    isLoading: loadingVotes
  } = useQuery<VotesResponse>({
    queryKey: [`/api/activities/${activityId}/votes`],
    enabled: !isNaN(activityId) && !!activity
  });
  
  // Extrair o array de votos
  const votes = votesData?.votes || [];

  // Buscar estatísticas de votação
  const {
    data: votesStats,
    isLoading: loadingVotesStats
  } = useQuery<VoteStats>({
    queryKey: [`/api/activities/${activityId}/votes/stats`],
    enabled: !isNaN(activityId) && !!activity
  });

  // Buscar voto do usuário atual
  const {
    data: userVote,
    isLoading: loadingUserVote,
    refetch: refetchUserVote
  } = useQuery<ActivityVote>({
    queryKey: [`/api/activities/${activityId}/votes/my`],
    enabled: !isNaN(activityId) && isAuthenticated && !!activity
  });

  // Buscar todos os usuários (para votação administrativa)
  const {
    data: allUsers = [],
    isLoading: loadingUsers
  } = useQuery<Array<{ id: string; name: string; role: string; profileImageUrl?: string }>>({
    queryKey: ["/api/users"],
    enabled: user?.role === "admin"
  });

  // Filtrar apenas vereadores
  const councilors = allUsers.filter(u => u.role === "councilor");

  // Mutação para excluir atividade
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/activities/${activityId}`);
    },
    onSuccess: () => {
      toast({
        title: "Atividade excluída",
        description: "A atividade legislativa foi excluída com sucesso."
      });
      navigate("/activities");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir atividade",
        description: error.message
      });
    }
  });

  // Mutação para votar na atividade
  const voteMutation = useMutation({
    mutationFn: async ({ vote, comment }: { vote: boolean, comment?: string }) => {
      return await apiRequest("POST", `/api/activities/${activityId}/votes`, { 
        vote,
        comment
      });
    },
    onSuccess: () => {
      toast({
        title: "Voto registrado",
        description: "Seu voto foi registrado com sucesso."
      });
      setShowVoteDialog(false);
      
      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}/votes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}/votes/stats`] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}/votes/my`] });
      
      // Forçar uma atualização explícita após um breve atraso
      setTimeout(() => {
        refetchUserVote();
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao registrar voto",
        description: error.message
      });
    }
  });

  // Mutation para votação administrativa
  const adminVoteMutation = useMutation({
    mutationFn: async (votes: Array<{ userId: string; vote: boolean; comment?: string }>) => {
      return await apiRequest("POST", `/api/activities/${activityId}/votes/admin`, { 
        votes 
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Votos registrados",
        description: `${data.count || 0} votos foram registrados com sucesso.`
      });
      setShowAdminVoteDialog(false);
      setSelectedCouncilors({});
      
      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}/votes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}/votes/stats`] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}/timeline`] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao registrar votos",
        description: error.message
      });
    }
  });

  // Função para registrar votos administrativos
  const handleAdminVote = () => {
    const votesToSubmit = Object.entries(selectedCouncilors)
      .filter(([_, data]) => data.selected && data.vote !== null)
      .map(([userId, data]) => ({
        userId,
        vote: data.vote!,
        comment: data.comment || undefined
      }));

    if (votesToSubmit.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum voto selecionado",
        description: "Selecione pelo menos um vereador e defina o voto."
      });
      return;
    }

    adminVoteMutation.mutate(votesToSubmit);
  };

  // Função para atualizar seleção de vereador
  const updateCouncilorSelection = (userId: string, field: string, value: any) => {
    setSelectedCouncilors(prev => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || { selected: false, vote: null, comment: "" }),
        [field]: value
      }
    }));
  };

  // Verificar se o usuário pode editar a atividade
  const canEdit = () => {
    if (!activity || !user) return false;
    
    // Administradores podem editar
    if (user.role === "admin") return true;
    
    // Autores podem editar
    if (activity.authors && Array.isArray(activity.authors)) {
      return activity.authors.some((author: { id: string }) => author.id === user.id);
    }
    
    return false;
  };

  // Confirmar exclusão
  const confirmDelete = () => {
    deleteMutation.mutate();
  };

  // Obter badge de status
  const getStatusBadge = () => {
    if (!activity) return null;
    
    if (activity.status === "Aprovado") {
      return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
    } else if (activity.status === "Rejeitado") {
      return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Aguardando Aprovação</Badge>;
    }
  };

  // Formatar o título da atividade
  const getActivityTitle = () => {
    if (!activity) return "";
    const date = new Date(activity.activityDate);
    const year = date.getFullYear();
    return `${activity.activityType} Nº ${activity.activityNumber}/${year}`;
  };

  if (loadingActivity) {
    return (
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <h2 className="text-2xl font-bold">Atividade não encontrada</h2>
          <p className="text-muted-foreground">A atividade solicitada não existe ou foi removida.</p>
          <Button onClick={() => navigate("/activities")}>Voltar para Atividades</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 sm:px-6 lg:px-8 mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Button 
            variant="ghost" 
            className="mb-2 p-0 h-8"
            onClick={() => navigate("/activities")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para atividades
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {getActivityTitle()}
          </h1>
          <p className="text-xl text-muted-foreground mt-1">
            {activity.description}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {activity.filePath && (
            <Button 
              variant="outline"
              onClick={() => window.open(`/api/files/activities/${activity.id}`, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Arquivo
            </Button>
          )}
          {canEdit() && (
            <>
              <Button 
                variant="outline"
                onClick={() => navigate(`/activities/${activity.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button 
                variant="destructive"
                onClick={() => setShowDeleteAlert(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </>
          )}
          {user?.role === "admin" && (
            <Dialog open={showAdminVoteDialog} onOpenChange={setShowAdminVoteDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="secondary"
                  className="bg-purple-100 text-purple-700 hover:bg-purple-200"
                >
                  <Vote className="mr-2 h-4 w-4" />
                  Registrar Votos
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registrar Votos dos Vereadores</DialogTitle>
                  <DialogDescription>
                    Selecione os vereadores e registre seus votos para esta atividade legislativa.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {councilors.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Nenhum vereador cadastrado no sistema.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {councilors.map((councilor) => {
                        const current = selectedCouncilors[councilor.id] || { 
                          selected: false, 
                          vote: null, 
                          comment: "" 
                        };
                        
                        // Verificar se o vereador já votou
                        const existingVote = votes.find(v => v.userId === councilor.id);
                        
                        return (
                          <div key={councilor.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={current.selected}
                                onCheckedChange={(checked) => 
                                  updateCouncilorSelection(councilor.id, 'selected', checked)
                                }
                                disabled={!!existingVote}
                              />
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={councilor.profileImageUrl} />
                                <AvatarFallback>
                                  {councilor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">{councilor.name}</p>
                                {existingVote && (
                                  <p className="text-sm text-gray-500">
                                    Já votou: {existingVote.vote ? 'Aprovado' : 'Rejeitado'}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {current.selected && !existingVote && (
                              <div className="ml-11 space-y-3">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant={current.vote === true ? "default" : "outline"}
                                    onClick={() => updateCouncilorSelection(councilor.id, 'vote', true)}
                                    className={current.vote === true ? "bg-green-600 hover:bg-green-700" : ""}
                                  >
                                    <ThumbsUp className="mr-1 h-3 w-3" />
                                    Aprovado
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={current.vote === false ? "default" : "outline"}
                                    onClick={() => updateCouncilorSelection(councilor.id, 'vote', false)}
                                    className={current.vote === false ? "bg-red-600 hover:bg-red-700" : ""}
                                  >
                                    <ThumbsDown className="mr-1 h-3 w-3" />
                                    Rejeitado
                                  </Button>
                                </div>
                                
                                <div className="space-y-1">
                                  <Label htmlFor={`comment-${councilor.id}`} className="text-xs text-gray-600">
                                    Comentário (opcional)
                                  </Label>
                                  <Textarea
                                    id={`comment-${councilor.id}`}
                                    placeholder="Comentário do vereador..."
                                    value={current.comment}
                                    onChange={(e) => updateCouncilorSelection(councilor.id, 'comment', e.target.value)}
                                    rows={2}
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAdminVoteDialog(false);
                      setSelectedCouncilors({});
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAdminVote}
                    disabled={
                      adminVoteMutation.isPending ||
                      Object.values(selectedCouncilors).filter(c => c.selected && c.vote !== null).length === 0
                    }
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {adminVoteMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Registrar Votos
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Atividade</CardTitle>
              <CardDescription>
                Informações sobre a atividade legislativa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm text-muted-foreground">Tipo</h3>
                  <p className="font-medium">{activity.activityType}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm text-muted-foreground">Número</h3>
                  <p className="font-medium">{activity.activityNumber}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm text-muted-foreground">Data</h3>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(activity.activityDate)}
                  </p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm text-muted-foreground">Status</h3>
                  <div>{getStatusBadge()}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm text-muted-foreground">Descrição</h3>
                <p>{activity.description}</p>
              </div>

              {activity.authors && activity.authors.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm text-muted-foreground">Autores</h3>
                    <div className="flex flex-wrap gap-2">
                      {activity.authors.map((author: any) => (
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
                </>
              )}

              {activity.eventId && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm text-muted-foreground">Evento relacionado</h3>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto"
                      onClick={() => navigate(`/events/${activity.eventId}`)}
                    >
                      Ver evento
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {activity.filePath && (
            <Card>
              <CardHeader>
                <CardTitle>Documento</CardTitle>
                <CardDescription>
                  Visualização do documento anexado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Arquivo: {activity.fileName}
                  </h4>
                  <iframe 
                    ref={fileViewerRef}
                    src={`/api/files/activities/${activity.id}?download=false`}
                    className="w-full h-[400px] border rounded"
                    title="Visualização do documento"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline"
                  onClick={() => window.open(`/api/files/activities/${activity.id}`, '_blank')}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Arquivo
                </Button>
              </CardFooter>
            </Card>
          )}
          
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
              <TabsTrigger value="votes">Votações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timeline" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico da Atividade</CardTitle>
                  <CardDescription>
                    Linha do tempo com todas as ações realizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTimeline ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : timeline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Activity className="w-12 h-12 mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium">Nenhum evento registrado</h3>
                      <p className="text-muted-foreground max-w-md">
                        Esta atividade ainda não possui eventos registrados em sua linha do tempo.
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Linha central vertical */}
                      <div className="absolute left-[25px] top-6 bottom-0 w-[2px] bg-gray-200"></div>
                      
                      {/* Criação da atividade */}
                      <div className="mb-8 relative">
                        <div className="absolute left-0 bg-blue-500 rounded-full w-[12px] h-[12px] mt-1.5 -ml-[5px] flex items-center justify-center border-4 border-white z-10">
                        </div>
                        <div className="ml-12">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">
                              {formatDate(activity.createdAt || activity.activityDate)}
                            </span>
                            <h3 className="text-lg font-semibold">Criação da Atividade</h3>
                            <p className="text-muted-foreground">
                              A atividade foi criada 
                              {activity.authors && activity.authors.length > 0 ? 
                                ` por ${activity.authors[0].name}` : 
                                ""}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Eventos da timeline */}
                      {timeline.map((event: any, index: number) => (
                        <div key={event.id} className="mb-8 relative">
                          <div className="absolute left-0 bg-green-500 rounded-full w-[12px] h-[12px] mt-1.5 -ml-[5px] flex items-center justify-center border-4 border-white z-10">
                          </div>
                          <div className="ml-12">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500">
                                {formatDate(event.eventDate || event.createdAt)}
                              </span>
                              <h3 className="text-lg font-semibold">{event.eventType}</h3>
                              <p className="text-muted-foreground">{event.description}</p>
                              {event.createdBy && (
                                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs">
                                  <span>por {event.user?.name || event.createdBy}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Votações */}
                      {votes && votes.length > 0 && (
                        <div className="mb-8 relative">
                          <div className="absolute left-0 bg-purple-500 rounded-full w-[12px] h-[12px] mt-1.5 -ml-[5px] flex items-center justify-center border-4 border-white z-10">
                          </div>
                          <div className="ml-12">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500">
                                Votação da atividade
                              </span>
                              <h3 className="text-lg font-semibold">Resultado da Votação</h3>
                              
                              <div className="mt-4 grid grid-cols-2 gap-4 max-w-md">
                                <div className="bg-green-50 p-3 rounded-md text-center">
                                  <p className="text-green-700 text-lg font-bold">
                                    {votesStats?.approveCount || 0}
                                    <span className="ml-1 text-sm font-normal">
                                      ({typeof votesStats?.approvePercentage === 'number' 
                                        ? votesStats.approvePercentage.toFixed(1) 
                                        : '0.0'}%)
                                    </span>
                                  </p>
                                  <p className="text-sm text-green-600">Aprovações</p>
                                </div>
                                
                                <div className="bg-red-50 p-3 rounded-md text-center">
                                  <p className="text-red-700 text-lg font-bold">
                                    {votesStats?.rejectCount || 0}
                                    <span className="ml-1 text-sm font-normal">
                                      ({typeof votesStats?.rejectPercentage === 'number' 
                                        ? votesStats.rejectPercentage.toFixed(1) 
                                        : '0.0'}%)
                                    </span>
                                  </p>
                                  <p className="text-sm text-red-600">Rejeições</p>
                                </div>
                              </div>
                              
                              <div className="space-y-2 mt-4">
                                <p className="text-muted-foreground">
                                  Total de {votesStats?.totalVotes || 0} voto(s) registrado(s)
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Status de aprovação */}
                      {activity.status === "Aprovado" && (
                        <div className="relative">
                          <div className="absolute left-0 bg-green-500 rounded-full w-[12px] h-[12px] mt-1.5 -ml-[5px] flex items-center justify-center border-4 border-white z-10">
                          </div>
                          <div className="ml-12">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500">
                                {activity.approvedAt ? formatDate(activity.approvedAt) : "Data não registrada"}
                              </span>
                              <h3 className="text-lg font-semibold">Atividade Aprovada</h3>
                              <p className="text-muted-foreground">
                                {activity.approvedBy ? `Aprovado por ${activity.approvedBy}` : "Aprovado pelo sistema"}
                              </p>
                              {activity.approvalComment && (
                                <div className="mt-2 p-3 bg-muted rounded-md">
                                  <p className="text-sm italic">{activity.approvalComment}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {activity.status === "Rejeitado" && (
                        <div className="relative">
                          <div className="absolute left-0 bg-red-500 rounded-full w-[12px] h-[12px] mt-1.5 -ml-[5px] flex items-center justify-center border-4 border-white z-10">
                          </div>
                          <div className="ml-12">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500">
                                {activity.approvedAt ? formatDate(activity.approvedAt) : "Data não registrada"}
                              </span>
                              <h3 className="text-lg font-semibold">Atividade Rejeitada</h3>
                              <p className="text-muted-foreground">
                                {activity.approvedBy ? `Rejeitado por ${activity.approvedBy}` : "Rejeitado pelo sistema"}
                              </p>
                              {activity.approvalComment && (
                                <div className="mt-2 p-3 bg-muted rounded-md">
                                  <p className="text-sm italic">{activity.approvalComment}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="votes" className="pt-4">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Votações da Atividade</CardTitle>
                    <CardDescription>
                      Registro de votos da atividade legislativa
                    </CardDescription>
                  </div>
                  
                  {isAuthenticated && !userVote && (
                    <Button onClick={() => setShowVoteDialog(true)}>
                      Votar
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {loadingVotes ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : votes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <ThumbsUp className="w-12 h-12 mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium">Nenhum voto registrado</h3>
                      <p className="text-muted-foreground max-w-md">
                        Esta atividade ainda não recebeu nenhum voto dos vereadores.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Estatísticas de votação */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-green-700 flex items-center">
                              <ThumbsUp className="mr-2 h-5 w-5" />
                              Aprovações ({votesStats?.approveCount || 0})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {typeof votesStats?.approvePercentage === 'number' 
                                ? votesStats.approvePercentage.toFixed(1) 
                                : '0.0'}%
                            </div>
                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mt-2">
                              <div 
                                className="h-full bg-green-500 rounded-l-full" 
                                style={{ 
                                  width: `${typeof votesStats?.approvePercentage === 'number' 
                                    ? votesStats.approvePercentage.toFixed(1) 
                                    : '0.0'}%` 
                                }}
                              />
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-red-700 flex items-center">
                              <ThumbsDown className="mr-2 h-5 w-5" />
                              Rejeições ({votesStats?.rejectCount || 0})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {typeof votesStats?.rejectPercentage === 'number' 
                                ? votesStats.rejectPercentage.toFixed(1) 
                                : '0.0'}%
                            </div>
                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mt-2">
                              <div 
                                className="h-full bg-red-500 rounded-l-full" 
                                style={{ 
                                  width: `${typeof votesStats?.rejectPercentage === 'number' 
                                    ? votesStats.rejectPercentage.toFixed(1) 
                                    : '0.0'}%` 
                                }}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Lista de votos */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Votos Registrados</h3>
                        <div className="space-y-4">
                          {votes.map((vote: any) => (
                            <div 
                              key={vote.id} 
                              className={`p-4 rounded-lg border ${
                                vote.vote ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={vote.user?.profileImageUrl} />
                                    <AvatarFallback>
                                      {vote.user?.name?.substring(0, 2) || 'US'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{vote.user?.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(vote.votedAt || vote.createdAt)}
                                    </p>
                                  </div>
                                </div>
                                <Badge className={vote.vote ? 
                                  'bg-green-100 text-green-800' : 
                                  'bg-red-100 text-red-800'
                                }>
                                  {vote.vote ? 'Aprovado' : 'Rejeitado'}
                                </Badge>
                              </div>
                              
                              {vote.comment && (
                                <div className="mt-3 pl-12">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <p className="text-sm">{vote.comment}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                {userVote && (
                  <CardFooter>
                    <div className="w-full p-4 rounded-lg border bg-muted">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Seu voto</h3>
                        <Badge className={userVote.vote ? 
                          'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'
                        }>
                          {userVote.vote ? 'Aprovado' : 'Rejeitado'}
                        </Badge>
                      </div>
                      {userVote.comment && (
                        <div className="mt-2">
                          <p className="text-sm">{userVote.comment}</p>
                        </div>
                      )}
                    </div>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Coluna lateral */}
        <div className="space-y-6">
          {/* Votação rápida */}
          {isAuthenticated && activity.status === "Aguardando Votação" && (
            <Card>
              <CardHeader>
                <CardTitle>Registrar Voto</CardTitle>
                <CardDescription>
                  Vote nesta atividade legislativa
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userVote ? (
                  <div className="text-center py-2">
                    <Badge className={`mb-2 ${userVote.vote ? 
                      'bg-green-100 text-green-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {userVote.vote ? 'Você aprovou' : 'Você rejeitou'}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Você já registrou seu voto nesta atividade
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white w-full"
                      size="lg"
                      onClick={() => {
                        setActivityVote(true);
                        setShowVoteDialog(true);
                      }}
                    >
                      <ThumbsUp className="mr-2 h-5 w-5" />
                      Aprovar
                    </Button>
                    <Button 
                      className="bg-red-600 hover:bg-red-700 text-white w-full"
                      size="lg"
                      onClick={() => {
                        setActivityVote(false);
                        setShowVoteDialog(true);
                      }}
                    >
                      <ThumbsDown className="mr-2 h-5 w-5" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Estatísticas */}
          {votes && votes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
                <CardDescription>
                  Resumo da votação atual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Aprovações</span>
                    <span className="font-medium text-green-700">
                      {votesStats?.approvePercentage?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-l-full" 
                      style={{ 
                        width: `${votesStats?.approvePercentage || 0}%` 
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Rejeições</span>
                    <span className="font-medium text-red-700">
                      {votesStats?.rejectPercentage?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-l-full" 
                      style={{ 
                        width: `${votesStats?.rejectPercentage || 0}%` 
                      }}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total de votos</p>
                  <p className="text-2xl font-bold">{votesStats?.totalVotes || 0}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta atividade legislativa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de votação */}
      <AlertDialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar Voto</AlertDialogTitle>
            <AlertDialogDescription>
              Você está {activityVote ? 'aprovando' : 'rejeitando'} a atividade "{activity.activityType} Nº {activity.activityNumber}". Você pode adicionar um comentário opcional ao seu voto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Seu voto:</h4>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={activityVote ? "default" : "outline"}
                    onClick={() => setActivityVote(true)}
                    className={activityVote ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Aprovar
                  </Button>
                  <Button
                    type="button"
                    variant={!activityVote ? "default" : "outline"}
                    onClick={() => setActivityVote(false)}
                    className={!activityVote ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Rejeitar
                  </Button>
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
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (activityVote !== null) {
                  voteMutation.mutate({
                    vote: activityVote,
                    comment: voteComment || undefined
                  });
                }
              }}
              disabled={activityVote === null || voteMutation.isPending}
            >
              {voteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Confirmar Voto'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}