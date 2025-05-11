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
  file: z.any().optional(),
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
        documentDate: document.documentDate ? new Date(document.documentDate).toISOString().split('T')[0] : "",
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
      if (data.activityId && data.activityId !== 0) {
        formData.append("activityId", data.activityId.toString());
      }
      if (data.parentDocumentId && data.parentDocumentId !== 0) {
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
      if (data.activityId && data.activityId !== 0) {
        formData.append("activityId", data.activityId.toString());
      }
      if (data.parentDocumentId && data.parentDocumentId !== 0) {
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
                    
                    <Input
                      type="file"
                      id="file"
                      className="w-full max-w-xs"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                    />
                    
                    {formFile && (
                      <div className="flex items-center space-x-2 text-sm">
                        <FileCheck className="h-4 w-4 text-green-500" />
                        <span>{formFile.name}</span>
                      </div>
                    )}
                    
                    {isEditing && document?.fileName && !formFile && (
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