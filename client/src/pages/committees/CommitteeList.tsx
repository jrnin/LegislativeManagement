import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Trash2,
  Calendar,
  Users2
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function CommitteeList() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const isAdmin = user?.role === "admin";
  
  const { data: committees = [], isLoading } = useQuery({
    queryKey: ["/api/committees"],
  });
  
  const filteredCommittees = committees.filter((committee: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      committee.name.toLowerCase().includes(query) ||
      committee.type.toLowerCase().includes(query) ||
      committee.description.toLowerCase().includes(query)
    );
  });
  
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await apiRequest(`/api/committees/${deleteId}`, {
        method: "DELETE",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/committees"] });
      
      toast({
        title: "Comissão excluída",
        description: "A comissão foi excluída com sucesso."
      });
      
      setShowDeleteDialog(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Erro ao excluir comissão:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir a comissão."
      });
    }
  };
  
  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };
  
  const getStatusBadge = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) {
      return <Badge variant="outline">Não iniciada</Badge>;
    } else if (now > end) {
      return <Badge variant="secondary">Encerrada</Badge>;
    } else {
      return <Badge variant="default">Vigente</Badge>;
    }
  };

  return (
    <>
      <PageHeader
        title="Comissões"
        description="Visualize e gerencie as comissões da câmara"
        actions={
          isAdmin && (
            <Button onClick={() => navigate("/committees/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Comissão
            </Button>
          )
        }
      />
      
      <Card className="mb-6">
        <CardHeader className="py-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar comissões..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredCommittees.length === 0 ? (
        <div className="text-center py-12">
          <Users2 className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">Nenhuma comissão encontrada</h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery
              ? "Não encontramos comissões correspondentes à sua busca."
              : "Não há comissões cadastradas. Clique em Nova Comissão para adicionar."}
          </p>
          {isAdmin && !searchQuery && (
            <Button 
              onClick={() => navigate("/committees/new")} 
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Comissão
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredCommittees.map((committee: any) => (
            <Card key={committee.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{committee.name}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="font-normal">
                        {committee.type}
                      </Badge>
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-m-2">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(`/committees/${committee.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/committees/${committee.id}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => confirmDelete(committee.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>
                    {format(new Date(committee.startDate), "dd/MM/yyyy")} a{" "}
                    {format(new Date(committee.endDate), "dd/MM/yyyy")}
                  </span>
                </div>
                <p className="text-sm line-clamp-2">{committee.description}</p>
              </CardContent>
              <CardFooter className="border-t px-6 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {committee.members?.length || 0} membros
                  </span>
                </div>
                <div>
                  {getStatusBadge(committee.startDate, committee.endDate)}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta comissão? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}