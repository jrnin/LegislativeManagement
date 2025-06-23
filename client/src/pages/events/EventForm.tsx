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
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { Event, Legislature, Committee } from "@shared/schema";
import { MapPin } from "lucide-react";

const formSchema = z.object({
  eventNumber: z.coerce.number().int().positive({ message: "Número do evento deve ser positivo" }),
  eventDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  eventTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Formato de horário inválido. Use HH:MM" }),
  location: z.string().min(3, { message: "Local é obrigatório" }),
  mapUrl: z.string().url({ message: "URL inválida" }).optional().or(z.literal("")),
  videoUrl: z.string().url({ message: "URL do YouTube inválida" }).optional().or(z.literal("")),
  category: z.enum(["Sessão Ordinária", "Sessão Extraordinária", "Reunião Comissão"], { 
    message: "Selecione uma categoria válida" 
  }),
  committeeIds: z.array(z.coerce.number()).optional(),
  legislatureId: z.coerce.number().int().positive({ message: "Legislatura é obrigatória" }),
  description: z.string().min(3, { message: "Descrição é obrigatória" }),
  status: z.enum(["Aberto", "Andamento", "Concluido", "Cancelado"], { 
    message: "Selecione um status válido" 
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function EventForm() {
  const [_, navigate] = useLocation();
  const params = useParams();
  const eventId = params.id;
  const isEditing = !!eventId;
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });

  const { data: legislatures = [] } = useQuery<Legislature[]>({
    queryKey: ["/api/legislatures"],
  });

  const { data: committees = [] } = useQuery<Committee[]>({
    queryKey: ["/api/committees"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventNumber: 0,
      eventDate: "",
      eventTime: "",
      location: "",
      mapUrl: "",
      videoUrl: "",
      category: "Sessão Ordinária",
      committeeIds: [],
      legislatureId: undefined,
      description: "",
      status: "Aberto",
    }
  });

  useEffect(() => {
    if (event) {
      form.reset({
        eventNumber: event.eventNumber,
        eventDate: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : "",
        eventTime: event.eventTime || "",
        location: event.location || "",
        mapUrl: event.mapUrl || "",
        videoUrl: event.videoUrl || "",
        category: event.category as "Sessão Ordinária" | "Sessão Extraordinária",
        legislatureId: event.legislatureId,
        description: event.description || "",
        status: event.status as "Aberto" | "Andamento" | "Concluido" | "Cancelado",
      });
    }
  }, [event, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("POST", "/api/events", data);
    },
    onSuccess: () => {
      toast({
        title: "Evento criado",
        description: "O evento foi criado com sucesso.",
      });
      navigate("/events");
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar evento",
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("PUT", `/api/events/${eventId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Evento atualizado",
        description: "As informações do evento foram atualizadas com sucesso.",
      });
      navigate("/events");
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar evento",
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

  // Não há mais restrições para usuários do tipo "Vereador" acessarem o formulário de eventos

  if (eventLoading) {
    return <div className="flex justify-center items-center h-96">Carregando...</div>;
  }

  return (
    <div className="container px-4 sm:px-6 lg:px-8 mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? "Editar Evento" : "Novo Evento"}
        </h1>
        <Button variant="outline" onClick={() => navigate("/events")}>
          Voltar
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Evento" : "Novo Evento"}</CardTitle>
          <CardDescription>
            {isEditing 
              ? "Altere as informações do evento nos campos abaixo." 
              : "Preencha os campos abaixo para criar um novo evento."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Informações do Evento</h3>
                <Separator />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="eventNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Evento</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormDescription>
                        Número sequencial do evento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Evento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="eventTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário do Evento</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria do Evento</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Sessão Ordinária">Sessão Ordinária</SelectItem>
                          <SelectItem value="Sessão Extraordinária">Sessão Extraordinária</SelectItem>
                          <SelectItem value="Reunião Comissão">Reunião Comissão</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Conditional Committee Selection for "Reunião Comissão" */}
                {form.watch("category") === "Reunião Comissão" && (
                  <FormField
                    control={form.control}
                    name="committeeIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comissões</FormLabel>
                        <FormDescription>
                          Selecione uma ou mais comissões para esta reunião
                        </FormDescription>
                        <div className="grid grid-cols-2 gap-2 p-4 border rounded-md">
                          {committees.map((committee) => (
                            <div key={committee.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`committee-${committee.id}`}
                                checked={(field.value || []).includes(committee.id)}
                                onCheckedChange={(checked) => {
                                  const currentIds = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentIds, committee.id]);
                                  } else {
                                    field.onChange(currentIds.filter(id => id !== committee.id));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`committee-${committee.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {committee.name}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="legislatureId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legislatura</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(Number(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma legislatura" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {legislatures.map((legislature) => (
                            <SelectItem key={legislature.id} value={legislature.id.toString()}>
                              {legislature.number}ª Legislatura ({new Date(legislature.startDate).toISOString().split('T')[0]} - {new Date(legislature.endDate).toISOString().split('T')[0]})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status do Evento</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Aberto">Aberto</SelectItem>
                          <SelectItem value="Andamento">Em Andamento</SelectItem>
                          <SelectItem value="Concluido">Concluído</SelectItem>
                          <SelectItem value="Cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Local do Evento</h3>
                <Separator />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <FormControl>
                        <Input placeholder="Local do evento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mapUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link do Google Maps</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Input placeholder="https://maps.google.com/..." {...field} />
                          {field.value && (
                            <a 
                              href={field.value} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center ml-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                            >
                              <MapPin className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Link do Google Maps para o local do evento (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link do Vídeo no YouTube</FormLabel>
                    <FormControl>
                      <Input placeholder="https://youtube.com/watch?v=..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Link do YouTube para o vídeo da sessão (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Detalhes</h3>
                <Separator />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Evento</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição detalhada do evento" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => navigate("/events")}
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
