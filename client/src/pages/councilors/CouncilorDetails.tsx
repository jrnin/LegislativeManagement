import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  File, 
  ClipboardList, 
  UserRound, 
  ChevronLeft,
  Users,
  Building2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, Document, LegislativeActivity } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function CouncilorDetails() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  // Carregar dados do vereador
  const { data: councilor, isLoading: isLoadingCouncilor } = useQuery<User>({
    queryKey: [`/api/users/${id}`],
  });

  // Carregar atividades legislativas associadas ao vereador
  const { data: activities, isLoading: isLoadingActivities } = useQuery<LegislativeActivity[]>({
    queryKey: [`/api/users/${id}/activities`],
    enabled: !!id,
  });

  // Carregar documentos associados ao vereador
  const { data: documents, isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: [`/api/users/${id}/documents`],
    enabled: !!id,
  });

  // Carregar comissões associadas ao vereador 
  const { data: committees, isLoading: isLoadingCommittees } = useQuery<any[]>({
    queryKey: [`/api/users/${id}/committees`],
    enabled: !!id,
  });

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "V";
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  if (isLoadingCouncilor) {
    return (
      <div className="container py-6 max-w-7xl">
        <div className="flex flex-col space-y-8">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-[250px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-[200px] rounded-lg" />
            <Skeleton className="h-[200px] rounded-lg" />
            <Skeleton className="h-[200px] rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/councilors">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </Button>
          {isAdmin && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/users/${id}`}>
                Editar Vereador
              </Link>
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Hero section com informações do vereador */}
          <div className="w-full md:w-1/3">
            <Card className="overflow-hidden">
              <div className="h-28 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <CardContent className="-mt-14 relative">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg absolute">
                  <AvatarImage
                    src={councilor?.profileImageUrl || ""}
                    alt={councilor?.name || "Vereador"}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl">
                    {getInitials(councilor?.name || "")}
                  </AvatarFallback>
                </Avatar>
                
                <div className="pt-14 pb-4">
                  <h1 className="text-2xl font-bold">{councilor?.name}</h1>
                  <p className="text-muted-foreground">Vereador</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-none">
                      Eleito
                    </Badge>
                    <Badge variant="outline">
                      Desde {formatDate(councilor?.createdAt)}
                    </Badge>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{councilor?.email}</span>
                    </div>
                    {councilor?.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{councilor?.phone}</span>
                      </div>
                    )}
                    {councilor?.address && (
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{councilor?.address}</span>
                      </div>
                    )}
                    {councilor?.birthDate && (
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Nascimento: {formatDate(councilor?.birthDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comissões */}
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  <CardTitle>Comissões</CardTitle>
                </div>
                <CardDescription>
                  Comissões legislativas das quais o vereador participa
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCommittees ? (
                  <div className="space-y-3">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : committees && committees.length > 0 ? (
                  <div className="space-y-3">
                    {committees.map((committee) => (
                      <Link key={committee.id} href={`/committees/${committee.id}`}>
                        <div className="p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{committee.name}</h4>
                              <p className="text-sm text-muted-foreground">{committee.type}</p>
                            </div>
                            <Badge>{committee.role || "Membro"}</Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground/60" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Este vereador não participa de nenhuma comissão
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="w-full md:w-2/3">
            <Tabs defaultValue="activities">
              <TabsList className="mb-4">
                <TabsTrigger value="activities" className="flex items-center">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Atividades Legislativas
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center">
                  <File className="h-4 w-4 mr-2" />
                  Documentos
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="activities">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <ClipboardList className="h-5 w-5 mr-2 text-blue-600" />
                        <CardTitle>Atividades Legislativas</CardTitle>
                      </div>
                      {activities && activities.length > 0 && (
                        <Badge variant="outline" className="ml-2">
                          {activities.length} {activities.length === 1 ? "atividade" : "atividades"}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      Atividades legislativas apresentadas ou coautoradas pelo vereador
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingActivities ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-1/4" />
                          </div>
                        ))}
                      </div>
                    ) : activities && activities.length > 0 ? (
                      <div className="space-y-4">
                        {activities.map((activity) => (
                          <Link key={activity.id} href={`/activities/${activity.id}`}>
                            <div className="p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                              <div className="flex justify-between">
                                <h3 className="font-medium">{activity.description}</h3>
                                <Badge 
                                  className={
                                    activity.status === "approved" 
                                      ? "bg-green-100 text-green-800 hover:bg-green-200" 
                                      : activity.status === "rejected"
                                      ? "bg-red-100 text-red-800 hover:bg-red-200"
                                      : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                  }
                                >
                                  {activity.status === "approved" 
                                    ? "Aprovada" 
                                    : activity.status === "rejected"
                                    ? "Rejeitada"
                                    : "Pendente"
                                  }
                                </Badge>
                              </div>
                              <div className="flex items-center mt-2 text-sm text-muted-foreground">
                                <Building2 className="h-3.5 w-3.5 mr-1" />
                                <span>Nº {activity.activityNumber}</span>
                                <span className="mx-2">•</span>
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                <span>{formatDate(activity.activityDate)}</span>
                                <span className="mx-2">•</span>
                                <span>{activity.activityType}</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/60" />
                        <h3 className="mt-4 text-lg font-semibold">Nenhuma atividade encontrada</h3>
                        <p className="text-muted-foreground mt-2">
                          Este vereador ainda não apresentou nenhuma atividade legislativa.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <File className="h-5 w-5 mr-2 text-blue-600" />
                        <CardTitle>Documentos</CardTitle>
                      </div>
                      {documents && documents.length > 0 && (
                        <Badge variant="outline" className="ml-2">
                          {documents.length} {documents.length === 1 ? "documento" : "documentos"}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      Documentos apresentados ou relacionados ao vereador
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingDocuments ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-1/4" />
                          </div>
                        ))}
                      </div>
                    ) : documents && documents.length > 0 ? (
                      <div className="space-y-4">
                        {documents.map((document) => (
                          <Link key={document.id} href={`/documents/${document.id}`}>
                            <div className="p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                              <div className="flex justify-between">
                                <h3 className="font-medium">{document.description}</h3>
                                <Badge 
                                  className={
                                    document.status === "approved" 
                                      ? "bg-green-100 text-green-800 hover:bg-green-200" 
                                      : document.status === "rejected"
                                      ? "bg-red-100 text-red-800 hover:bg-red-200"
                                      : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                  }
                                >
                                  {document.status === "approved" 
                                    ? "Aprovado" 
                                    : document.status === "rejected"
                                    ? "Rejeitado"
                                    : "Pendente"
                                  }
                                </Badge>
                              </div>
                              <div className="flex items-center mt-2 text-sm text-muted-foreground">
                                <span>Documento Nº {document.documentNumber}</span>
                                <span className="mx-2">•</span>
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                <span>{formatDate(document.createdAt)}</span>
                                <span className="mx-2">•</span>
                                <span>{document.documentType}</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <File className="h-12 w-12 mx-auto text-muted-foreground/60" />
                        <h3 className="mt-4 text-lg font-semibold">Nenhum documento encontrado</h3>
                        <p className="text-muted-foreground mt-2">
                          Este vereador ainda não possui documentos vinculados.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}