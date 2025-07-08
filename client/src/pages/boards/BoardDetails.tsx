import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Edit, ArrowLeft, Calendar, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { type Board } from '@shared/schema';

export default function BoardDetails() {
  const { id } = useParams<{ id: string }>();
  
  // Check if id is a valid number - if not, redirect to 404
  if (!id || isNaN(Number(id))) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">Mesa Diretora não encontrada</p>
            <Button asChild className="mt-4">
              <Link href="/boards">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar à Lista
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { data: board, isLoading } = useQuery({
    queryKey: ['/api/boards', Number(id)],
    queryFn: async () => {
      const response = await fetch(`/api/boards/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch board');
      }
      return response.json() as Promise<Board>;
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">Mesa Diretora não encontrada</p>
            <Button asChild className="mt-4">
              <Link href="/boards">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar à Lista
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/boards">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{board.name}</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(board.startDate)} - {formatDate(board.endDate)}</span>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/boards/${board.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Mesa Diretora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Legislatura</h3>
                <p className="text-gray-600">
                  {board.legislature ? `${board.legislature.number}ª Legislatura` : 'Não informado'}
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Período de Vigência</h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(board.startDate)} - {formatDate(board.endDate)}</span>
                </div>
              </div>

              {board.description && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Descrição</h3>
                    <p className="text-gray-600">{board.description}</p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Estatísticas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">
                      {board.members?.length || 0} membros
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Ativa
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Composição da Mesa</CardTitle>
              <CardDescription>
                Membros e seus respectivos cargos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {board.members && board.members.length > 0 ? (
                <div className="space-y-4">
                  {board.members.map((member) => (
                    <div key={`${member.userId}-${member.role}`} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.user?.profileImageUrl || ''} />
                          <AvatarFallback>
                            {member.user?.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.user?.name}</p>
                          <p className="text-sm text-gray-600">{member.user?.email}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{member.role}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum membro atribuído</p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link href={`/boards/${board.id}/edit`}>
                      Adicionar Membros
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}