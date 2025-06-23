import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Calendar, 
  FileText, 
  ArrowLeft, 
  Mail, 
  Phone,
  MapPin,
  User,
  Clock
} from "lucide-react";
import { Link } from "wouter";

interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  profileImageUrl?: string;
  partido?: string;
  occupation?: string;
  addedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profileImageUrl?: string;
    partido?: string;
    occupation?: string;
  };
}

interface Committee {
  id: number;
  name: string;
  description: string;
  status: string;
  type: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  members: CommitteeMember[];
}

export default function ComissaoDetalhePage() {
  const [match, params] = useRoute("/comissoes/:id");
  const committeeId = params?.id;

  const { data: committees, isLoading, error } = useQuery({
    queryKey: ['/api/public/committees'],
    queryFn: async () => {
      const response = await fetch('/api/public/committees');
      if (!response.ok) {
        throw new Error('Falha ao carregar comissões');
      }
      return response.json();
    }
  });

  const committee = committees?.find((c: Committee) => c.id.toString() === committeeId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <span className="mt-3 text-gray-600 block">Carregando detalhes da comissão...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !committee) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800">
                {error ? 'Erro ao carregar os dados.' : 'Comissão não encontrada.'}
              </p>
              <Link href="/comissoes">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar às Comissões
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getRoleOrder = (role: string) => {
    const order: { [key: string]: number } = {
      'Presidente': 1,
      'Vice-Presidente': 2,
      'Relator': 3,
      '1º Suplente': 4,
      '2º Suplente': 5,
      '3º Suplente': 6,
      'Membro': 7
    };
    return order[role] || 8;
  };

  const sortedMembers = [...committee.members].sort((a, b) => 
    getRoleOrder(a.role) - getRoleOrder(b.role)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Botão Voltar */}
        <div className="mb-6">
          <Link href="/comissoes">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar às Comissões
            </Button>
          </Link>
        </div>

        {/* Cabeçalho da Comissão */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl text-gray-900 mb-2">
                  {committee.name}
                </CardTitle>
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant={committee.status === 'ativa' ? 'default' : 'secondary'}>
                    {committee.status}
                  </Badge>
                  <Badge variant="outline">
                    {committee.type || 'Permanente'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-lg mb-6">{committee.description}</p>
            
            {/* Informações da Comissão */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center text-gray-600">
                <Users className="h-5 w-5 mr-3" />
                <div>
                  <p className="font-medium">{committee.members.length} Membros</p>
                  <p className="text-sm">Na comissão</p>
                </div>
              </div>
              
              <div className="flex items-center text-gray-600">
                <Calendar className="h-5 w-5 mr-3" />
                <div>
                  <p className="font-medium">
                    {new Date(committee.startDate).toLocaleDateString('pt-BR')} - {new Date(committee.endDate).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm">Período de atuação</p>
                </div>
              </div>
              
              <div className="flex items-center text-gray-600">
                <Clock className="h-5 w-5 mr-3" />
                <div>
                  <p className="font-medium">
                    {new Date(committee.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm">Data de criação</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Membros da Comissão */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900 flex items-center">
              <Users className="h-6 w-6 mr-3" />
              Membros da Comissão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sortedMembers.map((member) => {
                const user = member.user || member;
                return (
                  <div key={member.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Avatar e Info Principal */}
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage 
                            src={user.profileImageUrl || ''} 
                            alt={user.name}
                          />
                          <AvatarFallback>
                            {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {user.name}
                          </h3>
                          <Badge variant="default" className="mt-1">
                            {member.role}
                          </Badge>
                        </div>
                      </div>

                      {/* Informações Adicionais */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 md:mt-0">
                        {user.email && (
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                        )}
                        
                        {user.partido && (
                          <div className="flex items-center text-gray-600">
                            <User className="h-4 w-4 mr-2" />
                            <span className="text-sm">Partido: {user.partido}</span>
                          </div>
                        )}
                        
                        {user.occupation && (
                          <div className="flex items-center text-gray-600">
                            <FileText className="h-4 w-4 mr-2" />
                            <span className="text-sm">{user.occupation}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            Membro desde {new Date(member.addedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}