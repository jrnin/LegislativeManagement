import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  UsersRound,
  User,
  Plus,
  X,
  Check,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface Member {
  id: string;
  userId: string;
  committeeId: number;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    profileImageUrl: string | null;
  };
}

interface Committee {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  members: Member[];
}

interface User {
  id: string;
  name: string;
  email: string;
  profileImageUrl: string | null;
}

// Esquema para adicionar membro
const addMemberSchema = z.object({
  userId: z.string({
    required_error: "Selecione um usuário",
  }),
  role: z.string({
    required_error: "Selecione uma função",
  }),
});

type AddMemberFormValues = z.infer<typeof addMemberSchema>;

export default function CommitteeDetails() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const id = params.id;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

  // Buscar detalhes da comissão
  const {
    data: committee,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [`/api/committees/${id}`],
  });

  // Buscar usuários disponíveis para adicionar na comissão
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: addMemberDialogOpen,
  });

  // Formulário para adicionar membro
  const form = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      userId: "",
      role: "",
    },
  });

  // Mutação para adicionar membro
  const addMemberMutation = useMutation({
    mutationFn: async (values: AddMemberFormValues) => {
      const response = await fetch(`/api/committees/${id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao adicionar membro");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Membro adicionado",
        description: "O membro foi adicionado à comissão com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/committees/${id}`] });
      setAddMemberDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao adicionar o membro",
        variant: "destructive",
      });
    },
  });

  // Mutação para remover membro
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/committees/${id}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao remover membro");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Membro removido",
        description: "O membro foi removido da comissão com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/committees/${id}`] });
      setRemoveMemberDialogOpen(false);
      setMemberToRemove(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao remover o membro",
        variant: "destructive",
      });
    },
  });

  // Mutação para excluir comissão
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/committees/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao excluir comissão");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Comissão excluída",
        description: "A comissão foi excluída com sucesso",
      });
      navigate("/committees");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao excluir a comissão",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
    },
  });

  // Lista de usuários filtrada (remove usuários que já são membros)
  const availableUsers = committee
    ? users.filter(
        (user: User) =>
          !committee.members.some((member: Member) => member.userId === user.id)
      )
    : [];

  // Função para confirmar remoção de membro
  const confirmRemoveMember = (member: Member) => {
    setMemberToRemove(member);
    setRemoveMemberDialogOpen(true);
  };

  // Função para remover um membro
  const handleRemoveMember = () => {
    if (memberToRemove) {
      removeMemberMutation.mutate(memberToRemove.id);
    }
  };

  // Função para adicionar um membro
  const onAddMember = (values: AddMemberFormValues) => {
    addMemberMutation.mutate(values);
  };

  // Função para obter iniciais do nome para o avatar
  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .toUpperCase()
      : "U";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !committee) {
    return (
      <div className="text-center py-12">
        <UsersRound className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Comissão não encontrada</h2>
        <p className="text-muted-foreground mb-4">
          Não foi possível carregar os detalhes desta comissão.
        </p>
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => navigate("/committees")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para lista
          </Button>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/committees")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {committee.name}
            </h1>
            <p className="text-muted-foreground">Detalhes da comissão</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/committees/edit/${id}`)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Status
              </h3>
              {committee.active ? (
                <Badge
                  variant="default"
                  className="bg-green-500 hover:bg-green-600 mt-1"
                >
                  Ativa
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-gray-200 text-gray-700 hover:bg-gray-300 mt-1"
                >
                  Inativa
                </Badge>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Criado em
              </h3>
              <p>{formatDate(committee.createdAt)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Última atualização
              </h3>
              <p>{formatDate(committee.updatedAt)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Total de membros
              </h3>
              <p>{committee.members?.length || 0} membro(s)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{committee.description}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Membros</CardTitle>
              <CardDescription>
                Gerenciar os membros desta comissão
              </CardDescription>
            </div>
            <Button onClick={() => setAddMemberDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Membro
            </Button>
          </CardHeader>
          <CardContent>
            {committee.members?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <User className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
                <h3 className="font-medium text-lg mb-1">
                  Nenhum membro nesta comissão
                </h3>
                <p className="text-muted-foreground mb-4">
                  Adicione membros para começar a gerenciar esta comissão
                </p>
                <Button onClick={() => setAddMemberDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Membro
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membro</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Data de Adição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {committee.members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage
                                src={member.user.profileImageUrl || ""}
                                alt={member.user.name}
                              />
                              <AvatarFallback>
                                {getInitials(member.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.user.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/5">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.user.email}</TableCell>
                        <TableCell>{formatDate(member.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmRemoveMember(member)}
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de confirmação de exclusão de comissão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A comissão{" "}
              <span className="font-semibold">{committee.name}</span> será
              permanentemente excluída, junto com todos os seus membros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmação de remoção de membro */}
      <AlertDialog
        open={removeMemberDialogOpen}
        onOpenChange={setRemoveMemberDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a remover{" "}
              <span className="font-semibold">
                {memberToRemove?.user.name}
              </span>{" "}
              da comissão. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMemberMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para adicionar um novo membro */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro</DialogTitle>
            <DialogDescription>
              Selecione um usuário e defina sua função na comissão.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onAddMember)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um usuário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUsers.length === 0 ? (
                          <div className="py-2 px-2 text-center text-sm text-muted-foreground">
                            Nenhum usuário disponível
                          </div>
                        ) : (
                          availableUsers.map((user: User) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Presidente">Presidente</SelectItem>
                        <SelectItem value="Vice-Presidente">
                          Vice-Presidente
                        </SelectItem>
                        <SelectItem value="Secretário">Secretário</SelectItem>
                        <SelectItem value="Membro">Membro</SelectItem>
                        <SelectItem value="Consultor">Consultor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddMemberDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    addMemberMutation.isPending || availableUsers.length === 0
                  }
                >
                  {addMemberMutation.isPending ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Adicionando...
                    </>
                  ) : (
                    "Adicionar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}