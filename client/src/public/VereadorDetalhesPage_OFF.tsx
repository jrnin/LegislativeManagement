import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  Users, 
  Award,
  MapPin,
  ArrowLeft,
  ExternalLink,
  Activity,
  MessageSquare,
  Share2,
  Download
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { getInitials } from '@/lib/utils';

export default function VereadorDetalhesPage() {
  const { id } = useParams();
  const [_, setLocation] = useLocation();

  // Buscar vereador específico
  const { data: councilor, isLoading: isCouncilorLoading } = useQuery({
    queryKey: [`/api/public/councilors/${id}`],
    enabled: !!id,
  });

  // Buscar documentos relacionados ao vereador
  const { data: documents = [], isLoading: isDocumentsLoading } = useQuery({
    queryKey: [`/api/public/councilors/${id}/documents`],
    enabled: !!id,
  });

  // Buscar atividades legislativas do vereador
  const { data: activities = [], isLoading: isActivitiesLoading } = useQuery({
    queryKey: [`/api/public/councilors/${id}/activities`],
    enabled: !!id,
  });

  // Buscar comissões do vereador
  const { data: commissions = [], isLoading: isCommissionsLoading } = useQuery({
    queryKey: [`/api/public/councilors/${id}/committees`],
    enabled: !!id,
  });

  // Formatador de datas
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Loading state
  if (isCouncilorLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando informações do vereador...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!councilor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vereador não encontrado</h1>
          <Button onClick={() => setLocation('/vereadores')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Vereadores
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{councilor.name} | Vereadores | Sistema Legislativo</title>
        <meta name="description" content={`Conheça ${councilor.name}, vereador da Câmara Municipal. Veja suas atividades legislativas, documentos e informações de contato.`} />
      </Helmet>

      {/* Header com foto e informações básicas */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        
        {/* Conteúdo do header */}
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                <AvatarImage 
                  src={councilor.profileImageUrl || ""} 
                  alt={councilor.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-3xl bg-white text-blue-600">
                  {getInitials(councilor.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Informações principais */}
            <div className="flex-1 text-center md:text-left text-white">
              <h1 className="text-4xl font-bold mb-4">{councilor.name}</h1>
              <div className="space-y-2 text-lg">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-sm">Cargo:</span>
                  <span className="font-medium">{councilor.position || 'Vereador'}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-sm">Partido:</span>
                  <span className="font-medium">{councilor.party || 'Não informado'}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-sm">Email:</span>
                  <span className="font-medium">{councilor.email || 'Não informado'}</span>
                  {councilor.phone && (
                    <span className="text-xs text-white/70">({councilor.phone})</span>
                  )}
                </div>
              </div>
            </div>

            {/* Botão de voltar */}
            <div className="flex-shrink-0">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/vereadores')}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna esquerda - Informações pessoais */}
          <div className="space-y-6">
            <Card className="shadow-lg border-l-4 border-l-green-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <User className="h-5 w-5" />
                  Informações de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">E-mail</p>
                    <a href={`mailto:${councilor.email}`} className="text-green-700 hover:underline font-medium">
                      {councilor.email}
                    </a>
                  </div>
                </div>
                
                {councilor.phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Telefone</p>
                      <a href={`tel:${councilor.phone}`} className="text-green-700 hover:underline font-medium">
                        {councilor.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {councilor.address && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Gabinete</p>
                      <p className="text-gray-900 font-medium">{councilor.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações adicionais */}
            {(councilor.birthDate || councilor.profession || councilor.education) && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <Award className="h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {councilor.birthDate && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Data de Nascimento</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{formatDate(councilor.birthDate)}</span>
                      </div>
                    </div>
                  )}
                  
                  {councilor.profession && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Profissão</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Award className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{councilor.profession}</span>
                      </div>
                    </div>
                  )}
                  
                  {councilor.education && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Formação</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Award className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{councilor.education}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Biografia */}
            {councilor.biography && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <MessageSquare className="h-5 w-5" />
                    Biografia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{councilor.biography}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna direita - Atividades e documentos */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="activities" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="activities" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Atividades Legislativas
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documentos
                </TabsTrigger>
                <TabsTrigger value="committees" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Comissões
                </TabsTrigger>
              </TabsList>

              {/* Atividades Legislativas */}
              <TabsContent value="activities" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Atividades Legislativas</CardTitle>
                    <CardDescription>
                      Todas as atividades legislativas do vereador registradas no sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isActivitiesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Carregando atividades...</p>
                      </div>
                    ) : activities.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activities.map((activity: any) => (
                            <TableRow key={activity.id}>
                              <TableCell>
                                <Badge variant="outline">{activity.type}</Badge>
                              </TableCell>
                              <TableCell>{activity.description}</TableCell>
                              <TableCell>
                                {activity.date ? formatDate(activity.date) : 'Data não informada'}
                              </TableCell>
                              <TableCell>
                                {(activity.filePath || activity.file) && (
                                  <a 
                                    href={`/api/public/activities/${activity.id}/download`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button variant="outline" size="sm">
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </Button>
                                  </a>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Nenhuma atividade legislativa encontrada</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documentos */}
              <TabsContent value="documents" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Documentos</CardTitle>
                    <CardDescription>
                      Documentos relacionados ao vereador
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isDocumentsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Carregando documentos...</p>
                      </div>
                    ) : documents.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {documents.map((document: any) => (
                            <TableRow key={document.id}>
                              <TableCell>
                                <Badge variant="outline">{document.type || document.documentType}</Badge>
                              </TableCell>
                              <TableCell>{document.description}</TableCell>
                              <TableCell>
                                {(document.date || document.documentDate) ? 
                                  formatDate(document.date || document.documentDate) : 
                                  'Data não informada'
                                }
                              </TableCell>
                              <TableCell>
                                {(document.filePath || document.file) && (
                                  <a 
                                    href={`/api/public/documents/${document.id}/download`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button variant="outline" size="sm">
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </Button>
                                  </a>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Nenhum documento encontrado</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Comissões */}
              <TabsContent value="committees" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Comissões</CardTitle>
                    <CardDescription>
                      Comissões das quais o vereador participa
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isCommissionsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Carregando comissões...</p>
                      </div>
                    ) : commissions.length > 0 ? (
                      <div className="space-y-4">
                        {commissions.map((commission: any) => (
                          <div key={commission.id} className="p-4 border rounded-lg bg-gray-50">
                            <h3 className="font-semibold text-gray-900">{commission.name}</h3>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="secondary">{commission.role || 'Membro'}</Badge>
                              {commission.type && (
                                <Badge variant="outline">{commission.type}</Badge>
                              )}
                            </div>
                            {commission.period && (
                              <p className="text-sm text-gray-600 mt-2">Período: {commission.period}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Nenhuma comissão encontrada</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}