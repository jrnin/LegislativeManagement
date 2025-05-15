import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  CalendarIcon, 
  ChevronDownIcon, 
  FileTextIcon, 
  MoreHorizontalIcon, 
  PencilIcon, 
  PlusIcon, 
  SearchIcon, 
  TrashIcon, 
  UsersIcon 
} from 'lucide-react';

type Committee = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  type: string;
  createdAt: string;
  updatedAt: string;
};

export default function CommitteeList() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const { data: committees, isLoading } = useQuery({
    queryKey: ['/api/committees'],
    retry: false,
  });
  
  const filteredCommittees = committees?.filter((committee: Committee) => 
    committee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    committee.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    committee.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const response = await fetch(`/api/committees/${deleteId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: 'Comissão excluída',
          description: 'A comissão foi excluída com sucesso',
        });
        
        // Atualizar cache
        queryClient.invalidateQueries({ queryKey: ['/api/committees'] });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir comissão');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a comissão',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };
  
  const getCommitteeStatusBadge = (committee: Committee) => {
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
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comissões</h1>
          <p className="text-muted-foreground">
            Gerencie as comissões legislativas e seus membros
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate('/committees/new')}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Nova Comissão
          </Button>
        )}
      </div>
      
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar comissões..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {filteredCommittees?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl font-medium text-center">Nenhuma comissão encontrada</p>
            <p className="text-muted-foreground text-center mt-1">
              {searchQuery ? 'Tente buscar com outros termos' : 'Crie uma nova comissão para começar'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommittees?.map((committee: Committee) => (
                <TableRow key={committee.id}>
                  <TableCell className="font-medium">
                    <Link href={`/committees/${committee.id}`} className="hover:underline">
                      {committee.name}
                    </Link>
                  </TableCell>
                  <TableCell>{committee.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      {formatDate(committee.startDate)} - {formatDate(committee.endDate)}
                    </div>
                  </TableCell>
                  <TableCell>{getCommitteeStatusBadge(committee)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => navigate(`/committees/${committee.id}`)}
                        >
                          <FileTextIcon className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate(`/committees/${committee.id}/members`)}
                        >
                          <UsersIcon className="mr-2 h-4 w-4" />
                          Gerenciar membros
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => navigate(`/committees/edit/${committee.id}`)}
                            >
                              <PencilIcon className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteId(committee.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <TrashIcon className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comissão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a comissão
              e removerá todos os membros associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}