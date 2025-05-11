import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { Legislature } from "@shared/schema";

const formSchema = z.object({
  number: z.coerce.number().int().positive({ message: "Número da legislatura deve ser positivo" }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data de início inválida" }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data de fim inválida" })
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: "A data de fim deve ser posterior à data de início",
  path: ["endDate"],
});

type FormData = z.infer<typeof formSchema>;

export default function LegislatureForm() {
  const [_, navigate] = useLocation();
  const params = useParams();
  const legislatureId = params.id;
  const isEditing = !!legislatureId;
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: legislature, isLoading: legislatureLoading } = useQuery<Legislature>({
    queryKey: [`/api/legislatures/${legislatureId}`],
    enabled: !!legislatureId,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      number: 0,
      startDate: "",
      endDate: "",
    }
  });

  useEffect(() => {
    if (legislature) {
      form.reset({
        number: legislature.number,
        startDate: legislature.startDate ? legislature.startDate.split('T')[0] : "",
        endDate: legislature.endDate ? legislature.endDate.split('T')[0] : "",
      });
    }
  }, [legislature, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("POST", "/api/legislatures", data);
    },
    onSuccess: () => {
      toast({
        title: "Legislatura criada",
        description: "A legislatura foi criada com sucesso.",
      });
      navigate("/legislatures");
      queryClient.invalidateQueries({ queryKey: ["/api/legislatures"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar legislatura",
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("PUT", `/api/legislatures/${legislatureId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Legislatura atualizada",
        description: "As informações da legislatura foram atualizadas com sucesso.",
      });
      navigate("/legislatures");
      queryClient.invalidateQueries({ queryKey: ["/api/legislatures"] });
      queryClient.invalidateQueries({ queryKey: [`/api/legislatures/${legislatureId}`] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar legislatura",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Apenas administradores podem gerenciar legislaturas.",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  if (legislatureLoading) {
    return <div className="flex justify-center items-center h-96">Carregando...</div>;
  }

  return (
    <div className="container px-4 sm:px-6 lg:px-8 mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? "Editar Legislatura" : "Nova Legislatura"}
        </h1>
        <Button variant="outline" onClick={() => navigate("/legislatures")}>
          Voltar
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Legislatura" : "Nova Legislatura"}</CardTitle>
          <CardDescription>
            {isEditing 
              ? "Altere as informações da legislatura nos campos abaixo." 
              : "Preencha os campos abaixo para criar uma nova legislatura."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Legislatura</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormDescription>
                        Número ordinal da legislatura (ex: 12)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                      <FormLabel>Data de Fim</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => navigate("/legislatures")}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center gap-1">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                      Salvando...
                    </span>
                  ) : isEditing ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
