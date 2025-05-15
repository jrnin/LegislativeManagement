import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { PlusIcon, Search, UsersRound, Pencil, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { queryClient } from "@/lib/queryClient";

interface Committee {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  memberCount: number;
}

export default function CommitteeList() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [committeeToDelete, setCommitteeToDelete] = useState<Committee | null>(null);

  // Buscar a lista de comissões
  const {
    data: committees = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["/api/committees"],
  });

  // Filtragem por busca
  const filteredCommittees = committees.filter((committee: Committee) =>
    committee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    committee.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Confirmar exclusão
  const confirmDelete = (committee: Committee) => {
    setCommitteeToDelete(committee);
    setDeleteDialogOpen(true);
  };

  // Deletar comissão
  const handleDelete = async () => {
    if (!committeeToDelete) return;

    try {
      const response = await fetch(`/api/committees/${committeeToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Comissão excluída",
          description: `A comissão "${committeeToDelete.name}" foi excluída com sucesso.`,
        });
        
        // Invalidar a query para recarregar dados
        queryClient.invalidateQueries({ queryKey: ["/api/committees"] });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erro ao excluir comissão");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao excluir a comissão",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCommitteeToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comissões</h1>
          <p className="text-muted-foreground">
            Gerencie as comissões do sistema legislativo
          </p>
        </div>
        <Button onClick={() => navigate("/committees/new")}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Nova Comissão
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Comissões Cadastradas</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar comissões..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <CardDescription>
            {filteredCommittees.length} comissão(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Spinner size="lg" />
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-48">
              <div className="text-center">
                <p className="text-destructive mb-2">Erro ao carregar comissões</p>
                <Button variant="outline" onClick={() => refetch()}>
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : filteredCommittees.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <UsersRound className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
              <h3 className="font-medium text-lg mb-1">Nenhuma comissão encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Nenhuma comissão corresponde à sua busca"
                  : "Comece criando sua primeira comissão"}
              </p>
              {!searchTerm && (
                <Button onClick={() => navigate("/committees/new")}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Nova Comissão
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Membros</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommittees.map((committee: Committee) => (
                    <TableRow key={committee.id}>
                      <TableCell className="font-medium">
                        <Link 
                          href={`/committees/${committee.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {committee.name}
                        </Link>
                        <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {committee.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5">
                          {committee.memberCount || 0} membro(s)
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {committee.active ? (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-700 hover:bg-gray-300">
                            Inativa
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(committee.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/committees/${committee.id}`)}
                            title="Detalhes"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/committees/edit/${committee.id}`)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(committee)}
                            title="Excluir"
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A comissão{" "}
              <span className="font-semibold">{committeeToDelete?.name}</span> será
              permanentemente excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}