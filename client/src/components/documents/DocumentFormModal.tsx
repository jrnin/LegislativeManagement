import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Document, LegislativeActivity, Event, User } from "@shared/schema";
import { File, Upload } from "lucide-react";

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

interface DocumentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: number;
}

export default function DocumentFormModal({ open, onOpenChange, eventId }: DocumentFormModalProps) {
  const { toast } = useToast();
  const [formFile, setFormFile] = useState<File | null>(null);
  
  const { data: activities = [] } = useQuery<LegislativeActivity[]>({
    queryKey: ["/api/activities"],
    enabled: open,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    enabled: open,
  });

  const { data: councilors = [] } = useQuery<User[]>({
    queryKey: ["/api/councilors"],
    enabled: open,
  });

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
      eventId: eventId ?? undefined,
      parentDocumentId: undefined,
      file: undefined,
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Append basic fields
      formData.append("documentNumber", data.documentNumber.toString());
      formData.append("documentType", data.documentType);
      formData.append("documentDate", data.documentDate);
      formData.append("authorType", data.authorType);
      if (data.authorId) {
        formData.append("authorId", data.authorId);
      }
      formData.append("description", data.description);
      formData.append("status", data.status);
      
      // Append optional fields if present
      if (data.activityId && data.activityId !== 0) {
        formData.append("activityId", data.activityId.toString());
      }
      if (data.eventId && data.eventId !== 0) {
        formData.append("eventId", data.eventId.toString());
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
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao criar documento");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Sucesso",
        description: "Documento criado com sucesso!",
      });
      form.reset();
      setFormFile(null);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormFile(e.target.files[0]);
    }
  };

  const documentTypes = [
    "Pauta", 
    "Portaria",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Documento</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para criar um novo documento.
          </DialogDescription>
        </DialogHeader>
        
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
                        <SelectItem value="">Nenhum vereador selecionado</SelectItem>
                        {councilors.map((councilor: any) => (
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
                        placeholder="Descreva o documento..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                    <FormLabel>Atividade Legislativa</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "" ? undefined : Number(value))} 
                      defaultValue={field.value?.toString() || ""}
                    >
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

              <FormField
                control={form.control}
                name="eventId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evento</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "" ? undefined : Number(value))} 
                      defaultValue={field.value?.toString() || ""}
                    >
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
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Arquivo</h3>
              <Separator />
            </div>

            <div>
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Arquivo do Documento</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                        />
                        {formFile && (
                          <div className="flex items-center text-sm text-green-600">
                            <File className="h-4 w-4 mr-1" />
                            {formFile.name}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Selecione um arquivo PDF, DOC ou DOCX (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Documento"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}