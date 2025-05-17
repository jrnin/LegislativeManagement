import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Calendar, 
  FileText, 
  Activity, 
  ChevronLeft, 
  User2, 
  Building, 
  GraduationCap, 
  Home, 
  Mail, 
  MapPin, 
  Phone, 
  Briefcase, 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Share, 
  Users 
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Interfaces para os modelos baseados no banco de dados
interface Councilor {
  id: string;
  name: string;
  profileImageUrl?: string;
  email: string;
  role: string;
  occupation?: string;
  education?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  birthDate?: string;
  activities: Activity[];
  documents: Document[];
  committees: Committee[];
}

interface Activity {
  id: number;
  activityNumber: number;
  activityDate: string;
  description: string;
  activityType: string;
}

interface Document {
  id: number;
  documentNumber: number;
  documentType: string;
  documentDate: string;
  description: string;
  status: string;
}

interface Committee {
  id: number;
  name: string;
  type: string;
  role: string;
  startDate: string;
  endDate: string;
}

// Componente de card de atividade legislativa
const ActivityCard = ({ activity }: { activity: Activity }) => (
  <Card className="mb-4">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-md flex items-center">
            <Activity className="h-4 w-4 mr-2 text-blue-600" />
            {activity.activityType} Nº {activity.activityNumber}
          </CardTitle>
          <CardDescription>
            {new Date(activity.activityDate).toLocaleDateString('pt-BR')}
          </CardDescription>
        </div>
        <Badge variant="outline">{activity.activityType}</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-gray-700">{activity.description}</p>
    </CardContent>
    <CardFooter className="pt-0 border-t border-gray-100">
      <Link href={`/public/atividades/${activity.id}`}>
        <a className="text-xs text-blue-600 hover:underline flex items-center">
          Ver detalhes
          <ChevronLeft className="h-3 w-3 ml-1 rotate-180" />
        </a>
      </Link>
    </CardFooter>
  </Card>
);

// Componente de card de documento
const DocumentCard = ({ document }: { document: Document }) => (
  <Card className="mb-4">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-md flex items-center">
            <FileText className="h-4 w-4 mr-2 text-blue-600" />
            {document.documentType} Nº {document.documentNumber}
          </CardTitle>
          <CardDescription>
            {new Date(document.documentDate).toLocaleDateString('pt-BR')}
          </CardDescription>
        </div>
        <Badge
          variant={document.status === 'Vigente' ? 'default' : 'outline'}
          className={document.status === 'Vigente' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
        >
          {document.status}
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-gray-700">{document.description}</p>
    </CardContent>
    <CardFooter className="pt-0 border-t border-gray-100">
      <Link href={`/public/documentos/${document.id}`}>
        <a className="text-xs text-blue-600 hover:underline flex items-center">
          Ver detalhes
          <ChevronLeft className="h-3 w-3 ml-1 rotate-180" />
        </a>
      </Link>
    </CardFooter>
  </Card>
);

// Componente de card de comissão
const CommitteeCard = ({ committee }: { committee: Committee }) => (
  <Card className="mb-4">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-md flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-blue-600" />
            {committee.name}
          </CardTitle>
          <CardDescription>
            {new Date(committee.startDate).toLocaleDateString('pt-BR')} a {new Date(committee.endDate).toLocaleDateString('pt-BR')}
          </CardDescription>
        </div>
        <Badge
          variant={committee.role === 'presidente' ? 'default' : 'outline'}
          className={committee.role === 'presidente' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : ''}
        >
          {committee.role === 'presidente' ? 'Presidente' : committee.role === 'secretário' ? 'Secretário' : 'Membro'}
        </Badge>
      </div>
    </CardHeader>
    <CardFooter className="pt-2 border-t border-gray-100">
      <Link href={`/public/comissoes/${committee.id}`}>
        <a className="text-xs text-blue-600 hover:underline flex items-center">
          Ver detalhes
          <ChevronLeft className="h-3 w-3 ml-1 rotate-180" />
        </a>
      </Link>
    </CardFooter>
  </Card>
);

// Componente principal da página de detalhes do vereador
export default function VereadorDetailPage() {
  // Obter o ID do vereador da URL
  const { id } = useParams();
  
  // Buscar detalhes do vereador da API
  const { data: councilor, isLoading, error } = useQuery<Councilor>({
    queryKey: [`/api/public/councilors/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <Loader2 className="h-8 w-8 mx-auto text-blue-600 animate-spin" />
        <p className="mt-4 text-gray-500">Carregando informações do vereador...</p>
      </div>
    );
  }

  if (error || !councilor) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <p className="text-red-500 mb-4">Ocorreu um erro ao carregar as informações do vereador.</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mx-auto">
          Tentar novamente
        </Button>
        <div className="mt-6">
          <Link href="/public/vereadores">
            <a className="text-blue-600 hover:underline inline-flex items-center">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar para lista de vereadores
            </a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Cabeçalho com fundo azul */}
      <header className="bg-blue-600 text-white w-full py-6 px-4">
        <div className="container mx-auto">
          <Link href="/public/vereadores">
            <a className="text-white hover:text-blue-100 inline-flex items-center mb-6">
              <ChevronLeft className="h-5 w-5 mr-1" />
              Perfil de Vereador
            </a>
          </Link>
          
          <div className="flex flex-col md:flex-row items-center md:items-start mt-2">
            <div className="relative flex-shrink-0 mb-4 md:mb-0">
              <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-white shadow-lg">
                <AvatarImage src={councilor.profileImageUrl} />
                <AvatarFallback className="bg-blue-800 text-white text-2xl">{getInitials(councilor.name)}</AvatarFallback>
              </Avatar>
            </div>
            
            <div className="md:ml-6 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold">{councilor.name}</h1>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                <Badge className="bg-blue-700 hover:bg-blue-800 text-white">
                  {councilor.role === 'councilor' ? 'Vereador' : 'Administrador'}
                </Badge>
                
                {councilor.occupation && (
                  <Badge className="bg-blue-700 hover:bg-blue-800 text-white">
                    {councilor.occupation}
                  </Badge>
                )}
                
                <Badge className="bg-white text-blue-700">Mandato 2021-2024</Badge>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-5">
                <Button variant="outline" className="bg-white text-blue-600 hover:bg-blue-50 border-white">
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar e-mail
                </Button>
                
                <Button variant="outline" className="bg-white text-blue-600 hover:bg-blue-50 border-white">
                  <User2 className="mr-2 h-4 w-4" />
                  Contatar
                </Button>
                
                <Button variant="outline" className="bg-white text-blue-600 hover:bg-blue-50 border-white">
                  <FileText className="mr-2 h-4 w-4" />
                  Compartilhar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Conteúdo principal */}
      <main className="flex-grow bg-gray-50 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Coluna de informações pessoais */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <User2 className="mr-2 h-5 w-5 text-blue-500" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {councilor.email && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">E-mail</p>
                        <div className="flex items-center mt-1">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <a href={`mailto:${councilor.email}`} className="text-blue-600 hover:underline">
                            {councilor.email}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Telefone</p>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-gray-700">(XX) XXXX-XXXX</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Gabinete</p>
                      <div className="flex items-center mt-1">
                        <Building className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-gray-700">Gabinete 123, Câmara Municipal</span>
                      </div>
                    </div>
                    
                    {councilor.birthDate && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Data de Nascimento</p>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-700">
                            {new Date(councilor.birthDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {councilor.occupation && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Profissão</p>
                        <div className="flex items-center mt-1">
                          <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-700">{councilor.occupation}</span>
                        </div>
                      </div>
                    )}
                    
                    {councilor.education && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Formação</p>
                        <div className="flex items-center mt-1">
                          <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-700">{councilor.education}</span>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Redes Sociais</p>
                      <div className="flex items-center mt-2 space-x-3">
                        <a href="#" className="text-blue-600 hover:text-blue-800">
                          <Facebook className="h-5 w-5" />
                        </a>
                        <a href="#" className="text-pink-600 hover:text-pink-800">
                          <Instagram className="h-5 w-5" />
                        </a>
                        <a href="#" className="text-blue-400 hover:text-blue-600">
                          <Twitter className="h-5 w-5" />
                        </a>
                        <a href="#" className="text-blue-700 hover:text-blue-900">
                          <Linkedin className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-blue-500" />
                      Biografia
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-600 text-sm">
                      {councilor.name} é formado em Direito pela Universidade Federal e atua como 
                      vereador desde 2021. Durante seu mandato, tem focado em projetos relacionados à 
                      educação, saúde e transparência pública. É autor de diversos projetos de lei 
                      que beneficiaram diretamente a população local.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Conteúdo principal - Área de abas */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="activities" className="w-full">
                <div className="bg-white rounded-lg shadow-sm mb-5">
                  <TabsList className="w-full justify-start border-b overflow-x-auto p-0 h-auto">
                    <TabsTrigger 
                      value="activities" 
                      className="flex items-center data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-5 py-3"
                    >
                      <Activity className="mr-2 h-4 w-4" />
                      Atividades
                    </TabsTrigger>
                    <TabsTrigger 
                      value="documents" 
                      className="flex items-center data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-5 py-3"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Documentos
                    </TabsTrigger>
                    <TabsTrigger 
                      value="committees" 
                      className="flex items-center data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-5 py-3"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Comissões
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="activities" className="mt-0">
                  <Card>
                    <CardHeader className="border-b pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl">Atividades Legislativas</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          Projetos de lei, indicações, requerimentos e outras atividades
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                      {councilor.activities && councilor.activities.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {councilor.activities.map(activity => (
                                <tr key={activity.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-4 text-sm">{activity.activityType}</td>
                                  <td className="px-4 py-4 text-sm">{activity.activityNumber}/2023</td>
                                  <td className="px-4 py-4 text-sm">{new Date(activity.activityDate).toLocaleDateString('pt-BR')}</td>
                                  <td className="px-4 py-4 text-sm">{activity.description}</td>
                                  <td className="px-4 py-4 text-sm text-right">
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Aprovado</Badge>
                                  </td>
                                </tr>
                              ))}
                              
                              {/* Exemplos para visualização quando não há dados */}
                              {councilor.activities.length === 0 && (
                                <>
                                  <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-4 text-sm">Projeto de Lei</td>
                                    <td className="px-4 py-4 text-sm">PL 123/2023</td>
                                    <td className="px-4 py-4 text-sm">10 de maio de 2023</td>
                                    <td className="px-4 py-4 text-sm">Instituir o programa de coleta seletiva nas escolas municipais</td>
                                    <td className="px-4 py-4 text-sm text-right">
                                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Aprovado</Badge>
                                    </td>
                                  </tr>
                                  <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-4 text-sm">Indicação</td>
                                    <td className="px-4 py-4 text-sm">IND 45/2023</td>
                                    <td className="px-4 py-4 text-sm">22 de abril de 2023</td>
                                    <td className="px-4 py-4 text-sm">Sugere a instalação de semáforo na Avenida Principal</td>
                                    <td className="px-4 py-4 text-sm text-right">
                                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Encaminhado</Badge>
                                    </td>
                                  </tr>
                                  <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-4 text-sm">Requerimento</td>
                                    <td className="px-4 py-4 text-sm">REQ 89/2023</td>
                                    <td className="px-4 py-4 text-sm">15 de março de 2023</td>
                                    <td className="px-4 py-4 text-sm">Solicita informações sobre a obra da UBS do Bairro Central</td>
                                    <td className="px-4 py-4 text-sm text-right">
                                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Respondido</Badge>
                                    </td>
                                  </tr>
                                </>
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Este vereador ainda não possui atividades legislativas registradas.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <Card className="text-center p-6">
                      <div className="text-4xl font-bold text-blue-600">2</div>
                      <p className="text-gray-600 mt-2">Projetos de Lei</p>
                    </Card>
                    <Card className="text-center p-6">
                      <div className="text-4xl font-bold text-blue-600">3</div>
                      <p className="text-gray-600 mt-2">Proposições</p>
                    </Card>
                    <Card className="text-center p-6">
                      <div className="text-4xl font-bold text-blue-600">3</div>
                      <p className="text-gray-600 mt-2">Comissões</p>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="documents" className="mt-0">
                  <Card>
                    <CardHeader className="border-b pb-3">
                      <CardTitle className="text-xl">Documentos</CardTitle>
                    </CardHeader>
                    
                    <CardContent>
                      {councilor.documents && councilor.documents.length > 0 ? (
                        <div className="space-y-4 py-4">
                          {councilor.documents.map(document => (
                            <DocumentCard key={document.id} document={document} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Nenhum documento encontrado para este vereador.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="committees" className="mt-0">
                  <Card>
                    <CardHeader className="border-b pb-3">
                      <CardTitle className="text-xl">Comissões</CardTitle>
                    </CardHeader>
                    
                    <CardContent>
                      {councilor.committees && councilor.committees.length > 0 ? (
                        <div className="space-y-4 py-4">
                          {councilor.committees.map(committee => (
                            <CommitteeCard key={committee.id} committee={committee} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Este vereador não participa de nenhuma comissão atualmente.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}