import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, Users, Activity, ClipboardList } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Activity {
  id: number;
  activityNumber: number;
  activityDate: string;
  description: string;
  activityType: string;
  status?: string;
}

interface Committee {
  id: number;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  role: string;
}

interface Document {
  id: number;
  description: string;
  documentNumber: number;
  documentType: string;
  documentDate: string;
  status?: string;
}

export default function CouncilorDetails() {
  const { id } = useParams();
  const [_, setLocation] = useLocation();

  // Buscar dados do vereador
  const { data: councilor, isLoading: isCouncilorLoading } = useQuery({
    queryKey: [`/api/users/${id}`],
    enabled: !!id,
  });

  // Buscar atividades legislativas do vereador
  const { data: activities, isLoading: isActivitiesLoading } = useQuery({
    queryKey: [`/api/users/${id}/activities`],
    enabled: !!id,
  });

  // Buscar documentos do vereador
  const { data: councilorDocuments, isLoading: isDocumentsLoading } = useQuery({
    queryKey: [`/api/users/${id}/documents`],
    enabled: !!id,
  });

  // Buscar documentos gerais da câmara (todos os documentos do sistema)
  const { data: allDocumentsResponse } = useQuery({
    queryKey: ["/api/documents"],
    enabled: true,
  });

  // Usar documentos específicos do vereador ou todos os documentos do sistema
  const documents = Array.isArray(councilorDocuments) && councilorDocuments.length > 0 
    ? councilorDocuments 
    : (allDocumentsResponse?.documents || []);

  // Buscar comissões do vereador
  const { data: committees, isLoading: isCommitteesLoading } = useQuery({
    queryKey: [`/api/users/${id}/committees`],
    enabled: !!id,
  });

  const handleBack = () => {
    setLocation("/councilors");
  };

  // Formatar telefone para exibição
  const formatPhone = (phone: string) => {
    if (!phone) return "Não informado";
    
    // Se for um número de telefone com 11 dígitos (celular com DDD)
    if (phone.length === 11) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
    } 
    // Se for um número com 10 dígitos (fixo com DDD)
    else if (phone.length === 10) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
    }
    
    return phone;
  };

  // Formatador de datas
  const formatDate = (dateString: string) => {
    if (!dateString) return "Não informada";
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "aprovado":
      case "aprovada":
      case "ativo":
      case "ativa":
        return "bg-green-500";
      case "em análise":
      case "pendente":
        return "bg-yellow-500";
      case "rejeitado":
      case "rejeitada":
      case "inativo":
      case "inativa":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const isLoading = isCouncilorLoading || isActivitiesLoading || isDocumentsLoading || isCommitteesLoading;

  return (
    <>
      <Helmet>
        <title>{councilor?.name ? `${councilor.name} | Vereadores` : 'Detalhes do Vereador'} | Sistema Legislativo</title>
        <meta name="description" content="Detalhes do vereador, incluindo informações de contato, atividades legislativas e comissões." />
      </Helmet>

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Detalhes do Vereador</h1>
        </div>

        {isLoading ? (
          // Esqueleto de carregamento
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-[300px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-[200px]" />
              </CardHeader>
              <CardContent>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="mb-4">
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-[70%]" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informações pessoais */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={councilor?.profileImageUrl || undefined} alt={councilor?.name} />
                    <AvatarFallback className="text-2xl">{councilor?.name ? getInitials(councilor.name) : "VR"}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-2xl">{councilor?.name}</CardTitle>
                  <Badge 
                    variant={councilor?.active ? "default" : "secondary"}
                    className={cn(
                      councilor?.active ? "bg-green-500" : "bg-gray-500",
                      "mt-2"
                    )}
                  >
                    {councilor?.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{councilor?.email}</span>
                  </div>
                  
                  {councilor?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{formatPhone(councilor.phone)}</span>
                    </div>
                  )}
                  
                  {councilor?.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{councilor.address}</span>
                    </div>
                  )}
                  
                  {councilor?.birthDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Nascimento: {formatDate(councilor.birthDate.toString())}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Conteúdo em abas */}
            <Card className="lg:col-span-2">
              <Tabs defaultValue="activities">
                <CardHeader className="pb-0">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="activities" className="flex gap-1 items-center">
                      <Activity className="h-4 w-4" />
                      <span>Atividades</span>
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex gap-1 items-center">
                      <FileText className="h-4 w-4" />
                      <span>Documentos</span>
                    </TabsTrigger>
                    <TabsTrigger value="committees" className="flex gap-1 items-center">
                      <Users className="h-4 w-4" />
                      <span>Comissões</span>
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="pt-4">
                  {/* Aba de Atividades */}
                  <TabsContent value="activities" className="mt-0">
                    <h3 className="font-semibold text-lg mb-4">Atividades Legislativas</h3>
                    
                    {!activities || activities.length === 0 ? (
                      <p className="text-muted-foreground text-center py-6">
                        Nenhuma atividade legislativa encontrada para este vereador.
                      </p>
                    ) : (
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                          {activities.map((activity: Activity) => (
                            <Card key={activity.id} className="overflow-hidden">
                              <div className={cn(
                                "h-1",
                                activity.status ? getStatusColor(activity.status) : "bg-blue-500"
                              )} />
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base">
                                    {activity.activityType} Nº {activity.activityNumber}
                                  </CardTitle>
                                  {activity.status && (
                                    <Badge className={getStatusColor(activity.status)}>
                                      {activity.status}
                                    </Badge>
                                  )}
                                </div>
                                <CardDescription>{formatDate(activity.activityDate)}</CardDescription>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <p className="text-sm">{activity.description}</p>
                              </CardContent>
                              <CardFooter>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full"
                                  onClick={() => setLocation(`/activities/${activity.id}`)}
                                >
                                  Ver detalhes
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>

                  {/* Aba de Documentos */}
                  <TabsContent value="documents" className="mt-0">
                    <h3 className="font-semibold text-lg mb-4">Documentos</h3>
                    
                    {!documents || documents.length === 0 ? (
                      <p className="text-muted-foreground text-center py-6">
                        Nenhum documento encontrado para este vereador.
                      </p>
                    ) : (
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                          {documents.map((doc: Document) => (
                            <Card key={doc.id} className="overflow-hidden">
                              <div className={cn(
                                "h-1",
                                doc.status ? getStatusColor(doc.status) : "bg-blue-500"
                              )} />
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base">
                                    {doc.documentType} Nº {doc.documentNumber}
                                  </CardTitle>
                                  {doc.status && (
                                    <Badge className={getStatusColor(doc.status)}>
                                      {doc.status}
                                    </Badge>
                                  )}
                                </div>
                                <CardDescription>
                                  {doc.documentDate ? formatDate(doc.documentDate) : "Data não informada"}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <p className="text-sm">{doc.description}</p>
                              </CardContent>
                              <CardFooter>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full"
                                  onClick={() => setLocation(`/documents/${doc.id}`)}
                                >
                                  Ver documento
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>

                  {/* Aba de Comissões */}
                  <TabsContent value="committees" className="mt-0">
                    <h3 className="font-semibold text-lg mb-4">Participação em Comissões</h3>
                    
                    {!committees || committees.length === 0 ? (
                      <p className="text-muted-foreground text-center py-6">
                        Este vereador não participa de nenhuma comissão.
                      </p>
                    ) : (
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                          {committees.map((committee: Committee) => {
                            const isActive = new Date(committee.endDate) > new Date();
                            return (
                              <Card key={committee.id} className="overflow-hidden">
                                <div className={cn(
                                  "h-1",
                                  isActive ? "bg-green-500" : "bg-gray-500"
                                )} />
                                <CardHeader className="pb-2">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">
                                      {committee.name}
                                    </CardTitle>
                                    <Badge className={cn(
                                      isActive ? "bg-green-500" : "bg-gray-500"
                                    )}>
                                      {isActive ? "Ativa" : "Encerrada"}
                                    </Badge>
                                  </div>
                                  <CardDescription>{committee.type}</CardDescription>
                                </CardHeader>
                                <CardContent className="pb-2">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium">Função:</span>
                                    <Badge variant="outline" className="font-semibold">
                                      {committee.role === 'president' ? 'Presidente' : 
                                       committee.role === 'vice_president' ? 'Vice-Presidente' : 'Membro'}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-col text-sm space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Início:</span>
                                      <span>{formatDate(committee.startDate)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Término:</span>
                                      <span>{formatDate(committee.endDate)}</span>
                                    </div>
                                  </div>
                                </CardContent>
                                <CardFooter>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="w-full"
                                    onClick={() => setLocation(`/committees/${committee.id}`)}
                                  >
                                    Ver comissão
                                  </Button>
                                </CardFooter>
                              </Card>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}