import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import PageHeader from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Schema para validação do formulário
const formSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  type: z.string().min(1, "O tipo é obrigatório."),
  startDate: z.date({ required_error: "A data de início é obrigatória." }),
  endDate: z.date({ required_error: "A data de término é obrigatória." }).refine(
    (date, ctx) => {
      const startDate = ctx.path.find(p => p === "startDate") 
        ? date 
        : (ctx.data as any)?.startDate;
      
      if (!startDate) return true;
      return date >= startDate;
    },
    { message: "A data de término deve ser posterior à data de início." }
  ),
  description: z.string().min(5, "A descrição deve ter pelo menos 5 caracteres."),
  members: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CommitteeForm() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [openStartDate, setOpenStartDate] = useState(false);
  const [openEndDate, setOpenEndDate] = useState(false);
  const [openMembers, setOpenMembers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  const isEditing = !!id;
  const isAdmin = user?.role === "admin";
  
  // Buscar dados da comissão se estiver editando
  const { data: committee, isLoading: isLoadingCommittee } = useQuery({
    queryKey: [`/api/committees/${id}`],
    enabled: isEditing,
  });
  
  // Buscar todos os vereadores para selecionar membros
  const { data: councilors = [], isLoading: isLoadingCouncilors } = useQuery({
    queryKey: ["/api/councilors"],
  });
  
  // Inicializar formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
      members: [],
    },
  });
  
  // Mutação para criar/atualizar comissão
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const url = isEditing ? `/api/committees/${id}` : "/api/committees";
      const method = isEditing ? "PUT" : "POST";
      
      // Converter datas para string
      const data = {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        members: selectedMembers,
      };
      
      return apiRequest(url, {
        method,
        data,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/committees"] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: [`/api/committees/${id}`] });
      }
      
      toast({
        title: isEditing ? "Comissão atualizada" : "Comissão criada",
        description: isEditing
          ? "A comissão foi atualizada com sucesso."
          : "A comissão foi criada com sucesso.",
      });
      
      navigate(isEditing ? `/committees/${id}` : "/committees");
    },
    onError: (error: any) => {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar a comissão.",
      });
    },
  });
  
  // Preencher o formulário com dados existentes quando estiver editando
  useEffect(() => {
    if (isEditing && committee) {
      form.reset({
        name: committee.name,
        type: committee.type,
        description: committee.description,
        startDate: new Date(committee.startDate),
        endDate: new Date(committee.endDate),
      });
      
      if (committee.members) {
        const memberIds = committee.members.map((member: any) => member.userId);
        setSelectedMembers(memberIds);
        form.setValue("members", memberIds);
      }
    }
  }, [committee, form, isEditing]);
  
  // Lidar com o envio do formulário
  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };
  
  // Formatar ID e nome do usuário para exibição
  const formatUser = (user: any) => ({
    value: user.id,
    label: user.name,
  });
  
  // Verificar se um usuário está selecionado
  const isSelected = (userId: string) => selectedMembers.includes(userId);
  
  // Alternar a seleção de um usuário
  const toggleMember = (userId: string) => {
    setSelectedMembers((current) => {
      const updated = isSelected(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId];
      
      form.setValue("members", updated);
      return updated;
    });
  };
  
  // Carregar página/formulário
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-2">Acesso restrito</h2>
        <p className="text-muted-foreground mb-6">
          Apenas administradores podem criar ou editar comissões.
        </p>
        <Button onClick={() => navigate("/committees")}>
          Voltar para comissões
        </Button>
      </div>
    );
  }
  
  if (isEditing && isLoadingCommittee) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={isEditing ? "Editar Comissão" : "Nova Comissão"}
        description={isEditing ? "Atualizar informações da comissão" : "Criar uma nova comissão"}
        backLink="/committees"
      />
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Comissão" : "Nova Comissão"}</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome da comissão" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Permanente">Permanente</SelectItem>
                        <SelectItem value="Temporária">Temporária</SelectItem>
                        <SelectItem value="Extraordinária">Extraordinária</SelectItem>
                        <SelectItem value="Processante">Processante</SelectItem>
                        <SelectItem value="Especial">Especial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Início</FormLabel>
                      <Popover open={openStartDate} onOpenChange={setOpenStartDate}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setOpenStartDate(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Término</FormLabel>
                      <Popover open={openEndDate} onOpenChange={setOpenEndDate}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setOpenEndDate(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Descrição detalhada da comissão e suas finalidades"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="members"
                render={() => (
                  <FormItem>
                    <FormLabel>Membros</FormLabel>
                    <Popover open={openMembers} onOpenChange={setOpenMembers}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !selectedMembers.length && "text-muted-foreground"
                            )}
                          >
                            {selectedMembers.length
                              ? `${selectedMembers.length} membro(s) selecionado(s)`
                              : "Selecione os membros"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        {isLoadingCouncilors ? (
                          <div className="flex justify-center items-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <Command>
                            <CommandInput placeholder="Buscar vereador..." />
                            <CommandEmpty>Nenhum vereador encontrado.</CommandEmpty>
                            <CommandGroup>
                              <ScrollArea className="h-72">
                                {councilors.map((councilor: any) => (
                                  <CommandItem
                                    key={councilor.id}
                                    value={councilor.id}
                                    onSelect={() => toggleMember(councilor.id)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        checked={isSelected(councilor.id)}
                                        onCheckedChange={() => toggleMember(councilor.id)}
                                        id={`member-${councilor.id}`}
                                      />
                                      <label
                                        htmlFor={`member-${councilor.id}`}
                                        className="flex-1 cursor-pointer"
                                      >
                                        {councilor.name}
                                      </label>
                                    </div>
                                    {isSelected(councilor.id) && (
                                      <Check className="h-4 w-4 ml-auto" />
                                    )}
                                  </CommandItem>
                                ))}
                              </ScrollArea>
                            </CommandGroup>
                          </Command>
                        )}
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Selecione os vereadores que farão parte desta comissão.
                      Você poderá adicionar ou remover membros posteriormente.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/committees")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
}