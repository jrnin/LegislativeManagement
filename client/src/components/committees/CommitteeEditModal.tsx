import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { format } from "date-fns";
import { Committee, User } from "@shared/schema";
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

interface CommitteeEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  committee: Committee | null;
}

export default function CommitteeEditModal({
  open,
  onOpenChange,
  committee,
}: CommitteeEditModalProps) {
  const { toast } = useToast();
  const [selectedMembers, setSelectedMembers] = useState<{userId: string, role: string}[]>([]);

  const { data: councilors = [], isLoading: isLoadingCouncilors } = useQuery({
    queryKey: ["/api/councilors"],
    enabled: open,
  });

  const { data: committeeMembers = [] } = useQuery({
    queryKey: ["/api/committees", committee?.id, "members"],
    enabled: open && Boolean(committee?.id),
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
    if (committee && open) {
      form.reset({
        name: committee.name,
        startDate: format(new Date(committee.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(committee.endDate), "yyyy-MM-dd"),
        description: committee.description,
        type: committee.type,
        members: [],
      });
    }
  }, [committee, form, open]);



  useEffect(() => {
    if (committeeMembers && committeeMembers.length > 0 && committee) {
      const members = committeeMembers.map((member: any) => ({
        userId: member.userId,
        role: member.role || "Membro"
      }));
      setSelectedMembers(members);
      form.setValue("members", members);
    }
  }, [committeeMembers, form, committee]);

  const onSubmit = async (data: CommitteeFormValues) => {
    if (!committee) return;

    try {
      const payload = {
        ...data,
        members: selectedMembers,
      };

      await apiRequest("PUT", `/api/committees/${committee.id}`, payload);

      toast({
        title: "Comissão atualizada",
        description: "A comissão foi atualizada com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/committees"] });
      onOpenChange(false);
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

  const handleMemberChange = (selectedValues: string[]) => {
    setSelectedMembers(selectedValues);
    form.setValue("members", selectedValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Comissão</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <div className="border rounded-md p-4">
                        <div className="text-sm font-medium mb-3">
                          Selecione os membros da comissão ({selectedMembers.length} selecionados)
                        </div>
                        <ScrollArea className="h-48">
                          <div className="space-y-3">
                            {Array.isArray(councilors) && councilors.length > 0 ? (
                              councilors.map((councilor: User) => {
                                const memberData = selectedMembers.find(m => m.userId === councilor.id);
                                const isSelected = !!memberData;
                                
                                return (
                                  <div key={councilor.id} className="border rounded p-3 bg-gray-50">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Checkbox
                                        id={`councilor-${councilor.id}`}
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            const newMember = { userId: councilor.id, role: "Membro" };
                                            const newMembers = [...selectedMembers, newMember];
                                            setSelectedMembers(newMembers);
                                            form.setValue("members", newMembers);
                                          } else {
                                            const newMembers = selectedMembers.filter(m => m.userId !== councilor.id);
                                            setSelectedMembers(newMembers);
                                            form.setValue("members", newMembers);
                                          }
                                        }}
                                      />
                                      <label
                                        htmlFor={`councilor-${councilor.id}`}
                                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                                      >
                                        {councilor.name}
                                      </label>
                                    </div>
                                    {isSelected && (
                                      <div className="ml-6">
                                        <Select
                                          value={memberData.role}
                                          onValueChange={(value) => {
                                            const newMembers = selectedMembers.map(m => 
                                              m.userId === councilor.id ? { ...m, role: value } : m
                                            );
                                            setSelectedMembers(newMembers);
                                            form.setValue("members", newMembers);
                                          }}
                                        >
                                          <SelectTrigger className="w-full h-8">
                                            <SelectValue placeholder="Selecione a função" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {COMMITTEE_ROLES.map((role) => (
                                              <SelectItem key={role} value={role}>
                                                {role}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-sm text-muted-foreground">
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
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Atualizar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}