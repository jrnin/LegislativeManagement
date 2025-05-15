import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Esquema de validação para o formulário
const committeeSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres"),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres")
    .max(1000, "A descrição deve ter no máximo 1000 caracteres"),
  active: z.boolean().default(true),
});

type CommitteeFormValues = z.infer<typeof committeeSchema>;

export default function CommitteeForm() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = params.id !== undefined;
  const id = params.id;

  // Estado para controlar carregamento inicial
  const [initialLoading, setInitialLoading] = useState(isEditing);

  // Buscar detalhes da comissão para edição
  const { data: committee, isLoading: isLoadingCommittee } = useQuery({
    queryKey: [`/api/committees/${id}`],
    enabled: isEditing,
    onSuccess: (data) => {
      if (data) {
        // Preencher o formulário com os dados da comissão
        form.reset({
          name: data.name,
          description: data.description,
          active: data.active,
        });
        setInitialLoading(false);
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da comissão.",
        variant: "destructive",
      });
      setInitialLoading(false);
    },
  });

  // Definir formulário
  const form = useForm<CommitteeFormValues>({
    resolver: zodResolver(committeeSchema),
    defaultValues: {
      name: "",
      description: "",
      active: true,
    },
  });

  // Mutação para criar/editar comissão
  const committeeMutation = useMutation({
    mutationFn: async (values: CommitteeFormValues) => {
      const url = isEditing
        ? `/api/committees/${id}`
        : "/api/committees";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao salvar comissão");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: isEditing ? "Comissão atualizada" : "Comissão criada",
        description: isEditing
          ? "As alterações foram salvas com sucesso"
          : "A comissão foi criada com sucesso",
      });

      // Invalidar queries para atualizar os dados
      queryClient.invalidateQueries({ queryKey: ["/api/committees"] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: [`/api/committees/${id}`] });
      }

      // Redirecionar para a página de detalhes ou listagem
      if (isEditing) {
        navigate(`/committees/${id}`);
      } else if (data && data.id) {
        navigate(`/committees/${data.id}`);
      } else {
        navigate("/committees");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar a comissão",
        variant: "destructive",
      });
    },
  });

  // Função para submeter o formulário
  const onSubmit = (values: CommitteeFormValues) => {
    committeeMutation.mutate(values);
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
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
              {isEditing ? "Editar Comissão" : "Nova Comissão"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? "Edite as informações da comissão existente"
                : "Preencha os dados para criar uma nova comissão"}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Comissão</CardTitle>
          <CardDescription>
            Preencha os detalhes da comissão abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              id="committee-form"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome da comissão"
                        {...field}
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormDescription>
                      Nome oficial da comissão
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
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Descrição da função e responsabilidades da comissão
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status da Comissão</FormLabel>
                      <FormDescription>
                        Define se a comissão está ativa ou inativa
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() =>
              isEditing
                ? navigate(`/committees/${id}`)
                : navigate("/committees")
            }
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="committee-form"
            disabled={committeeMutation.isPending || form.formState.isSubmitting}
          >
            {committeeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Salvando..." : "Criando..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Salvar Alterações" : "Criar Comissão"}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}