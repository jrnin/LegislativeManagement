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
  filePath?: string;
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

  const isLoading = isCouncilorLoading || isActivitiesLoading || isDocumentsLoading || isCommitteesLoading;

  return (
    <>
      <Helmet>
        <title>{councilor?.name ? `${councilor.name} | Vereadores` : 'Detalhes do Vereador'} | Sistema Legislativo</title>
        <meta name="description" content="Detalhes do vereador, incluindo informações de contato, atividades legislativas e comissões." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header com informações do vereador */}
        <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative max-w-6xl mx-auto p-6">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="sm" onClick={handleBack} className="bg-white/90 hover:bg-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30 ml-auto">
                LOGIN AS USER
              </Button>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-white/20 rounded-2xl">
                  <AvatarImage src={councilor?.profileImageUrl || undefined} alt={councilor?.name} className="rounded-2xl" />
                  <AvatarFallback className="text-2xl bg-white/10 text-white rounded-2xl">{councilor?.name ? getInitials(councilor.name) : "VR"}</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-1">{councilor?.name}</h1>
                <div className="space-y-1 text-white/90">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Role:</span>
                    <span className="font-medium">{councilor?.position || 'Vereador'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Email:</span>
                    <span className="font-medium">{councilor?.email || 'Não informado'}</span>
                    <span className="text-xs text-white/70">({councilor?.phone ? formatPhone(councilor.phone) : 'Sem telefone'})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Status:</span>
                    <Badge className={cn(
                      "text-xs",
                      councilor?.active ? "bg-green-500/20 text-green-100 border-green-300" : "bg-gray-500/20 text-gray-100 border-gray-300"
                    )}>
                      {councilor?.active ? "Ativo" : "Inativo"}
                    </Badge>
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
              <TabsList className="grid w-full grid-cols-6 bg-white border rounded-lg h-12">
                <TabsTrigger value="info" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                  Basic user info
                </TabsTrigger>
                <TabsTrigger value="ecommerce" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                  E-Commerce
                </TabsTrigger>
                <TabsTrigger value="activities" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                  Activity logs
                </TabsTrigger>
                <TabsTrigger value="tickets" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                  Tickets
                </TabsTrigger>
                <TabsTrigger value="affiliate" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                  Affiliate
                </TabsTrigger>
                <TabsTrigger value="documents" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                  Documentos
                </TabsTrigger>
              </TabsList>

              {/* Aba de Informações Básicas */}
              <TabsContent value="info" className="mt-6">
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-6 text-gray-900">INFO</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 w-32">First name</span>
                      <span className="text-sm font-medium">:</span>
                      <span className="text-sm text-gray-900 ml-4">{councilor?.name?.split(' ')[0] || 'Não informado'}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 w-32">Last name</span>
                      <span className="text-sm font-medium">:</span>
                      <span className="text-sm text-gray-900 ml-4">{councilor?.name?.split(' ').slice(1).join(' ') || 'Não informado'}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 w-32">Email</span>
                      <span className="text-sm font-medium">:</span>
                      <span className="text-sm text-gray-900 ml-4">{councilor?.email || 'Não informado'}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 w-32">Phone number</span>
                      <span className="text-sm font-medium">:</span>
                      <span className="text-sm text-gray-900 ml-4">{councilor?.phone ? formatPhone(councilor.phone) : 'Não informado'}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 w-32">Default address</span>
                      <span className="text-sm font-medium">:</span>
                      <span className="text-sm text-gray-900 ml-4">{councilor?.address || 'Não informado'}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 w-32">User name</span>
                      <span className="text-sm font-medium">:</span>
                      <span className="text-sm text-gray-900 ml-4">{councilor?.name || 'Não informado'}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 w-32">Password</span>
                      <span className="text-sm font-medium">:</span>
                      <span className="text-sm text-gray-900 ml-4">••••••••••</span>
                      <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0">
                        ✏️
                      </Button>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 w-32">Role</span>
                      <span className="text-sm font-medium">:</span>
                      <span className="text-sm text-gray-900 ml-4">{councilor?.position || 'Vereador'}</span>
                    </div>
                  </div>

                  {/* Seção de endereços */}
                  <div className="mt-8">
                    <h4 className="text-base font-semibold mb-4 text-gray-900">Shipping address</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Endereço Principal</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            ✏️
                          </Button>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>Street address: {councilor?.address || 'Não informado'}</div>
                          <div>City: Cidade não informada</div>
                          <div>State: Estado não informado</div>
                          <div>Zip: CEP não informado</div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Endereço Alternativo</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            ✏️
                          </Button>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>Street address: Não informado</div>
                          <div>City: Não informado</div>
                          <div>State: Não informado</div>
                          <div>Zip: Não informado</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8">
                        <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                          <span className="text-2xl mr-2">+</span>
                          Adicionar Endereço
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Aba E-Commerce (placeholder) */}
              <TabsContent value="ecommerce" className="mt-6">
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-6 text-gray-900">E-Commerce</h3>
                  <p className="text-gray-500">Funcionalidade em desenvolvimento.</p>
                </div>
              </TabsContent>

              {/* Aba de Atividades Legislativas */}
              <TabsContent value="activities" className="mt-6">
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-6 text-gray-900">Activity Logs</h3>
                  
                  {!activities || activities.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">
                      Nenhuma atividade legislativa encontrada para este vereador.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity: any) => (
                        <div key={activity.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {activity.activityType} Nº {activity.activityNumber}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                              <div className="flex items-center mt-2 text-xs text-gray-500">
                                <Calendar className="mr-1 h-3 w-3" />
                                {activity.activityDate ? formatDate(activity.activityDate) : 'Data não informada'}
                              </div>
                            </div>
                            {activity.status && (
                              <Badge className={cn(
                                "ml-4",
                                activity.status === "Aprovado" ? "bg-green-100 text-green-800" : 
                                activity.status === "Em análise" ? "bg-yellow-100 text-yellow-800" : 
                                "bg-gray-100 text-gray-800"
                              )}>
                                {activity.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Aba Tickets (placeholder) */}
              <TabsContent value="tickets" className="mt-6">
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-6 text-gray-900">Tickets</h3>
                  <p className="text-gray-500">Funcionalidade em desenvolvimento.</p>
                </div>
              </TabsContent>

              {/* Aba Affiliate (placeholder) */}
              <TabsContent value="affiliate" className="mt-6">
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-6 text-gray-900">Affiliate</h3>
                  <p className="text-gray-500">Funcionalidade em desenvolvimento.</p>
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
                        <div key={doc.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {doc.documentType} Nº {doc.documentNumber}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                              <div className="flex items-center mt-2 text-xs text-gray-500">
                                <Calendar className="mr-1 h-3 w-3" />
                                {doc.documentDate ? formatDate(doc.documentDate) : 'Data não informada'}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              {doc.status && (
                                <Badge className={cn(
                                  doc.status === "Vigente" ? "bg-green-100 text-green-800" : 
                                  doc.status === "Revogada" ? "bg-red-100 text-red-800" : 
                                  "bg-gray-100 text-gray-800"
                                )}>
                                  {doc.status}
                                </Badge>
                              )}
                              {doc.filePath && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(`/api/files/documents/${doc.id}`, '_blank')}
                                >
                                  <Download className="mr-1 h-3 w-3" />
                                  Baixar
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