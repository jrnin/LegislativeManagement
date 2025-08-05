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
import { Document, LegislativeActivity, Event } from "@shared/schema";
import { formatDate } from "@/utils/formatters";
import { File, FileCheck, Upload, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const formSchema = z.object({
  documentNumber: z.coerce.number().int().positive({ message: "Número do documento deve ser positivo" }),
  documentType: z.string().min(1, { message: "Tipo de documento é obrigatório" }),
  documentDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  authorType: z.string().min(1, { message: "Tipo de autor é obrigatório" }),
  authorId: z.string().optional(), // ID do vereador selecionado
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
  const [uploadedFileURL, setUploadedFileURL] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [documentHistory, setDocumentHistory] = useState<Document[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Pegar eventId da URL (se presente)
  const urlParams = new URLSearchParams(window.location.search);
  const eventIdFromUrl = urlParams.get('eventId');

  const { data: document, isLoading: documentLoading } = useQuery<Document>({
    queryKey: [`/api/documents/${documentId}`],
    enabled: !!documentId,
  });

  const { data: activities = [] } = useQuery<LegislativeActivity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    select: (data) => data.filter(doc => doc.id !== Number(documentId)), // Exclude current document
  });

  const { data: councilors = [] } = useQuery({
    queryKey: ["/api/councilors"],
  });

  // Fetch document history if editing
  useEffect(() => {
    if (documentId) {
      const fetchHistory = async () => {
        try {
          const response = await fetch(`/api/documents/${documentId}/history`);
          if (response.ok) {
            const history = await response.json();
            setDocumentHistory(history);
          }
        } catch (error) {
          console.error("Error fetching document history:", error);
        }
      };
      
      fetchHistory();
    }
  }, [documentId]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentNumber: 0,
      documentType: "",
      documentDate: new Date().toISOString().split('T')[0],
      authorType: "",
      authorId: "",
      description: "",
      status: "",
      activityId: undefined,
      eventId: eventIdFromUrl ? Number(eventIdFromUrl) : undefined,
      parentDocumentId: undefined,
      file: undefined,
    }
  });

  useEffect(() => {
    if (document) {
      form.reset({
        documentNumber: document.documentNumber,
        documentType: document.documentType || "",
        documentDate: document.documentDate ? new Date(document.documentDate).toISOString().split('T')[0] : "",
        authorType: document.authorType || "",
        authorId: document.authorType === "Vereador" ? String(document.activityId) : "",
        description: document.description || "",
        status: document.status || "",
        activityId: document.activityId ?? undefined,
        eventId: document.eventId ?? undefined,
        parentDocumentId: document.parentDocumentId ?? undefined,
        file: undefined,
      });
    }
  }, [document, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Use Object Storage approach
      const payload = {
        documentNumber: data.documentNumber,
        documentType: data.documentType,
        documentDate: data.documentDate,
        authorType: data.authorType,
        authorId: data.authorId,
        description: data.description,
        status: data.status,
        activityId: data.activityId !== 0 ? data.activityId : undefined,
        eventId: data.eventId !== 0 ? data.eventId : undefined,
        parentDocumentId: data.parentDocumentId !== 0 ? data.parentDocumentId : undefined,
        uploadedFileURL: uploadedFileURL || undefined,
        originalFileName: uploadedFileName || undefined,
        mimeType: formFile?.type || 'application/pdf'
      };
      
      return apiRequest("/api/documents", "POST", payload);
    },
    onSuccess: () => {
      toast({
        title: "Documento criado",
        description: "O documento foi criado com sucesso.",
      });
      navigate("/documents");
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar documento",
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Use Object Storage approach
      const payload = {
        documentNumber: data.documentNumber,
        documentType: data.documentType,
        documentDate: data.documentDate,
        authorType: data.authorType,
        authorId: data.authorId,
        description: data.description,
        status: data.status,
        activityId: data.activityId !== 0 ? data.activityId : undefined,
        eventId: data.eventId !== 0 ? data.eventId : undefined,
        parentDocumentId: data.parentDocumentId !== 0 ? data.parentDocumentId : undefined,
        uploadedFileURL: uploadedFileURL || undefined,
        originalFileName: uploadedFileName || undefined,
        mimeType: formFile?.type || 'application/pdf'
      };
      
      return apiRequest(`/api/documents/${documentId}`, "PUT", payload);
    },
    onSuccess: () => {
      toast({
        title: "Documento atualizado",
        description: "As informações do documento foram atualizadas com sucesso.",
      });
      navigate("/documents");
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}`] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar documento",
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

  // File upload is now handled by ObjectUploader component

  const documentTypes = [
    "Pauta", 
    "Portaria",
    "Decreto", 
    "Decreto Legislativo", 
    "Lei Complementar", 
    "Oficio",
    "Parecer",
    "Ata",
    "Lista de Presença"
  ];

  const authorTypes = [
    "Legislativo",
    "Executivo"
  ];

  const documentStatuses = [
    "Vigente",
    "Revogada",
    "Alterada",
    "Suspenso"
  ];

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      "Vigente": "bg-green-100 text-green-800",
      "Revogada": "bg-red-100 text-red-800",
      "Alterada": "bg-yellow-100 text-yellow-800",
      "Suspenso": "bg-purple-100 text-purple-800"
    };
    
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  if (documentLoading) {
    return <div className="flex justify-center items-center h-96">Carregando...</div>;
  }

  return (
    <div className="container px-4 sm:px-6 lg:px-8 mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? "Editar Documento" : "Novo Documento"}
        </h1>
        <div className="flex space-x-2">
          {isEditing && documentHistory.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="mr-2 h-4 w-4" />
              {showHistory ? "Ocultar Histórico" : "Ver Histórico"}
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate("/documents")}>
            Voltar
          </Button>
        </div>
      </div>
      
      {showHistory && documentHistory.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Histórico do Documento</CardTitle>
            <CardDescription>
              Veja todas as versões e alterações deste documento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documentHistory.map((historyDoc, index) => (
                <div key={historyDoc.id} className="flex items-start p-3 border rounded-md bg-gray-50">
                  <div className="mr-3 bg-primary-100 p-2 rounded-full">
                    <File className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{historyDoc.documentType} Nº {historyDoc.documentNumber}</h4>
                      <Badge className={getStatusBadgeClass(historyDoc.status)}>
                        {historyDoc.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{historyDoc.description}</p>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        Criado em: {historyDoc.createdAt ? formatDate(historyDoc.createdAt.toString()) : ""}
                      </span>
                      {historyDoc.fileName && (
                        <a 
                          href={`/api/files/documents/${historyDoc.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center"
                        >
                          <File className="h-3 w-3 mr-1" />
                          {historyDoc.fileName}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Documento" : "Cadastro"}</CardTitle>
          <CardDescription>
            {isEditing 
              ? "Altere as informações do documento nos campos abaixo." 
              : "Preencha os campos abaixo para criar um novo documento."}
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
                  name="documentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Documento</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
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
                      <FormLabel>Tipo do Documento</FormLabel>
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
                          {documentTypes.map((type) => (
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="authorType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Autor</FormLabel>
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
                          {authorTypes.map((type) => (
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
                
                <FormField
                  control={form.control}
                  name="authorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vereador Autor</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o vereador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhum vereador selecionado</SelectItem>
                          {Array.isArray(councilors) && councilors.map((councilor: any) => (
                            <SelectItem key={councilor.id} value={councilor.id}>
                              {councilor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecione o vereador autor do documento (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situação do Documento</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a situação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {documentStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva o documento brevemente" 
                          className="h-24 resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Relações</h3>
                <Separator />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="activityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atividade Relacionada</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma atividade (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Nenhuma</SelectItem>
                          {activities.map((activity) => (
                            <SelectItem key={activity.id} value={activity.id.toString()}>
                              {activity.activityType} Nº {activity.activityNumber} - {activity.activityDate ? formatDate(activity.activityDate.toString()) : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Atividade legislativa que está vinculada a este documento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="eventId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Evento Relacionado</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um evento (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Nenhum</SelectItem>
                          {events.map((event) => (
                            <SelectItem key={event.id} value={event.id.toString()}>
                              Sessão {event.category} Nº {event.eventNumber} - {event.eventDate ? formatDate(event.eventDate.toString()) : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Evento legislativo que está relacionado a este documento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="parentDocumentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documento de Origem</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um documento (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Nenhum</SelectItem>
                          {documents.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id.toString()}>
                              {doc.documentType} Nº {doc.documentNumber} - {doc.documentDate ? formatDate(doc.documentDate.toString()) : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Documento que originou este (se for alteração ou resposta)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Arquivo</h3>
                <Separator />
              </div>
              
              <div className="space-y-2">
                <div className="bg-gray-50 p-4 rounded-md border border-dashed border-gray-300">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-primary-50 rounded-full">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1 text-center">
                      <h4 className="text-sm font-medium">Anexar documento</h4>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOC, DOCX ou TXT (máx. 5MB)
                      </p>
                    </div>
                    
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5242880} // 5MB
                      onGetUploadParameters={async () => {
                        try {
                          console.log('Getting upload parameters...');
                          const response = await fetch("/api/documents/upload-url", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            credentials: "include",
                          });
                          
                          if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                          }
                          
                          const data = await response.json() as { uploadURL: string };
                          console.log('Upload URL received:', data.uploadURL);
                          
                          return {
                            method: "PUT" as const,
                            url: data.uploadURL
                          };
                        } catch (error) {
                          console.error('Error getting upload parameters:', error);
                          throw error;
                        }
                      }}
                      onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                        console.log('Upload completed:', result);
                        if (result.successful && result.successful.length > 0) {
                          const uploadedFile = result.successful[0];
                          console.log('Uploaded file:', uploadedFile);
                          
                          // The uploadURL contains the presigned URL used for upload
                          // We need to convert it to the final object URL
                          const presignedUrl = uploadedFile.uploadURL || "";
                          if (!presignedUrl) {
                            console.error('No upload URL found in uploaded file');
                            toast({
                              title: "Erro no upload",
                              description: "URL do arquivo não encontrada.",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          try {
                            // Extract the object path from the presigned URL
                            // Format: https://storage.googleapis.com/bucket-name/object-path?signatures...
                            const url = new URL(presignedUrl);
                            const finalObjectUrl = `${url.protocol}//${url.host}${url.pathname}`;
                            console.log('Final object URL:', finalObjectUrl);
                            
                            setUploadedFileURL(finalObjectUrl);
                            setUploadedFileName(uploadedFile.name || "");
                            // Mark that a file was uploaded without creating a full File object
                            setFormFile({name: uploadedFile.name || ""} as File);
                            
                            toast({
                              title: "Arquivo carregado",
                              description: `${uploadedFile.name} foi carregado com sucesso.`,
                            });
                          } catch (error) {
                            console.error('Error processing upload URL:', error);
                            toast({
                              title: "Erro no upload",
                              description: "Erro ao processar URL do arquivo.",
                              variant: "destructive"
                            });
                          }
                        } else if (result.failed && result.failed.length > 0) {
                          console.error('Upload failed:', result.failed);
                          toast({
                            title: "Erro no upload",
                            description: "Falha ao fazer upload do arquivo.",
                            variant: "destructive"
                          });
                        }
                      }}
                      buttonClassName="w-full max-w-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <Upload className="h-4 w-4" />
                        <span>Selecionar Arquivo</span>
                      </div>
                    </ObjectUploader>
                    
                    {uploadedFileName && (
                      <div className="flex items-center space-x-2 text-sm">
                        <FileCheck className="h-4 w-4 text-green-500" />
                        <span>{uploadedFileName}</span>
                      </div>
                    )}
                    
                    {isEditing && document?.fileName && !uploadedFileName && (
                      <div className="flex items-center space-x-2 text-sm">
                        <File className="h-4 w-4 text-primary" />
                        <a 
                          href={`/api/files/documents/${documentId}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {document.fileName}
                        </a>
                        <span className="text-xs text-muted-foreground">(atual)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/documents")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isEditing ? "Atualizar Documento" : "Criar Documento"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}