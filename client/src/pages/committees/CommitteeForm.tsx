import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CalendarIcon, ArrowLeft } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

// Schema de validação do formulário
const committeeSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres"),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres")
    .max(500, "A descrição deve ter no máximo 500 caracteres"),
  type: z.enum(["Permanente", "Temporária", "Extraordinária"], {
    required_error: "Selecione um tipo de comissão",
  }),
  startDate: z.date({
    required_error: "Selecione a data de início",
  }),
  endDate: z.date({
    required_error: "Selecione a data de término",
  }),
  active: z.boolean().default(true),
}).refine(data => {
  // Validação adicional: a data de término deve ser posterior à data de início
  return data.endDate >= data.startDate;
}, {
  message: "A data de término deve ser posterior à data de início",
  path: ["endDate"],
});

// Tipo inferido do schema
type CommitteeFormValues = z.infer<typeof committeeSchema>;

interface Committee {
  id: number;
  name: string;
  description: string;
  type: "Permanente" | "Temporária" | "Extraordinária";
  startDate: string | Date;
  endDate: string | Date;
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export function CommitteeForm() {
  const [location] = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Verifica se o usuário é administrador
  const isAdmin = user?.role === 'admin';
  
  // Extrai o ID da comissão da URL, se estiver editando
  const committeeId = location.includes("/edit") 
    ? location.split("/").slice(-2)[0] 
    : null;
  
  // Configuração do formulário com valores padrão
  const form = useForm<CommitteeFormValues>({
    resolver: zodResolver(committeeSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "Permanente" as const,
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 ano depois
      active: true,
    },
  });
  
  // Consulta a comissão se estiver no modo de edição
  const { data: committee, isLoading, error } = useQuery({
    queryKey: [`/api/committees/${committeeId}`],
    enabled: !!committeeId,
  });
  
  // Preenche o formulário com dados da comissão quando disponíveis
  useEffect(() => {
    if (committee && committeeId) {
      setIsEditing(true);
      
      form.reset({
        name: committee.name,
        description: committee.description,
        type: committee.type as "Permanente" | "Temporária" | "Extraordinária",
        startDate: new Date(committee.startDate),
        endDate: new Date(committee.endDate),
        active: committee.active,
      });
    }
  }, [committee, form, committeeId]);
  
  // Mutação para criar uma nova comissão
  const createCommitteeMutation = useMutation({
    mutationFn: (data: CommitteeFormValues) => 
      apiRequest("/api/committees", {
        method: "POST",
        data,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/committees"] });
      toast({
        title: "Comissão criada",
        description: "A comissão foi criada com sucesso.",
        variant: "success",
      });
      navigate(`/committees/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao criar a comissão.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });
  
  // Mutação para atualizar uma comissão existente
  const updateCommitteeMutation = useMutation({
    mutationFn: (data: CommitteeFormValues) => 
      apiRequest(`/api/committees/${committeeId}`, {
        method: "PUT",
        data,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/committees"] });
      queryClient.invalidateQueries({ queryKey: [`/api/committees/${committeeId}`] });
      toast({
        title: "Comissão atualizada",
        description: "A comissão foi atualizada com sucesso.",
        variant: "success",
      });
      navigate(`/committees/${committeeId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao atualizar a comissão.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });
  
  // Handler para envio do formulário
  const onSubmit = async (values: CommitteeFormValues) => {
    if (!isAuthenticated || !isAdmin) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para realizar esta ação.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditing && committeeId) {
        updateCommitteeMutation.mutate(values);
      } else {
        createCommitteeMutation.mutate(values);
      }
    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a solicitação.",
        variant: "destructive",
      });
    }
  };
  
  // Renderiza o estado de carregamento
  if (isLoading && isEditing) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }
  
  // Renderiza o erro quando não consegue carregar os dados para edição
  if (error && isEditing) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold">Erro ao carregar comissão</h3>
          <p className="text-muted-foreground">Ocorreu um erro ao buscar os detalhes da comissão para edição.</p>
          <Button className="mt-4" onClick={() => navigate("/committees")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para comissões
          </Button>
        </div>
      </div>
    );
  }
  
  // Se não for admin, redireciona para a lista de comissões
  if (!isAdmin) {
    navigate("/committees");
    return null;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/committees')} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? "Editar Comissão" : "Nova Comissão"}
        </h1>
      </div>
      
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Comissão" : "Nova Comissão"}</CardTitle>
          <CardDescription>
            {isEditing 
              ? "Atualize as informações da comissão legislativa" 
              : "Preencha os detalhes para criar uma nova comissão legislativa"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Comissão</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Comissão de Finanças" {...field} />
                    </FormControl>
                    <FormDescription>
                      O nome completo da comissão.
                    </FormDescription>
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
                        placeholder="Descreva a finalidade e objetivos da comissão" 
                        {...field} 
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>
                      Uma descrição detalhada sobre o propósito e competências da comissão.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Comissão</FormLabel>
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
                        <SelectItem value="Extraordinária">Extraordinária</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      O tipo define a natureza e duração da comissão.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Início</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                formatDate(field.value)
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Data de início das atividades.
                      </FormDescription>
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                formatDate(field.value)
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Data prevista para término.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Comissão Ativa</FormLabel>
                      <FormDescription>
                        Marque esta opção se a comissão está atualmente em atividade.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <CardFooter className="flex justify-end space-x-2 px-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/committees')}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Spinner className="mr-2" size="sm" />}
                  {isEditing ? "Atualizar" : "Criar"} Comissão
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}