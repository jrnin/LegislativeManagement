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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LegislativeActivity, Event, User } from "@shared/schema";
import { formatDate } from "@/utils/formatters";
import { File, FileCheck, Upload } from "lucide-react";

const formSchema = z.object({
  activityNumber: z.coerce.number().int().positive({ message: "Número da atividade deve ser positivo" }),
  activityDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  description: z.string().min(3, { message: "Descrição é obrigatória" }),
  eventId: z.coerce.number().int().positive({ message: "Evento é obrigatório" }),
  activityType: z.string().min(1, { message: "Tipo de atividade é obrigatório" }),
  needsApproval: z.boolean().default(false),
  authorIds: z.array(z.string()).min(1, { message: "Pelo menos um autor deve ser selecionado" }),
  file: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ActivityForm() {
  const [_, navigate] = useLocation();
  const params = useParams();
  const activityId = params.id;
  const isEditing = !!activityId;
  const { toast } = useToast();
  const [formFile, setFormFile] = useState<File | null>(null);

  const { data: activity, isLoading: activityLoading } = useQuery<LegislativeActivity>({
    queryKey: [`/api/activities/${activityId}`],
    enabled: !!activityId,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Filter only councilors for authorship
  const councilors = users.filter(user => user.role === "councilor");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activityNumber: 0,
      activityDate: new Date().toISOString().split('T')[0],
      description: "",
      eventId: 0,
      activityType: "",
      needsApproval: false,
      authorIds: [],
      file: undefined,
    }
  });

  useEffect(() => {
    if (activity) {
      form.reset({
        activityNumber: activity.activityNumber,
        activityDate: activity.activityDate ? 
          (typeof activity.activityDate === 'string' 
            ? activity.activityDate.split('T')[0] 
            : new Date(activity.activityDate).toISOString().split('T')[0]
          ) : "",
        description: activity.description || "",
        eventId: activity.eventId,
        activityType: activity.activityType || "",
        needsApproval: activity.needsApproval || false,
        authorIds: activity.authors ? activity.authors.map(author => author.id) : [],
        file: undefined,
      });
    }
  }, [activity, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Append basic fields
      formData.append("activityNumber", data.activityNumber.toString());
      formData.append("activityDate", data.activityDate);
      formData.append("description", data.description);
      formData.append("eventId", data.eventId.toString());
      formData.append("activityType", data.activityType);
      formData.append("needsApproval", data.needsApproval.toString());
      
      // Append authors
      data.authorIds.forEach(authorId => {
        formData.append("authorIds", authorId);
      });
      
      // Append file if present
      if (formFile) {
        formData.append("file", formFile);
      }
      
      const response = await fetch("/api/activities", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Atividade criada",
        description: "A atividade legislativa foi criada com sucesso.",
      });
      navigate(`/activities/${data.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar atividade",
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Append basic fields
      if (data.activityNumber) formData.append("activityNumber", data.activityNumber.toString());
      if (data.activityDate) formData.append("activityDate", data.activityDate);
      if (data.description) formData.append("description", data.description);
      if (data.eventId) formData.append("eventId", data.eventId.toString());
      if (data.activityType) formData.append("activityType", data.activityType);
      formData.append("needsApproval", data.needsApproval.toString());
      
      // Append authors
      data.authorIds.forEach(authorId => {
        formData.append("authorIds", authorId);
      });
      
      // Append file if present
      if (formFile) {
        formData.append("file", formFile);
      }
      
      const response = await fetch(`/api/activities/${activityId}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Atividade atualizada",
        description: "As informações da atividade foram atualizadas com sucesso.",
      });
      navigate(`/activities/${activityId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}`] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar atividade",
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormFile(e.target.files[0]);
    }
  };

  const activityTypes = [
    "Pauta", 
    "Indicação", 
    "Requerimento", 
    "Resolução", 
    "Mensagem", 
    "Moção", 
    "Projeto de Lei"
  ];

  if (activityLoading) {
    return <div className="flex justify-center items-center h-96">Carregando...</div>;
  }

  return (
    <div className="container px-4 sm:px-6 lg:px-8 mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? "Editar Atividade Legislativa" : "Nova Atividade Legislativa"}
        </h1>
        <Button variant="outline" onClick={() => navigate("/activities")}>
          Voltar
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Atividade Legislativa" : "Nova Atividade Legislativa"}</CardTitle>
          <CardDescription>
            {isEditing 
              ? "Altere as informações da atividade legislativa nos campos abaixo." 
              : "Preencha os campos abaixo para criar uma nova atividade legislativa."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Informações Básicas</h3>
                <Separator />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="activityNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Atividade</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="activityDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Atividade</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="activityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo da Atividade</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activityTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
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
                        placeholder="Descrição da atividade legislativa" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Evento e Aprovação</h3>
                <Separator />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="eventId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Evento</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um evento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {events.map((event) => (
                            <SelectItem key={event.id} value={event.id.toString()}>
                              {event.category} #{event.eventNumber} - {formatDate(event.eventDate.toString())}
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
                  name="needsApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Requer Aprovação</FormLabel>
                        <FormDescription>
                          Marque esta opção se a atividade necessita ser aprovada pelos vereadores
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Autores</h3>
                <Separator />
              </div>
              
              <FormField
                control={form.control}
                name="authorIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Autores</FormLabel>
                    <FormDescription>
                      Selecione um ou mais vereadores como autores desta atividade
                    </FormDescription>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                      {councilors.map((councilor) => (
                        <div key={councilor.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`author-${councilor.id}`}
                            checked={field.value.includes(councilor.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, councilor.id]);
                              } else {
                                field.onChange(field.value.filter(id => id !== councilor.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`author-${councilor.id}`}
                            className="flex items-center space-x-2 text-sm font-medium leading-none cursor-pointer"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={councilor.profileImageUrl || ""} />
                              <AvatarFallback>{councilor.name ? councilor.name.charAt(0) : "U"}</AvatarFallback>
                            </Avatar>
                            <span>{councilor.name}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Arquivo</h3>
                <Separator />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <FormLabel htmlFor="file">Documento</FormLabel>
                  <div className="mt-2">
                    <div className="flex items-center justify-center w-full">
                      <label 
                        htmlFor="file-upload" 
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                      >
                        {formFile ? (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FileCheck className="w-8 h-8 mb-3 text-green-500" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">{formFile.name}</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              {(formFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT (max. 10MB)
                            </p>
                          </div>
                        )}
                        <input 
                          id="file-upload" 
                          type="file" 
                          className="hidden" 
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        />
                      </label>
                    </div>
                  </div>
                  {activity && activity.fileName && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Arquivo atual:</p>
                      <div className="flex items-center mt-1">
                        <File className="w-4 h-4 mr-2 text-gray-500" />
                        <a 
                          href={`/api/files/activities/${activity.id}`} 
                          className="text-sm text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {activity.fileName}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => navigate("/activities")}
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
