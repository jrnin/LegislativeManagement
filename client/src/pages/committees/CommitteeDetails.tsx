import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditIcon, ArrowLeft, Users, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Committee, User } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function CommitteeDetails() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    userId: string;
    name: string;
    role: string;
  } | null>(null);
  const [newRole, setNewRole] = useState("");

  const { data: committee, isLoading } = useQuery({
    queryKey: ["/api/committees", id],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!committee) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-6">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-2xl font-bold mb-2">Comissão não encontrada</h2>
              <p className="text-muted-foreground mb-6">
                A comissão solicitada não foi encontrada ou pode ter sido removida.
              </p>
              <Button onClick={() => setLocation("/committees")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCommitteeActive = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    return now <= end;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const handleRoleChange = (member: any) => {
    setSelectedMember({
      userId: member.userId,
      name: member.user.name,
      role: member.role,
    });
    setNewRole(member.role);
    setRoleDialogOpen(true);
  };

  const updateMemberRole = async () => {
    if (!selectedMember || !newRole) return;

    try {
      await apiRequest("PUT", `/api/committees/${id}/members/${selectedMember.userId}`, {
        role: newRole,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/committees", id] });

      toast({
        title: "Função atualizada",
        description: `A função de ${selectedMember.name} foi atualizada para ${newRole}.`,
      });
    } catch (error) {
      console.error("Erro ao atualizar função:", error);
      toast({
        title: "Erro ao atualizar função",
        description: "Ocorreu um erro ao atualizar a função do membro na comissão.",
        variant: "destructive",
      });
    } finally {
      setRoleDialogOpen(false);
      setSelectedMember(null);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/committees")}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <Badge
              variant={
                committee.endDate && isCommitteeActive(committee.endDate.toString())
                  ? "default"
                  : "outline"
              }
            >
              {committee.endDate && isCommitteeActive(committee.endDate.toString())
                ? "Vigente"
                : "Encerrada"}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{committee.name}</h1>
          <p className="text-muted-foreground">
            {committee.type} • Período: {committee.startDate ? formatDate(committee.startDate.toString()) : 'Data não informada'} a{" "}
            {committee.endDate ? formatDate(committee.endDate.toString()) : 'Data não informada'}
          </p>
        </div>
        {user?.role === "admin" && (
          <Button
            variant="outline"
            onClick={() => setLocation(`/committees/edit/${id}`)}
          >
            <EditIcon className="h-4 w-4 mr-2" />
            Editar Comissão
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{committee.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Tipo de Comissão
                </dt>
                <dd>{committee.type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Data de Início
                </dt>
                <dd>{committee.startDate ? formatDate(committee.startDate.toString()) : 'Data não informada'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Data de Término
                </dt>
                <dd>{committee.endDate ? formatDate(committee.endDate.toString()) : 'Data não informada'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Status
                </dt>
                <dd>
                  {committee.endDate && isCommitteeActive(committee.endDate.toString())
                    ? "Vigente"
                    : "Encerrada"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Quantidade de Membros
                </dt>
                <dd>{committee.members?.length || 0} membros</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros da Comissão</CardTitle>
        </CardHeader>
        <CardContent>
          {!committee.members || committee.members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">
                Nenhum membro na comissão
              </h3>
              <p className="text-sm text-muted-foreground">
                Esta comissão não possui membros designados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função na Comissão</TableHead>
                    {user?.role === "admin" && <TableHead>Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {committee.members.map((member: any) => (
                    <TableRow key={member.userId}>
                      <TableCell className="font-medium">
                        {member.user.name}
                      </TableCell>
                      <TableCell>{member.user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.role === "presidente"
                              ? "default"
                              : member.role === "vice-presidente"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {member.role.charAt(0).toUpperCase() +
                            member.role.slice(1)}
                        </Badge>
                      </TableCell>
                      {user?.role === "admin" && (
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(member)}
                          >
                            Alterar Função
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Função do Membro</DialogTitle>
            <DialogDescription>
              Selecione a nova função para {selectedMember?.name} na comissão.
            </DialogDescription>
          </DialogHeader>
          <Select
            value={newRole}
            onValueChange={setNewRole}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Presidente">Presidente</SelectItem>
              <SelectItem value="Vice-Presidente">Vice-Presidente</SelectItem>
              <SelectItem value="Relator">Relator</SelectItem>
              <SelectItem value="1º Suplente">1º Suplente</SelectItem>
              <SelectItem value="2º Suplente">2º Suplente</SelectItem>
              <SelectItem value="3º Suplente">3º Suplente</SelectItem>
              <SelectItem value="Membro">Membro</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={updateMemberRole}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}