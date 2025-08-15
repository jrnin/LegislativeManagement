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
import { ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, Users, Activity, ClipboardList, Download } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { User, LegislativeActivity, Document } from "@shared/schema";

interface Committee {
  id: number;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  role: string;
}

export default function CouncilorDetails() {
  const { id } = useParams();
  const [_, setLocation] = useLocation();

  // Buscar dados do vereador
  const { data: councilor, isLoading: isCouncilorLoading } = useQuery<User>({
    queryKey: [`/api/users/${id}`],
    enabled: !!id,
  });

  // Buscar atividades legislativas do vereador
  const { data: activities, isLoading: isActivitiesLoading } = useQuery<LegislativeActivity[]>({
    queryKey: [`/api/users/${id}/activities`],
    enabled: !!id,
  });

  // Buscar documentos do vereador
  const { data: councilorDocuments, isLoading: isDocumentsLoading } = useQuery<Document[]>({
    queryKey: [`/api/users/${id}/documents`],
    enabled: !!id,
  });

  // Buscar documentos gerais da câmara (todos os documentos do sistema)
  const { data: allDocumentsResponse } = useQuery<{ documents: Document[] }>({
    queryKey: ["/api/documents"],
    enabled: true,
  });

  // Usar documentos específicos do vereador ou todos os documentos do sistema
  const documents = Array.isArray(councilorDocuments) && councilorDocuments.length > 0 
    ? councilorDocuments 
    : (allDocumentsResponse?.documents || []);

  // Buscar comissões do vereador
  const { data: committees, isLoading: isCommitteesLoading } = useQuery<Committee[]>({
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

  const isLoading = isCouncilorLoading || isActivitiesLoading || isDocumentsLoading || isCommitteesLoading;

  return (
    <>
      <Helmet>
        <title>{councilor?.name ? `${councilor.name} | Vereadores` : 'Detalhes do Vereador'} | Sistema Legislativo</title>
        <meta name="description" content="Detalhes do vereador, incluindo informações de contato, atividades legislativas e comissões." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header com informações do vereador */}
        <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative max-w-6xl mx-auto p-6">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="sm" onClick={handleBack} className="bg-white/90 hover:bg-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30 ml-auto">
                Fale comigo!
              </Button>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-44 w-38 ring-2 ring-white/10 rounded-2xl">
                  <AvatarImage src={councilor?.profileImageUrl || undefined} alt={councilor?.name} className="rounded-2xl" />
                  <AvatarFallback className="text-2xl bg-white/10 text-white rounded-2xl">{councilor?.name ? getInitials(councilor.name) : "VR"}</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-1">{councilor?.name}</h1>
                <div className="space-y-1 text-white/90">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Cargo:</span>
                    <span className="font-medium">{councilor?.role === 'admin' ? 'Administrador' : councilor?.role === 'executive' ? 'Executivo' : 'Vereador'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Email:</span>
                    <span className="font-medium">{councilor?.email || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Partido:</span>
                    <span className="font-medium">{councilor?.partido || 'Não informado'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal com abas */}
        <div className="max-w-6xl mx-auto p-6">
          {isLoading ? (
            <div className="space-y-6">
              <div className="flex space-x-8 border-b">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-24" />
                ))}
              </div>
              <div className="space-y-4">
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          ) : (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white border rounded-lg h-12">
                <TabsTrigger value="info" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600">
                  Informações Básicas
                </TabsTrigger>
                <TabsTrigger value="activities" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600">
                  Atividades Legislativas
                </TabsTrigger>
                <TabsTrigger value="documents" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600">
                  Documentos
                </TabsTrigger>
                <TabsTrigger value="committees" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600">
                  Comissões
                </TabsTrigger>
              </TabsList>

              {/* Aba de Informações Básicas */}
              <TabsContent value="info" className="mt-6">
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-6 text-gray-900">Informações Básicas</h3>
                  
                  {/* Informações Pessoais */}
                  <div className="mb-8">
                    <h4 className="text-base font-semibold mb-4 text-gray-900 border-b pb-2">Dados Pessoais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Nome Completo</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">{councilor?.name || 'Não informado'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">CPF</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">{councilor?.cpf || 'Não informado'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Data de Nascimento</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">
                          {councilor?.birthDate ? format(new Date(councilor.birthDate), "dd/MM/yyyy", { locale: ptBR }) : 'Não informado'}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Estado Civil</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">{councilor?.maritalStatus || 'Não informado'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Profissão</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">{councilor?.occupation || 'Não informado'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Escolaridade</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">{councilor?.education || 'Não informado'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Partido Político</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">{councilor?.partido || 'Não informado'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Cargo</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">
                          {councilor?.role === 'admin' ? 'Administrador' : 
                           councilor?.role === 'executive' ? 'Executivo' : 'Vereador'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informações de Contato */}
                  <div className="mb-8">
                    <h4 className="text-base font-semibold mb-4 text-gray-900 border-b pb-2">Contato</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Email</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">{councilor?.email || 'Não informado'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Verificação de Email</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">
                          <Badge variant={councilor?.emailVerified ? "default" : "secondary"}>
                            {councilor?.emailVerified ? 'Verificado' : 'Não verificado'}
                          </Badge>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informações de Endereço */}
                  <div className="mb-8">
                    <h4 className="text-base font-semibold mb-4 text-gray-900 border-b pb-2">Endereço</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Endereço</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">{councilor?.address || 'Não informado'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Número</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">{councilor?.number || 'Não informado'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Bairro</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">{councilor?.neighborhood || 'Não informado'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Cidade</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">{councilor?.city || 'Não informado'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Estado</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">{councilor?.state || 'Não informado'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">CEP</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">{councilor?.zipCode || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Sistema */}
                  <div className="mb-8">
                    <h4 className="text-base font-semibold mb-4 text-gray-900 border-b pb-2">Informações do Sistema</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Data de Cadastro</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">
                          {councilor?.createdAt ? format(new Date(councilor.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Não informado'}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Última Atualização</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">
                          {councilor?.updatedAt ? format(new Date(councilor.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Não informado'}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">ID do Usuário</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4 font-mono text-xs">{councilor?.id || 'Não informado'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-40">Legislatura</span>
                        <span className="text-sm font-medium">:</span>
                        <span className="text-sm text-gray-900 ml-4">{councilor?.legislatureId || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>



              {/* Aba de Atividades Legislativas */}
              <TabsContent value="activities" className="mt-6">
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-6 text-gray-900">Atividades Legislativas</h3>
                  
                  {!activities || activities.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">
                      Nenhuma atividade legislativa encontrada para este vereador.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity: any) => (
                        <div key={activity.id} className="border rounded-lg p-6 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-medium text-gray-900 mb-2">
                                {activity.activityType} Nº {activity.activityNumber}
                              </h4>
                              <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                              
                              {/* Informações básicas em grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center text-sm">
                                  <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                                  <span className="text-gray-600">Data:</span>
                                  <span className="ml-2 font-medium">
                                    {activity.activityDate ? format(new Date(activity.activityDate), "dd/MM/yyyy", { locale: ptBR }) : 'Não informada'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center text-sm">
                                  <Activity className="mr-2 h-4 w-4 text-gray-500" />
                                  <span className="text-gray-600">Regime:</span>
                                  <span className="ml-2 font-medium">{activity.regimeTramitacao || 'Ordinária'}</span>
                                </div>
                                
                                <div className="flex items-center text-sm">
                                  <FileText className="mr-2 h-4 w-4 text-gray-500" />
                                  <span className="text-gray-600">Tipo de Aprovação:</span>
                                  <span className="ml-2 font-medium">
                                    {activity.approvalType === 'councilors' ? 'Vereadores' : 
                                     activity.approvalType === 'committees' ? 'Comissões' : 'Não necessária'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center text-sm">
                                  <Users className="mr-2 h-4 w-4 text-gray-500" />
                                  <span className="text-gray-600">Aprovado por:</span>
                                  <span className="ml-2 font-medium">{activity.approvedBy || 'Não informado'}</span>
                                </div>
                              </div>
                              
                              {/* Comentário de aprovação */}
                              {activity.approvalComment && (
                                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                                  <span className="text-sm font-medium text-gray-700">Comentário de Aprovação:</span>
                                  <p className="text-sm text-gray-600 mt-1">{activity.approvalComment}</p>
                                </div>
                              )}
                              
                              {/* Datas importantes */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                                <div>
                                  <span>Criado em:</span>
                                  <span className="ml-2">
                                    {activity.createdAt ? format(new Date(activity.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Não informado'}
                                  </span>
                                </div>
                                {activity.approvedAt && (
                                  <div>
                                    <span>Aprovado em:</span>
                                    <span className="ml-2">
                                      {format(new Date(activity.approvedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Badges de status */}
                            <div className="flex flex-col items-end space-y-2">
                              <Badge className={cn(
                                activity.situacao === "Tramitação Finalizada" ? "bg-green-100 text-green-800" : 
                                activity.situacao === "Aguardando Análise" ? "bg-yellow-100 text-yellow-800" : 
                                activity.situacao === "Arquivado" ? "bg-red-100 text-red-800" :
                                activity.situacao === "Vetado" ? "bg-red-100 text-red-800" :
                                "bg-blue-100 text-blue-800"
                              )}>
                                {activity.situacao}
                              </Badge>
                              
                              {activity.approved !== null && (
                                <Badge variant={activity.approved ? "default" : "destructive"}>
                                  {activity.approved ? "Aprovado" : "Reprovado"}
                                </Badge>
                              )}
                              
                              {activity.filePath && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(`/api/files/activities/${activity.id}`, '_blank')}
                                  className="mt-2"
                                >
                                  <Download className="mr-1 h-3 w-3" />
                                  Arquivo
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Aba de Comissões */}
              <TabsContent value="committees" className="mt-6">
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-6 text-gray-900">Comissões</h3>
                  
                  {!committees || committees.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">
                      Este vereador não participa de nenhuma comissão.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {committees.map((committee: any) => {
                        const isActive = new Date(committee.endDate) > new Date();
                        return (
                          <div key={committee.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {committee.name}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">{committee.type}</p>
                                <div className="flex items-center mt-2 text-xs text-gray-500">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  {committee.startDate ? formatDate(committee.startDate) : 'Data não informada'} - {committee.endDate ? formatDate(committee.endDate) : 'Data não informada'}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                  Função: {committee.role}
                                </div>
                              </div>
                              <Badge className={cn(
                                "ml-4",
                                isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                              )}>
                                {isActive ? "Ativa" : "Encerrada"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Aba de Documentos */}
              <TabsContent value="documents" className="mt-6">
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-6 text-gray-900">Documentos</h3>
                  
                  {!documents || documents.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">
                      Nenhum documento encontrado para este vereador.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((doc: any) => (
                        <div key={doc.id} className="border rounded-lg p-6 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-medium text-gray-900 mb-2">
                                {doc.documentType} Nº {doc.documentNumber}
                              </h4>
                              <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                              
                              {/* Informações básicas em grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center text-sm">
                                  <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                                  <span className="text-gray-600">Data do Documento:</span>
                                  <span className="ml-2 font-medium">
                                    {doc.documentDate ? format(new Date(doc.documentDate), "dd/MM/yyyy", { locale: ptBR }) : 'Não informada'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center text-sm">
                                  <Users className="mr-2 h-4 w-4 text-gray-500" />
                                  <span className="text-gray-600">Autor:</span>
                                  <span className="ml-2 font-medium">{doc.authorType || 'Não informado'}</span>
                                </div>
                                
                                {doc.fileName && (
                                  <div className="flex items-center text-sm">
                                    <FileText className="mr-2 h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600">Arquivo:</span>
                                    <span className="ml-2 font-medium">{doc.fileName}</span>
                                  </div>
                                )}
                                
                                {doc.fileType && (
                                  <div className="flex items-center text-sm">
                                    <Activity className="mr-2 h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600">Tipo:</span>
                                    <span className="ml-2 font-medium">{doc.fileType}</span>
                                  </div>
                                )}
                                
                                {doc.activityId && (
                                  <div className="flex items-center text-sm">
                                    <ClipboardList className="mr-2 h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600">Atividade ID:</span>
                                    <span className="ml-2 font-medium">{doc.activityId}</span>
                                  </div>
                                )}
                                
                                {doc.eventId && (
                                  <div className="flex items-center text-sm">
                                    <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600">Evento ID:</span>
                                    <span className="ml-2 font-medium">{doc.eventId}</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Informações de versionamento */}
                              {doc.parentDocumentId && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                                  <span className="text-sm font-medium text-blue-700">Documento Versionado:</span>
                                  <p className="text-sm text-blue-600 mt-1">
                                    Este documento é uma versão do documento ID: {doc.parentDocumentId}
                                  </p>
                                </div>
                              )}
                              
                              {/* Datas importantes */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                                <div>
                                  <span>Criado em:</span>
                                  <span className="ml-2">
                                    {doc.createdAt ? format(new Date(doc.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Não informado'}
                                  </span>
                                </div>
                                <div>
                                  <span>Atualizado em:</span>
                                  <span className="ml-2">
                                    {doc.updatedAt ? format(new Date(doc.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Não informado'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Badges de status e ações */}
                            <div className="flex flex-col items-end space-y-2">
                              <Badge className={cn(
                                doc.status === "Vigente" ? "bg-green-100 text-green-800" : 
                                doc.status === "Revogada" ? "bg-red-100 text-red-800" : 
                                doc.status === "Alterada" ? "bg-yellow-100 text-yellow-800" :
                                doc.status === "Suspenso" ? "bg-orange-100 text-orange-800" :
                                "bg-gray-100 text-gray-800"
                              )}>
                                {doc.status}
                              </Badge>
                              
                              {doc.filePath && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(`/api/files/documents/${doc.id}`, '_blank')}
                                  className="mt-2"
                                >
                                  <Download className="mr-1 h-3 w-3" />
                                  Baixar Arquivo
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </>
  );
}