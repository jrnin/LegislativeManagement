import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InsertCommittee, Committee, User } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const committeeSchema = z.object({
  name: z.string().min(3, "Nome da comissão deve ter pelo menos 3 caracteres"),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data de início inválida",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data de término inválida",
  }),
  description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres"),
  type: z.string().min(1, "Tipo da comissão é obrigatório"),
  members: z.array(z.object({
    userId: z.string(),
    role: z.string(),
  })).optional(),
});

const COMMITTEE_ROLES = [
  "Presidente",
  "Vice-Presidente", 
  "Relator",
  "1º Suplente",
  "2º Suplente", 
  "3° Suplente",
  "Membro"
];

type CommitteeFormValues = z.infer<typeof committeeSchema>;

export default function CommitteeForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedMembers, setSelectedMembers] = useState<{userId: string, role: string}[]>([]);

  const { data: committee, isLoading } = useQuery({
    queryKey: ["/api/committees", id],
    enabled: isEditing,
  });

  const { data: councilors = [], isLoading: isLoadingCouncilors } = useQuery({
    queryKey: ["/api/councilors"],
  });

  const { data: committeeMembers = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ["/api/committees", id, "members"],
    enabled: isEditing,
  });

  const form = useForm<CommitteeFormValues>({
    resolver: zodResolver(committeeSchema),
    defaultValues: {
      name: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 6)), "yyyy-MM-dd"),
      description: "",
      type: "",
      members: [],
    },
  });

  useEffect(() => {
    if (committee && !form.formState.isDirty) {
      form.reset({
        name: committee.name,
        startDate: format(new Date(committee.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(committee.endDate), "yyyy-MM-dd"),
        description: committee.description,
        type: committee.type,
        members: [],
      });
    }
  }, [committee, form]);

  useEffect(() => {
    if (committeeMembers && committeeMembers.length > 0 && isEditing) {
      const memberIds = committeeMembers.map((member: any) => member.userId);
      setSelectedMembers(memberIds);
      form.setValue("members", memberIds);
    }
  }, [committeeMembers, form, isEditing]);

  const onSubmit = async (data: CommitteeFormValues) => {
    try {
      const payload = {
        ...data,
        members: selectedMembers,
      };

      if (isEditing) {
        await apiRequest("PUT", `/api/committees/${id}`, payload);

        toast({
          title: "Comissão atualizada",
          description: "A comissão foi atualizada com sucesso.",
          variant: "success",
        });
      } else {
        await apiRequest("POST", "/api/committees", payload);

        toast({
          title: "Comissão criada",
          description: "A comissão foi criada com sucesso.",
          variant: "success",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/committees"] });
      setLocation("/committees");
    } catch (error: any) {
      console.error("Erro ao salvar comissão:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Ocorreu um erro ao salvar a comissão.";
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleMemberToggle = (userId: string, checked: boolean) => {
    if (checked) {
      const newMember = { userId, role: "Membro" };
      const updatedMembers = [...selectedMembers, newMember];
      setSelectedMembers(updatedMembers);
      form.setValue("members", updatedMembers);
    } else {
      const updatedMembers = selectedMembers.filter(m => m.userId !== userId);
      setSelectedMembers(updatedMembers);
      form.setValue("members", updatedMembers);
    }
  };

  const handleRoleChange = (userId: string, role: string) => {
    const updatedMembers = selectedMembers.map(member =>
      member.userId === userId ? { ...member, role } : member
    );
    setSelectedMembers(updatedMembers);
    form.setValue("members", updatedMembers);
  };

  if (isLoading && isEditing) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {isEditing ? "Editar Comissão" : "Nova Comissão"}
        </h1>
        <Button variant="outline" onClick={() => setLocation("/committees")}>
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? "Editar Comissão" : "Cadastrar Nova Comissão"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Comissão</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da comissão" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Término</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo da Comissão</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo da comissão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Permanente">Permanente</SelectItem>
                        <SelectItem value="Temporária">Temporária</SelectItem>
                        <SelectItem value="Parlamentar de Inquérito">
                          Parlamentar de Inquérito
                        </SelectItem>
                        <SelectItem value="Representação">
                          Representação
                        </SelectItem>
                        <SelectItem value="Especial">Especial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva os objetivos e funções da comissão"
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="members"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Membros da Comissão</FormLabel>
                    <FormControl>
                        {isLoadingCouncilors ? (
                          <div className="flex items-center justify-center p-4">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                            <span className="ml-2 text-sm text-muted-foreground">Carregando vereadores...</span>
                          </div>
                        ) : (
                          <div className="border rounded-lg p-4 space-y-4">
                            <div className="text-sm text-muted-foreground mb-2">
                              Selecione os vereadores e defina suas funções na comissão:
                            </div>
                            <ScrollArea className="h-64">
                              <div className="space-y-3">
                                {Array.isArray(councilors) && councilors.length > 0 ? (
                                  councilors.map((councilor: User) => {
                                    const isSelected = selectedMembers.some(m => m.userId === councilor.id);
                                    const member = selectedMembers.find(m => m.userId === councilor.id);
                                    
                                    return (
                                      <div key={councilor.id} className="flex items-center space-x-3 p-2 border rounded">
                                        <Checkbox
                                          id={`member-${councilor.id}`}
                                          checked={isSelected}
                                          onCheckedChange={(checked) => 
                                            handleMemberToggle(councilor.id, checked as boolean)
                                          }
                                        />
                                        <div className="flex-1">
                                          <label
                                            htmlFor={`member-${councilor.id}`}
                                            className="text-sm font-medium cursor-pointer"
                                          >
                                            {councilor.name}
                                          </label>
                                        </div>
                                        {isSelected && (
                                          <Select
                                            value={member?.role || "Membro"}
                                            onValueChange={(value) => handleRoleChange(councilor.id, value)}
                                          >
                                            <SelectTrigger className="w-40">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {COMMITTEE_ROLES.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                  {role}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        )}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="p-2 text-muted-foreground text-sm text-center">
                                    {councilors ? "Nenhum vereador encontrado" : "Erro ao carregar vereadores"}
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/committees")}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {isEditing ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}