import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Edit, Calendar, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { formatDate } from "@/lib/utils";

export default function CommitteeDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");
  
  const isAdmin = user?.role === "admin";
  
  const { data: committee, isLoading } = useQuery({
    queryKey: [`/api/committees/${id}`],
  });
  
  const { data: councilors = [] } = useQuery({
    queryKey: ["/api/councilors"],
    enabled: isAdmin,
  });
  
  const addMemberMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/committees/${id}/members`, {
        method: "POST",
        data: {
          userId: selectedUserId,
          role: selectedRole,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/committees/${id}`] });
      setIsAddMemberDialogOpen(false);
      setSelectedUserId("");
      setSelectedRole("member");
      
      toast({
        title: "Membro adicionado",
        description: "O membro foi adicionado à comissão com sucesso."
      });
    },
    onError: (error) => {
      console.error("Erro ao adicionar membro:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o membro à comissão."
      });
    }
  });
  
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest(`/api/committees/${id}/members/${userId}`, {
        method: "PUT",
        data: { role },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/committees/${id}`] });
      toast({
        title: "Função atualizada",
        description: "A função do membro foi atualizada com sucesso."
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar função:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a função do membro."
      });
    }
  });
  
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest(`/api/committees/${id}/members/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/committees/${id}`] });
      toast({
        title: "Membro removido",
        description: "O membro foi removido da comissão com sucesso."
      });
    },
    onError: (error) => {
      console.error("Erro ao remover membro:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o membro da comissão."
      });
    }
  });
  
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
  
  const formatRoleName = (role: string) => {
    switch (role) {
      case "presidente":
        return "Presidente";
      case "vice-presidente":
        return "Vice-Presidente";
      case "secretario":
        return "Secretário";
      case "member":
      default:
        return "Membro";
    }
  };
  
  const availableCouncilors = councilors.filter((councilor: any) => {
    // Filtrar apenas vereadores que ainda não são membros desta comissão
    return !committee?.members?.some((member: any) => member.userId === councilor.id);
  });
  
  const handleAddMember = () => {
    if (!selectedUserId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um vereador para adicionar à comissão."
      });
      return;
    }
    
    addMemberMutation.mutate();
  };
  
  const handleRoleChange = (userId: string, role: string) => {
    updateRoleMutation.mutate({ userId, role });
  };
  
  const handleRemoveMember = (userId: string) => {
    removeMemberMutation.mutate(userId);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!committee) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Comissão não encontrada</h2>
        <p className="text-muted-foreground mb-6">
          A comissão que você está procurando não foi encontrada.
        </p>
        <Button onClick={() => navigate("/committees")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para comissões
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={committee.name}
        description={`Detalhes da comissão e seus membros`}
        backLink="/committees"
        actions={
          isAdmin && (
            <Button onClick={() => navigate(`/committees/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Comissão
            </Button>
          )
        }
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Comissão</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <div className="grid grid-cols-3 gap-1">
                <dt className="font-medium text-muted-foreground">Tipo:</dt>
                <dd className="col-span-2">{committee.type}</dd>
              </div>
              
              <div className="grid grid-cols-3 gap-1">
                <dt className="font-medium text-muted-foreground">Período:</dt>
                <dd className="col-span-2 flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>
                    {formatDate(committee.startDate)} a {formatDate(committee.endDate)}
                  </span>
                </dd>
              </div>
              
              <div className="grid grid-cols-3 gap-1">
                <dt className="font-medium text-muted-foreground">Status:</dt>
                <dd className="col-span-2">
                  {getStatusBadge(committee.startDate, committee.endDate)}
                </dd>
              </div>
              
              <div className="mt-3">
                <dt className="font-medium text-muted-foreground mb-1">Descrição:</dt>
                <dd className="bg-muted p-3 rounded-md">{committee.description}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Membros</CardTitle>
            {isAdmin && (
              <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={availableCouncilors.length === 0}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Adicionar Membro
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Membro à Comissão</DialogTitle>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="councilor" className="text-sm font-medium">
                        Vereador
                      </label>
                      <Select 
                        value={selectedUserId} 
                        onValueChange={setSelectedUserId}
                      >
                        <SelectTrigger id="councilor">
                          <SelectValue placeholder="Selecione um vereador" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCouncilors.length === 0 ? (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                              Não há vereadores disponíveis para adicionar
                            </div>
                          ) : (
                            availableCouncilors.map((councilor: any) => (
                              <SelectItem key={councilor.id} value={councilor.id}>
                                {councilor.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="role" className="text-sm font-medium">
                        Função na Comissão
                      </label>
                      <Select 
                        value={selectedRole} 
                        onValueChange={setSelectedRole}
                      >
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="presidente">Presidente</SelectItem>
                          <SelectItem value="vice-presidente">Vice-Presidente</SelectItem>
                          <SelectItem value="secretario">Secretário</SelectItem>
                          <SelectItem value="member">Membro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddMemberDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddMember}
                      disabled={!selectedUserId || addMemberMutation.isPending}
                    >
                      {addMemberMutation.isPending ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                          Adicionando...
                        </>
                      ) : "Adicionar Membro"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {committee.members?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Função</TableHead>
                    {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {committee.members.map((member: any) => (
                    <TableRow key={member.userId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {member.user.profileImageUrl ? (
                              <AvatarImage 
                                src={member.user.profileImageUrl} 
                                alt={member.user.name} 
                              />
                            ) : (
                              <AvatarFallback>
                                {member.user.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span>{member.user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleRoleChange(member.userId, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="presidente">Presidente</SelectItem>
                              <SelectItem value="vice-presidente">Vice-Presidente</SelectItem>
                              <SelectItem value="secretario">Secretário</SelectItem>
                              <SelectItem value="member">Membro</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          formatRoleName(member.role)
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMember(member.userId)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Esta comissão ainda não possui membros.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}