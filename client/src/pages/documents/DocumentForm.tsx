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
import { Document, LegislativeActivity, Event, User } from "@shared/schema";
import { formatDate } from "@/utils/formatters";
import { File, FileCheck, Upload, History, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  documentNumber: z.coerce.number().int().positive({ message: "Número do documento deve ser positivo" }),
  documentType: z.string().min(1, { message: "Tipo de documento é obrigatório" }),
  documentDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  authorType: z.string().min(1, { message: "Tipo de autor é obrigatório" }),
  authorId: z.string().optional(),
  description: z.string().min(3, { message: "Descrição é obrigatória" }),
  status: z.string().min(1, { message: "Situação é obrigatória" }),
  activityId: z.coerce.number().optional(),
  eventId: z.coerce.number().optional(),
  parentDocumentId: z.coerce.number().optional(),
  file: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function DocumentForm() {
  const [location, navigate] = useLocation();
  const params = useParams();
  const documentId = params.id;
  const isEditing = !!documentId;
  const { toast } = useToast();
  const [formFile, setFormFile] = useState<File | null>(null);
  
  const urlParams = new URLSearchParams(window.location.search);
  const eventIdFromUrl = urlParams.get('eventId');

  const { data: activities = [] } = useQuery<LegislativeActivity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: councilors = [] } = useQuery<User[]>({
    queryKey: ["/api/councilors"],
  });

  const { data: existingDocument } = useQuery<Document>({
    queryKey: ["/api/documents", documentId],
    enabled: isEditing,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentNumber: 1,
      documentType: "",
      documentDate: new Date().toISOString().split('T')[0],
      authorType: "",
      authorId: "",
      description: "",
      status: "",
      activityId: undefined,
      eventId: eventIdFromUrl ? parseInt(eventIdFromUrl) : undefined,
      parentDocumentId: undefined,
    },
  });

  useEffect(() => {
    if (existingDocument && isEditing) {
      form.reset({
        documentNumber: existingDocument.documentNumber,
        documentType: existingDocument.documentType,
        documentDate: new Date(existingDocument.documentDate).toISOString().split('T')[0],
        authorType: existingDocument.authorType,
        description: existingDocument.description,
        status: existingDocument.status,
        activityId: existingDocument.activityId || undefined,
        eventId: existingDocument.eventId || undefined,
        parentDocumentId: existingDocument.parentDocumentId || undefined,
      });
    }
  }, [existingDocument, isEditing, form]);

  const createDocumentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      formData.append("documentNumber", data.documentNumber.toString());
      formData.append("documentType", data.documentType);
      formData.append("documentDate", data.documentDate);
      formData.append("authorType", data.authorType);
      formData.append("description", data.description);
      formData.append("status", data.status);
      
      if (data.authorId) formData.append("authorId", data.authorId);
      if (data.activityId) formData.append("activityId", data.activityId.toString());
      if (data.eventId) formData.append("eventId", data.eventId.toString());
      if (data.parentDocumentId) formData.append("parentDocumentId", data.parentDocumentId.toString());
      if (formFile) formData.append("file", formFile);

      return fetch("/api/documents", {
        method: "POST",
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Documento criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      navigate("/documents");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar documento",
        variant: "destructive",
      });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      formData.append("documentNumber", data.documentNumber.toString());
      formData.append("documentType", data.documentType);
      formData.append("documentDate", data.documentDate);
      formData.append("authorType", data.authorType);
      formData.append("description", data.description);
      formData.append("status", data.status);
      
      if (data.authorId) formData.append("authorId", data.authorId);
      if (data.activityId) formData.append("activityId", data.activityId.toString());
      if (data.eventId) formData.append("eventId", data.eventId.toString());
      if (data.parentDocumentId) formData.append("parentDocumentId", data.parentDocumentId.toString());
      if (formFile) formData.append("file", formFile);

      return fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Documento atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      navigate("/documents");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar documento",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateDocumentMutation.mutate(data);
    } else {
      createDocumentMutation.mutate(data);
    }
  };

  const isPending = createDocumentMutation.isPending || updateDocumentMutation.isPending;

  return (
    <div className="container px-4 sm:px-6 lg:px-8 mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate("/documents")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? "Editar Documento" : "Novo Documento"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Documento</CardTitle>
          <CardDescription>
            Preencha os dados do documento legislativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="documentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Documento</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Documento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pauta">Pauta</SelectItem>
                          <SelectItem value="Decreto">Decreto</SelectItem>
                          <SelectItem value="Decreto Legislativo">Decreto Legislativo</SelectItem>
                          <SelectItem value="Lei Complementar">Lei Complementar</SelectItem>
                          <SelectItem value="Oficio">Ofício</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="documentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Documento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situação</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a situação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Vigente">Vigente</SelectItem>
                          <SelectItem value="Revogada">Revogada</SelectItem>
                          <SelectItem value="Alterada">Alterada</SelectItem>
                          <SelectItem value="Suspenso">Suspenso</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="authorType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Autor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de autor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Legislativo">Legislativo</SelectItem>
                          <SelectItem value="Executivo">Executivo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="authorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vereador (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um vereador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhum vereador</SelectItem>
                          {councilors.map((councilor) => (
                            <SelectItem key={councilor.id} value={councilor.id}>
                              {councilor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        placeholder="Digite a descrição do documento..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {activities.length > 0 && (
                <FormField
                  control={form.control}
                  name="activityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atividade Legislativa (Opcional)</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma atividade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhuma atividade</SelectItem>
                          {activities.map((activity) => (
                            <SelectItem key={activity.id} value={activity.id.toString()}>
                              {activity.description || `Atividade ${activity.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {events.length > 0 && (
                <FormField
                  control={form.control}
                  name="eventId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Evento (Opcional)</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um evento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhum evento</SelectItem>
                          {events.map((event) => (
                            <SelectItem key={event.id} value={event.id.toString()}>
                              {event.description || `Evento ${event.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div>
                <FormLabel>Arquivo (Opcional)</FormLabel>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-300" />
                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>Carregar arquivo</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormFile(file);
                            }
                          }}
                        />
                      </label>
                      <p className="pl-1">ou arraste e solte</p>
                    </div>
                    <p className="text-xs leading-5 text-gray-600">
                      PDF, DOC, DOCX, TXT até 10MB
                    </p>
                    {formFile && (
                      <div className="mt-2">
                        <Badge variant="secondary">{formFile.name}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate("/documents")}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}