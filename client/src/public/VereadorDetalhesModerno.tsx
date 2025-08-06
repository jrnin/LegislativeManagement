import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Mail, Phone, MapPin, Calendar, GraduationCap, Briefcase, Award, FileText, Users, Building2, Download, ExternalLink } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Helmet } from 'react-helmet';
import texturaUrl from '@/assets/textura.jpg';

interface Councilor {
  id: string;
  name: string;
  slug?: string;
  profileImageUrl?: string;
  email: string;
  role: string;
  occupation?: string;
  education?: string;
  partido?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  active?: boolean;
}

interface Document {
  id: number;
  title: string;
  type: string;
  date: string;
  status: string;
}

interface Activity {
  id: number;
  title: string;
  type: string;
  date: string;
  description: string;
}

export default function VereadorDetalhesModerno() {
  const { id } = useParams<{ id: string }>();

  // Buscar dados do vereador
  const { data: councilor, isLoading, error } = useQuery<Councilor>({
    queryKey: [`/api/public/councilors/${id}`],
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !councilor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vereador não encontrado</h1>
          <Link href="/vereadores">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para lista de vereadores
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{councilor.name} | Vereadores | Sistema Legislativo</title>
        <meta name="description" content={`Perfil do(a) vereador(a) ${councilor.name}. Conheça sua trajetória, proposições e trabalho em prol da cidade.`} />
      </Helmet>

      {/* Hero Section com textura geométrica */}
      <div className="relative overflow-hidden">
        {/* Background com textura */}
        <div 
          className="absolute inset-0 opacity-90"
          style={{
            backgroundImage: `url(${texturaUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-800/90 via-green-700/85 to-green-900/90" />
        
        {/* Formas geométricas decorativas */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute top-20 right-20 w-24 h-24 bg-white/5 rounded-lg rotate-45" />
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-white/10 rounded-full" />
          <div className="absolute bottom-10 right-1/3 w-20 h-20 bg-white/5 rounded-lg rotate-12" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="rounded-xl w-48 h-48 border-1 border-white/30 shadow-2xl">
                <AvatarImage src={councilor.profileImageUrl} />
                <AvatarFallback className="bg-green-600 text-white text-2xl font-bold">
                  {getInitials(councilor.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Informações básicas ao lado da imagem */}
            <div className="flex-1 text-center lg:text-left">
              <div className="space-y-3">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1">{councilor.name}</h1>
                  
                </div>
                
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  {councilor.partido && (
                    <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                      {councilor.partido}
                    </Badge>
                  )}
                  
                  {councilor.occupation && (
                    <Badge className="bg-white/15 text-white border-white/20 px-3 py-1">
                      {councilor.occupation}
                    </Badge>
                  )}
                  

                </div>
              </div>
            </div>

            {/* Cards de estatísticas */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-white/20 backdrop-blur-sm border-white/30 text-center">
                <CardContent className="p-4">
                  <FileText className="h-6 w-6 text-white mx-auto mb-1" />
                  <div className="text-xl font-bold text-white">{documents.length}</div>
                  <div className="text-xs text-green-100">Documentos</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/20 backdrop-blur-sm border-white/30 text-center">
                <CardContent className="p-4">
                  <Award className="h-6 w-6 text-white mx-auto mb-1" />
                  <div className="text-xl font-bold text-white">{activities.length}</div>
                  <div className="text-xs text-green-100">Atividades</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/20 backdrop-blur-sm border-white/30 text-center">
                <CardContent className="p-4">
                  <Users className="h-6 w-6 text-white mx-auto mb-1" />
                  <div className="text-xl font-bold text-white">{commissions.length}</div>
                  <div className="text-xs text-green-100">Comissões</div>
                </CardContent>
              </Card>
              <Link href="/vereadores">
                <Button variant="ghost" className="text-white hover:bg-white/20 border border-white/30">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              
            </div>
          </div>
        </div>

        {/* Botão voltar 
        <div className="absolute top-2 right-8 z-20">
          <Link href="/vereadores">
            <Button variant="ghost" className="text-white hover:bg-white/20 border border-white/30">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>  */}


        
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna esquerda - Informações pessoais */}
          <div className="space-y-6">
            <Card className="shadow-lg border-l-4 border-l-green-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Building2 className="h-5 w-5" />
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
                
                {councilor.partido && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Partido</p>
                      <p className="text-gray-900 font-medium">{councilor.partido}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações pessoais */}
            <Card className="shadow-lg border-l-4 border-l-blue-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <GraduationCap className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* {councilor.birthDate && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Data de Nascimento</p>
                      <p className="text-gray-900 font-medium">
                        {new Date(councilor.birthDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )} */}
                
                {councilor.education && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Formação</p>
                      <p className="text-gray-900 font-medium">{councilor.education}</p>
                    </div>
                  </div>
                )}
                
                {councilor.occupation && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Ocupação</p>
                      <p className="text-gray-900 font-medium">{councilor.occupation}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna direita - Documentos e Atividades */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Documentos */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <FileText className="h-5 w-5 text-green-600" />
                  Documentos Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.slice(0, 5).map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{doc.description || doc.title}</h4>
                          <p className="text-sm text-gray-600">
                            {doc.documentType || doc.type} • {
                              (doc.documentDate || doc.date) ? 
                              new Date(doc.documentDate || doc.date).toLocaleDateString('pt-BR') : 
                              'Data não informada'
                            }
                          </p>
                        </div>
                        {(doc.filePath || doc.file) && (
                          <a 
                            href={`/api/public/documents/${doc.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4"
                          >
                            <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">Nenhum documento encontrado</p>
                )}
              </CardContent>
            </Card>

            {/* Atividades */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Award className="h-5 w-5 text-green-600" />
                  Atividades Legislativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isActivitiesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Carregando atividades...</p>
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.slice(0, 5).map((activity: any) => (
                      <div key={activity.id} className="border-l-4 border-green-500 pl-4 py-3 flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{activity.description || activity.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {activity.type} • {
                              activity.date ? 
                              new Date(activity.date).toLocaleDateString('pt-BR') : 
                              'Data não informada'
                            }
                          </p>
                        </div>
                        {(activity.filePath || activity.file) && (
                          <a 
                            href={`/api/public/activities/${activity.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4"
                          >
                            <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">Nenhuma atividade encontrada</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}