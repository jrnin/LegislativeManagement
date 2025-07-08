import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Plus, Users, Calendar, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { type Board } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';

export default function BoardsPage() {
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const { data: boards, isLoading } = useQuery({
    queryKey: ['/api/boards'],
    queryFn: async () => {
      const response = await fetch('/api/boards');
      if (!response.ok) {
        throw new Error('Failed to fetch boards');
      }
      return response.json() as Promise<Board[]>;
    },
  });

  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    try {
      const response = await fetch(`/api/boards/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete board');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/boards'] });
      toast({
        title: 'Sucesso',
        description: 'Mesa Diretora excluída com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir Mesa Diretora.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mesa Diretora</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mesa Diretora</h1>
          <p className="text-gray-600">Gerencie a composição da Mesa Diretora</p>
        </div>
        <Button asChild>
          <Link href="/boards/create">
            <Plus className="mr-2 h-4 w-4" />
            Nova Mesa Diretora
          </Link>
        </Button>
      </div>

      {boards && boards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center mb-4">
              Nenhuma Mesa Diretora encontrada
            </p>
            <Button asChild>
              <Link href="/boards/create">
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira Mesa Diretora
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards?.map((board) => (
            <Card key={board.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{board.name}</CardTitle>
                    <CardDescription>
                      {board.legislature && (
                        <span className="text-sm text-gray-500">
                          {board.legislature.number}ª Legislatura
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(board.startDate)} - {formatDate(board.endDate)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {board.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {board.description}
                    </p>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-1" />
                    {board.members?.length || 0} membros
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/boards/${board.id}`}>
                        Ver Detalhes
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/boards/${board.id}/edit`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(board.id)}
                      disabled={isDeleting === board.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}