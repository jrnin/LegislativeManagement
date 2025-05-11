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
import { Document, LegislativeActivity } from "@shared/schema";
import { formatDate } from "@/utils/formatters";
import { File, FileCheck, Upload, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  documentNumber: z.coerce.number().int().positive({ message: "Número do documento deve ser positivo" }),
  documentType: z.string().min(1, { message: "Tipo de documento é obrigatório" }),
  documentDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  authorType: z.string().min(1, { message: "Tipo de autor é obrigatório" }),
  description: z.string().min(3, { message: "Descrição é obrigatória" }),
  status: z.string().min(1, { message: "Situação é obrigatória" }),
  activityId: z.coerce.number().optional(),
  parentDocumentId: z.coerce.number().optional(),
  file: z.instanceof(File).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function DocumentForm() {
  const [_, navigate] = useLocation();
  const params = useParams();
  const documentId = params.id;
  const isEditing = !!documentId;
  const { toast } = useToast();
  const [formFile, setFormFile] = useState<File | null>(null);
  const [documentHistory, setDocumentHistory] = useState<Document[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const { data: document, isLoading: documentLoading } = useQuery<Document>({
    queryKey: [`/api/documents/${documentId}`],
    enabled: !!documentId,
  });

  const { data: activities = [] } = useQuery<LegislativeActivity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    select: (data) => data.filter(doc => doc.id !== Number(documentId)), // Exclude current document
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
      description: "",
      status: "",
      activityId: undefined,
      parentDocumentId: undefined,
      file: undefined,
    }
  });

  useEffect(() => {
    if (document) {
      form.reset({
        documentNumber: document.documentNumber,
        documentType: document.documentType || "",
        documentDate: document.documentDate ? document.documentDate.split('T')[0] : "",
        authorType: document.authorType || "",
        description: document.description || "",
        status: document.status || "",
        activityId: document.activityId,
        parentDocumentId: document.parentDocumentId,
        file: undefined,
      });
    }
  }, [document, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Append basic fields
      formData.append("documentNumber", data.documentNumber.toString());
      formData.append("documentType", data.documentType);
      formData.append("documentDate", data.documentDate);
      formData.append("authorType", data.authorType);
      formData.append("description", data.description);
      formData.append("status", data.status);
      
      // Append optional fields if present
      if (data.activityId) {
        formData.append("activityId", data.activityId.toString());
      }
      if (data.parentDocumentId) {
        formData.append("parentDocumentId", data.parentDocumentId.toString());
      }
      
      // Append file if present
      if (formFile) {
        formData.append("file", formFile);
      }
      
      const response = await fetch("/api/documents", {
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
      const formData = new FormData();
      
      // Append basic fields
      if (data.documentNumber) formData.append("documentNumber", data.documentNumber.toString());
      if (data.documentType) formData.append("documentType", data.documentType);
      if (data.documentDate) formData.append("documentDate", data.documentDate);
      if (data.authorType) formData.append("authorType", data.authorType);
      if (data.description) formData.append("description", data.description);
      if (data.status) formData.append("status", data.status);
      
      // Append optional fields if present
      if (data.activityId) {
        formData.append("activityId", data.activityId.toString());
      }
      if (data.parentDocumentId) {
        formData.append("parentDocumentId", data.parentDocumentId.toString());
      }
      
      // Append file if present
      if (formFile) {
        formData.append("file", formFile);
      }
      
      const response = await fetch(`/api/documents/${documentId}`, {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormFile(e.target.files[0]);
    }
  };

  const documentTypes = [
    "Pauta", 
    "Decreto", 
    "Decreto Legislativo", 
    "Lei Complementar", 
    "Oficio"
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
    <div className="container mx-auto py-6">
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
                        Criado em: {formatDate(historyDoc.createdAt)}
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
          <CardTitle>{isEditing ? "Editar Documento" : "Novo Documento"}</CardTitle>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="authorType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Autor do Documento</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o autor" />
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situação</FormLabel>
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
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição do documento" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Relacionamentos</h3>
                <Separator />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="activityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atividade Legislativa Relacionada</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
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
                              {activity.activityType} Nº {activity.activityNumber} - {formatDate(activity.activityDate)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Vincular este documento a uma atividade legislativa (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="parentDocumentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documento de Origem</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
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
                              {doc.documentType} Nº {doc.documentNumber} - {formatDate(doc.documentDate)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Vincular este documento a um documento de origem (opcional)
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
                  {document && document.fileName && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Arquivo atual:</p>
                      <div className="flex items-center mt-1">
                        <File className="w-4 h-4 mr-2 text-gray-500" />
                        <a 
                          href={`/api/files/documents/${document.id}`} 
                          className="text-sm text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {document.fileName}
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
                  onClick={() => navigate("/documents")}
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
