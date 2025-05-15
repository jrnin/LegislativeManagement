import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { 
  AlertCircle, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Edit, 
  Plus, 
  Trash2, 
  Users,
  Check,
  X 
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate, getInitials } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Committee {
  id: number;
  name: string;
  description: string;
  type: string;
  startDate: string | Date;
  endDate: string | Date;
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  members?: CommitteeMember[];
}

interface CommitteeMember {
  userId: string;
  committeeId: number;
  role: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: User;
}

interface User {
  id: string;
  name: string;
  email: string;
  profileImageUrl?: string;
  role?: string;
}

export function CommitteeDetails() {
  const [location] = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isAdmin = user?.role === 'admin';
  
  const committeeId = location.split('/').pop();
  
  const { data: committee, isLoading, error } = useQuery({
    queryKey: [`/api/committees/${committeeId}`],
  });
  
  const { data: allUsers } = useQuery({
    queryKey: ['/api/users'],
    enabled: isAdmin, // Somente carrega usuários se for admin
  });
  
  // Estado para diálogos
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteCommitteeOpen, setDeleteCommitteeOpen] = useState(false);
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CommitteeMember | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [newMemberId, setNewMemberId] = useState<string>("");
  const [newMemberRole, setNewMemberRole] = useState<string>("Membro");
  
  // Mutações
  const addMemberMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
      return apiRequest(`/api/committees/${committeeId}/members`, {
        method: 'POST',
        data: { userId, role }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/committees/${committeeId}`] });
      toast({
        title: "Membro adicionado",
        description: "Membro adicionado à comissão com sucesso",
        variant: "success",
      });
      setAddMemberOpen(false);
      setNewMemberId("");
      setNewMemberRole("Membro");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar membro à comissão",
        variant: "destructive",
      });
    }
  });
  
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
      return apiRequest(`/api/committees/${committeeId}/members/${userId}`, {
        method: 'PUT',
        data: { role }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/committees/${committeeId}`] });
      toast({
        title: "Função atualizada",
        description: "Função do membro atualizada com sucesso",
        variant: "success",
      });
      setEditRoleOpen(false);
      setSelectedMember(null);
      setNewRole("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar função do membro",
        variant: "destructive",
      });
    }
  });
  
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest(`/api/committees/${committeeId}/members/${userId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/committees/${committeeId}`] });
      toast({
        title: "Membro removido",
        description: "Membro removido da comissão com sucesso",
        variant: "success",
      });
      setDeleteConfirmOpen(false);
      setSelectedMember(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover membro da comissão",
        variant: "destructive",
      });
    }
  });
  
  const deleteCommitteeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/committees/${committeeId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Comissão excluída",
        description: "Comissão excluída com sucesso",
        variant: "success",
      });
      navigate('/committees');
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir comissão",
        variant: "destructive",
      });
    }
  });
  
  // Handlers
  const handleAddMember = () => {
    if (!newMemberId) {
      toast({
        title: "Erro",
        description: "Selecione um membro para adicionar",
        variant: "destructive",
      });
      return;
    }
    
    addMemberMutation.mutate({ 
      userId: newMemberId, 
      role: newMemberRole 
    });
  };
  
  const handleEditRole = (member: CommitteeMember) => {
    setSelectedMember(member);
    setNewRole(member.role);
    setEditRoleOpen(true);
  };
  
  const handleUpdateRole = () => {
    if (!selectedMember || !newRole) {
      toast({
        title: "Erro",
        description: "Selecione uma função válida",
        variant: "destructive",
      });
      return;
    }
    
    updateMemberRoleMutation.mutate({ 
      userId: selectedMember.userId, 
      role: newRole 
    });
  };
  
  const handleRemoveMember = (member: CommitteeMember) => {
    setSelectedMember(member);
    setDeleteConfirmOpen(true);
  };
  
  const confirmRemoveMember = () => {
    if (!selectedMember) return;
    removeMemberMutation.mutate(selectedMember.userId);
  };
  
  const handleDeleteCommittee = () => {
    setDeleteCommitteeOpen(true);
  };
  
  const confirmDeleteCommittee = () => {
    deleteCommitteeMutation.mutate();
  };

  // Filtramos usuários que já são membros
  const filteredUsers = allUsers?.filter((u: User) => {
    // Verifica se o usuário já é membro da comissão
    return !committee?.members?.some(m => m.userId === u.id);
  }) || [];
  
  // Renderiza estado de carregamento
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }
  
  // Renderiza mensagem de erro
  if (error || !committee) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold">Erro ao carregar comissão</h3>
          <p className="text-muted-foreground">Ocorreu um erro ao buscar os detalhes da comissão.</p>
          <Button className="mt-4" onClick={() => navigate("/committees")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para comissões
          </Button>
        </div>
      </div>
    );
  }
  
  // Função para obter a cor do badge baseada no tipo
  const getBadgeColor = (type: string) => {
    switch (type) {
      case "Permanente":
        return "bg-blue-500 hover:bg-blue-600";
      case "Temporária":
        return "bg-amber-500 hover:bg-amber-600";
      case "Extraordinária":
        return "bg-purple-500 hover:bg-purple-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/committees')} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{committee.name}</h1>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => navigate(`/committees/${committeeId}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                
                <Button variant="destructive" onClick={handleDeleteCommittee}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Badges de status e tipo */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            className={`${getBadgeColor(committee.type)} text-white`}
          >
            {committee.type}
          </Badge>
          
          <Badge variant={committee.active ? "success" : "destructive"}>
            {committee.active ? "Ativa" : "Inativa"}
          </Badge>
        </div>
        
        {/* Conteúdo principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de informações */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Descrição</h3>
                <p className="text-muted-foreground">{committee.description}</p>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Período
                </h3>
                <p className="text-muted-foreground">
                  {formatDate(committee.startDate)} - {formatDate(committee.endDate)}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Criada em
                </h3>
                <p className="text-muted-foreground">
                  {formatDate(committee.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Lista de membros */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Membros da Comissão
                </CardTitle>
                <CardDescription>
                  {committee.members?.length || 0} membros registrados
                </CardDescription>
              </div>
              
              {isAdmin && (
                <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Membro
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Membro à Comissão</DialogTitle>
                      <DialogDescription>
                        Selecione um usuário e atribua uma função na comissão.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="member">Membro</Label>
                        <Select
                          value={newMemberId}
                          onValueChange={setNewMemberId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um usuário" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredUsers.length > 0 ? (
                              filteredUsers.map((u: User) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-users" disabled>
                                Não há usuários disponíveis
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="role">Função</Label>
                        <Select
                          value={newMemberRole}
                          onValueChange={setNewMemberRole}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma função" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Presidente">Presidente</SelectItem>
                            <SelectItem value="Vice-Presidente">Vice-Presidente</SelectItem>
                            <SelectItem value="Secretário">Secretário</SelectItem>
                            <SelectItem value="Relator">Relator</SelectItem>
                            <SelectItem value="Membro">Membro</SelectItem>
                            <SelectItem value="Suplente">Suplente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleAddMember}
                        disabled={addMemberMutation.isPending || !newMemberId}
                      >
                        {addMemberMutation.isPending && <Spinner className="mr-2" size="sm" />}
                        Adicionar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            
            <Separator />
            
            <CardContent className="pt-6">
              {committee.members?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Sem membros</h3>
                  <p className="text-muted-foreground">Esta comissão ainda não possui membros.</p>
                </div>
              ) : (
                <ScrollArea className="h-[420px] pr-4">
                  <div className="space-y-4">
                    {committee.members?.map((member) => (
                      <div 
                        key={member.userId} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-accent/5"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={member.user?.profileImageUrl || ""} />
                            <AvatarFallback>{getInitials(member.user?.name || "")}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.user?.name}</p>
                            <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge>{member.role}</Badge>
                          
                          {isAdmin && (
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditRole(member)}
                                title="Editar função"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMember(member)}
                                title="Remover membro"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Diálogo de edição de função */}
      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Função do Membro</DialogTitle>
            <DialogDescription>
              Altere a função de {selectedMember?.user?.name} na comissão.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="edit-role">Função</Label>
            <Select
              value={newRole}
              onValueChange={setNewRole}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Presidente">Presidente</SelectItem>
                <SelectItem value="Vice-Presidente">Vice-Presidente</SelectItem>
                <SelectItem value="Secretário">Secretário</SelectItem>
                <SelectItem value="Relator">Relator</SelectItem>
                <SelectItem value="Membro">Membro</SelectItem>
                <SelectItem value="Suplente">Suplente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateRole}
              disabled={updateMemberRoleMutation.isPending || !newRole}
            >
              {updateMemberRoleMutation.isPending && <Spinner className="mr-2" size="sm" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmação de remoção de membro */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Membro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover {selectedMember?.user?.name} da comissão? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRemoveMember}
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending && <Spinner className="mr-2" size="sm" />}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmação de exclusão da comissão */}
      <Dialog open={deleteCommitteeOpen} onOpenChange={setDeleteCommitteeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Comissão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta comissão? Todos os registros relacionados serão removidos. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCommitteeOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteCommittee}
              disabled={deleteCommitteeMutation.isPending}
            >
              {deleteCommitteeMutation.isPending && <Spinner className="mr-2" size="sm" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}