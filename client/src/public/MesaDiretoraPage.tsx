import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Calendar, 
  Building2, 
  Crown, 
  UserCheck, 
  FileText,
  Mail,
  Phone,
  MapPin 
} from 'lucide-react';
import { Board } from '@shared/schema';
import { formatDate } from '@/lib/utils';

const MesaDiretoraPage = () => {
  // Fetch current board data
  const { data: board, isLoading, error } = useQuery({
    queryKey: ['/api/public/board'],
    queryFn: async () => {
      const response = await fetch('/api/public/board');
      if (!response.ok) {
        throw new Error('Erro ao carregar dados da Mesa Diretora');
      }
      return response.json() as Promise<Board>;
    },
  });

  // Role hierarchy for display order
  const roleOrder = {
    'Presidente': 1,
    'Vice-Presidente': 2,
    '1º Secretário(a)': 3,
    '2º Secretário(a)': 4,
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Presidente':
        return <Crown className="h-5 w-5 text-yellow-600" />;
      case 'Vice-Presidente':
        return <UserCheck className="h-5 w-5 text-blue-600" />;
      case '1º Secretário(a)':
      case '2º Secretário(a)':
        return <FileText className="h-5 w-5 text-green-600" />;
      default:
        return <Users className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Presidente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Vice-Presidente':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case '1º Secretário(a)':
      case '2º Secretário(a)':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="h-10 bg-gray-200 rounded w-1/3 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center text-lg">
                {error?.message || 'Mesa Diretora não encontrada'}
              </p>
              <p className="text-gray-500 text-center mt-2">
                As informações da Mesa Diretora não estão disponíveis no momento.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Sort members by role hierarchy
  const sortedMembers = board.members 
    ? [...board.members].sort((a, b) => {
        const orderA = roleOrder[a.role as keyof typeof roleOrder] || 999;
        const orderB = roleOrder[b.role as keyof typeof roleOrder] || 999;
        return orderA - orderB;
      })
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Mesa Diretora</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Conheça a composição da Mesa Diretora da Câmara Municipal e seus representantes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

         
          
          {/* Board Information */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Informações da Mesa Diretora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{board.name}</h3>
                {board.description && (
                  <p className="text-gray-700 leading-relaxed">{board.description}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Período de Mandato</p>
                    <p className="text-gray-600">
                      {formatDate(board.startDate)} até {formatDate(board.endDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Composição</p>
                    <p className="text-gray-600">
                      {sortedMembers.length} {sortedMembers.length === 1 ? 'membro' : 'membros'}
                    </p>
                  </div>
                </div>

                {board.legislature && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Legislatura</p>
                      <p className="text-gray-600">{board.legislature.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardHeader>
              <CardTitle>Sobre a Mesa Diretora</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">
                A Mesa Diretora é o órgão colegiado responsável pela direção dos trabalhos legislativos 
                e pelos serviços administrativos da Câmara Municipal. É composta por Presidente, 
                Vice-Presidente, 1º Secretário(a) e 2º Secretário(a), eleitos entre os vereadores 
                para um mandato de dois anos.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Crown className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-yellow-800">Presidente</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Dirige as sessões e representa a Câmara
                  </p>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <UserCheck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-blue-800">Vice-Presidente</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Substitui o Presidente em sua ausência
                  </p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-800">1º Secretário(a)</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Responsável pelas atas e correspondências
                  </p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-800">2º Secretário(a)</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Auxilia nas funções secretariais
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>          

          {/* Members List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Composição da Mesa
            </h2>

            {sortedMembers.length > 0 ? (
              <div className="space-y-4">
                {sortedMembers.map((member) => (
                  <Card key={`${member.boardId}-${member.userId}-${member.role}`} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage 
                            src={member.user?.profileImageUrl || ''} 
                            alt={member.user?.name || 'Vereador(a)'}
                          />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                            {member.user?.name ? member.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'V'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {member.user?.name || 'Nome não disponível'}
                              </h3>
                              <Badge className={`${getRoleBadgeColor(member.role)} border`}>
                                <span className="flex items-center gap-1">
                                  {getRoleIcon(member.role)}
                                  {member.role}
                                </span>
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            {member.user?.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <a 
                                  href={`mailto:${member.user.email}`}
                                  className="text-blue-600 hover:underline"
                                >
                                  {member.user.email}
                                </a>
                              </div>
                            )}
                            
                            {member.user?.partido && (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {member.user.partido}
                                </Badge>
                              </div>
                            )}
                            
                            {member.user?.city && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{member.user.city}, {member.user.state}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 text-center">
                    Nenhum membro cadastrado na Mesa Diretora
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

      
      </div>
    </div>
  );
};

export default MesaDiretoraPage;