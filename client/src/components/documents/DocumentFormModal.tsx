import { useState } from "react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Document, LegislativeActivity, Event, User } from "@shared/schema";

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
});

type FormData = z.infer<typeof formSchema>;

interface DocumentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: number;
}

export default function DocumentFormModal({ open, onOpenChange, eventId }: DocumentFormModalProps) {
  const { toast } = useToast();
  
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
      documentNumber: 1,
      documentType: "",
      documentDate: new Date().toISOString().split('T')[0],
      authorType: "",
      authorId: "",
      description: "",
      status: "",
      activityId: undefined,
      eventId: eventId,
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Adicionar dados do documento
      formData.append("documentNumber", data.documentNumber.toString());
      formData.append("documentType", data.documentType);
      formData.append("documentDate", data.documentDate);
      formData.append("authorType", data.authorType);
      formData.append("description", data.description);
      formData.append("status", data.status);
      
      if (data.authorId) formData.append("authorId", data.authorId);
      if (data.activityId) formData.append("activityId", data.activityId.toString());
      if (data.eventId) formData.append("eventId", data.eventId.toString());

      return apiRequest("/api/documents", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Documento criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar documento",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createDocumentMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Documento</DialogTitle>
          <DialogDescription>
            Preencha as informações do documento
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createDocumentMutation.isPending}>
                {createDocumentMutation.isPending ? "Salvando..." : "Salvar Documento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}