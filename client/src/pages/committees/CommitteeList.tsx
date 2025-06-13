import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, Trash2, Edit, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Committee } from "@shared/schema";
import CommitteeEditModal from "@/components/committees/CommitteeEditModal";

export default function CommitteeList() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);

  const { data: committees = [], isLoading } = useQuery({
    queryKey: ["/api/committees"],
  });

  const filteredCommittees = committees.filter((committee: Committee) =>
    committee.name.toLowerCase().includes(search.toLowerCase()) ||
    committee.type.toLowerCase().includes(search.toLowerCase()) ||
    committee.description.toLowerCase().includes(search.toLowerCase())
  );

  const pageSize = 10;
  const totalPages = Math.ceil(filteredCommittees.length / pageSize);
  const paginatedCommittees = filteredCommittees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleDeleteClick = (committee: Committee) => {
    setSelectedCommittee(committee);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCommittee) return;

    try {
      await apiRequest(`/api/committees/${selectedCommittee.id}`, {
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
        title: "Erro ao excluir",
        description:
          "Ocorreu um erro ao excluir a comissão. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedCommittee(null);
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Comissões</h1>
          <p className="text-muted-foreground">
            Gerencie as comissões legislativas e sua composição
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setLocation("/committees/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Comissão
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filtrar Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar comissões..."
                  className="pl-8"
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Lista de Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedCommittees.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto bg-slate-100 h-12 w-12 rounded-full flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium">Nenhuma comissão encontrada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search
                  ? "Tente ajustar os filtros ou fazer uma busca diferente."
                  : "Nenhuma comissão foi cadastrada no sistema."}
              </p>
              {isAdmin && search && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setLocation("/committees/new")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Nova Comissão
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Membros</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCommittees.map((committee: Committee) => (
                      <TableRow key={committee.id}>
                        <TableCell className="font-medium">
                          {committee.name}
                        </TableCell>
                        <TableCell>{committee.type}</TableCell>
                        <TableCell>
                          {formatDate(committee.startDate.toString())} a{" "}
                          {formatDate(committee.endDate.toString())}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              isCommitteeActive(committee.endDate.toString())
                                ? "default"
                                : "outline"
                            }
                          >
                            {isCommitteeActive(committee.endDate.toString())
                              ? "Vigente"
                              : "Encerrada"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {committee.members?.length || 0} membros
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setLocation(`/committees/${committee.id}`)}
                              title="Visualizar detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedCommittee(committee);
                                    setEditDialogOpen(true);
                                  }}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(committee)}
                                  title="Excluir"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        aria-disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="px-4">
                        Página {currentPage} de {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                        aria-disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a comissão{" "}
              <strong>{selectedCommittee?.name}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CommitteeEditModal
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        committee={selectedCommittee}
      />
    </div>
  );
}