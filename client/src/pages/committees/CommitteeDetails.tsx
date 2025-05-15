import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  ClipboardListIcon, 
  PencilIcon, 
  UserIcon, 
  UsersIcon
} from 'lucide-react';

type CommitteeMember = {
  userId: string;
  committeeId: number;
  role: string;
  addedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    profileImageUrl: string | null;
    role: string;
  };
};

type Committee = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  members: CommitteeMember[];
};

export default function CommitteeDetails() {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const { data: committee, isLoading } = useQuery({
    queryKey: [`/api/committees/${id}`],
    retry: false,
  });
  
  const getCommitteeStatus = (committee: Committee) => {
    const now = new Date();
    const startDate = new Date(committee.startDate);
    const endDate = new Date(committee.endDate);
    
    if (now < startDate) {
      return <Badge variant="outline">Pendente</Badge>;
    } else if (now >= startDate && now <= endDate) {
      return <Badge variant="default" className="bg-green-600">Ativa</Badge>;
    } else {
      return <Badge variant="secondary">Encerrada</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }
  
  if (!committee) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-2xl font-bold mb-2">Comissão não encontrada</h2>
          <p className="text-muted-foreground mb-4">
            A comissão solicitada não foi encontrada.
          </p>
          <Button onClick={() => navigate('/committees')}>
            Voltar para a lista de comissões
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4 h-8 w-8 p-0" 
          onClick={() => navigate('/committees')}
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{committee.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{committee.type}</Badge>
            {getCommitteeStatus(committee)}
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2 ml-auto">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/committees/${committee.id}/members`)}
            >
              <UsersIcon className="mr-2 h-4 w-4" />
              Membros
            </Button>
            <Button 
              onClick={() => navigate(`/committees/edit/${committee.id}`)}
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardListIcon className="mr-2 h-5 w-5" />
              Detalhes da Comissão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Descrição</h3>
                <p className="mt-1">{committee.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Período de Vigência</h3>
                <div className="flex items-center gap-2 mt-1">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(committee.startDate)} - {formatDate(committee.endDate)}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Criado em</h3>
                <div className="mt-1">{formatDate(committee.createdAt)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UsersIcon className="mr-2 h-5 w-5" />
              Membros
            </CardTitle>
            <CardDescription>
              {committee.members.length} {committee.members.length === 1 ? 'membro' : 'membros'} nesta comissão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {committee.members.length === 0 ? (
                <div className="text-center py-4">
                  <UserIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Nenhum membro designado para esta comissão
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {committee.members.map((member) => (
                    <div key={member.userId} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={member.user.profileImageUrl || undefined} 
                          alt={member.user.name}
                        />
                        <AvatarFallback>
                          {member.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/users/${member.user.id}`}
                          className="font-medium text-sm hover:underline"
                        >
                          {member.user.name}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.user.email}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            {isAdmin && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate(`/committees/${committee.id}/members`)}
              >
                <UsersIcon className="mr-2 h-4 w-4" />
                Gerenciar Membros
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}