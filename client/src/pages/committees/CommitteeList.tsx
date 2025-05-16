import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusIcon, EditIcon, TrashIcon, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Committee } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function CommitteeList() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [committeeToDelete, setCommitteeToDelete] = useState<Committee | null>(null);

  const { data: committees = [], isLoading } = useQuery({
    queryKey: ["/api/committees"],
  });

  const handleDeleteClick = (committee: Committee) => {
    setCommitteeToDelete(committee);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!committeeToDelete) return;

    try {
      await apiRequest(`/api/committees/${committeeToDelete.id}`, {
        method: "DELETE",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/committees"] });
      
      toast({
        title: "Comissão excluída",
        description: "A comissão foi excluída com sucesso.",
        variant: "success",
      });
    } catch (error) {
      console.error("Erro ao excluir comissão:", error);
      toast({
        title: "Erro ao excluir comissão",
        description: "Ocorreu um erro ao tentar excluir a comissão.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCommitteeToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const isCommitteeActive = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    return now <= end;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Comissões</h1>
        {user?.role === "admin" && (
          <Button onClick={() => setLocation("/committees/new")}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Nova Comissão
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : committees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">Nenhuma comissão encontrada</h3>
              <p className="text-sm text-muted-foreground">
                Não há comissões cadastradas no sistema.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {committees.map((committee: Committee) => (
                    <TableRow key={committee.id}>
                      <TableCell className="font-medium">{committee.name}</TableCell>
                      <TableCell>{committee.type}</TableCell>
                      <TableCell>
                        {formatDate(committee.startDate.toString())} a{" "}
                        {formatDate(committee.endDate.toString())}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isCommitteeActive(committee.endDate.toString()) ? "default" : "outline"}>
                          {isCommitteeActive(committee.endDate.toString()) ? "Vigente" : "Encerrada"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/committees/${committee.id}`)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                        {user?.role === "admin" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/committees/edit/${committee.id}`)}
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(committee)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a comissão{" "}
              <span className="font-semibold">{committeeToDelete?.name}</span>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}