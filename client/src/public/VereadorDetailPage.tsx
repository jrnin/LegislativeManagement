import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Calendar, FileText, Activity, ChevronLeft, User2, Building, GraduationCap, Home, Mail, MapPin } from 'lucide-react';
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
    <div className="container mx-auto py-12 px-4">
      <div className="mb-6">
        <Link href="/public/vereadores">
          <a className="text-blue-600 hover:underline inline-flex items-center mb-8">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar para lista de vereadores
          </a>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna de perfil */}
        <div>
          <Card>
            <CardHeader className="text-center pb-2 pt-8">
              <div className="flex justify-center mb-6">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                  <AvatarImage src={councilor.profileImageUrl} />
                  <AvatarFallback className="bg-blue-700 text-white text-2xl">{getInitials(councilor.name)}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl">{councilor.name}</CardTitle>
              <CardDescription className="text-md">{councilor.occupation || 'Vereador'}</CardDescription>
              
              <div className="mt-4">
                <Badge className="mx-auto">{councilor.education || 'Legislatura Atual'}</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="px-6 py-4">
              <div className="space-y-4 mt-4">
                <div className="flex items-center text-sm">
                  <User2 className="h-4 w-4 mr-3 text-gray-400" />
                  <span className="text-gray-700">{councilor.role === 'councilor' ? 'Vereador' : 'Administrador'}</span>
                </div>
                
                {councilor.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-3 text-gray-400" />
                    <a href={`mailto:${councilor.email}`} className="text-blue-600 hover:underline">{councilor.email}</a>
                  </div>
                )}
                
                {councilor.occupation && (
                  <div className="flex items-center text-sm">
                    <Building className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-700">{councilor.occupation}</span>
                  </div>
                )}
                
                {councilor.education && (
                  <div className="flex items-center text-sm">
                    <GraduationCap className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-700">{councilor.education}</span>
                  </div>
                )}
                
                {councilor.address && (
                  <div className="flex items-start text-sm">
                    <Home className="h-4 w-4 mr-3 mt-1 text-gray-400" />
                    <span className="text-gray-700">{councilor.address}, {councilor.neighborhood}</span>
                  </div>
                )}
                
                {councilor.city && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-700">{councilor.city}, {councilor.state}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Abas de conteúdo */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="activities" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="activities">Atividades</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="committees">Comissões</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activities">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Activity className="mr-2 h-5 w-5 text-blue-600" />
                Atividades Legislativas
              </h2>
              
              {councilor.activities && councilor.activities.length > 0 ? (
                <div className="space-y-4">
                  {councilor.activities.map(activity => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Nenhuma atividade legislativa encontrada.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="documents">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                Documentos
              </h2>
              
              {councilor.documents && councilor.documents.length > 0 ? (
                <div className="space-y-4">
                  {councilor.documents.map(document => (
                    <DocumentCard key={document.id} document={document} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Nenhum documento encontrado.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="committees">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                Comissões
              </h2>
              
              {councilor.committees && councilor.committees.length > 0 ? (
                <div className="space-y-4">
                  {councilor.committees.map(committee => (
                    <CommitteeCard key={committee.id} committee={committee} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Este vereador não faz parte de nenhuma comissão atualmente.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}