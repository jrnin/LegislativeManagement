import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link2, Unlink, FileText, Download, Eye, Plus, X } from 'lucide-react';
import { Document } from '@shared/schema';

interface ActivityDocumentLinkerProps {
  eventId: number;
  activityId: number;
  activityTitle: string;
  activityNumber: number;
}

export default function ActivityDocumentLinker({ 
  eventId, 
  activityId, 
  activityTitle, 
  activityNumber 
}: ActivityDocumentLinkerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [linkNotes, setLinkNotes] = useState('');
  const { toast } = useToast();

  // Fetch all documents for this activity
  const { data: activityDocuments = [] } = useQuery<Document[]>({
    queryKey: [`/api/files/activities/${activityId}`],
    select: (data: any) => data || []
  });

  // Fetch already linked documents for this event-activity combination
  const { data: linkedDocuments = [], refetch: refetchLinkedDocuments } = useQuery({
    queryKey: [`/api/events/${eventId}/activities/${activityId}/documents`],
    select: (data: any) => data || []
  });

  // Get available documents (not yet linked)
  const availableDocuments = activityDocuments.filter(doc => 
    !linkedDocuments.some((linked: any) => linked.document.id === doc.id)
  );

  // Link document mutation
  const linkDocumentMutation = useMutation({
    mutationFn: async (data: { documentId: number; notes?: string }) => {
      return apiRequest('POST', `/api/events/${eventId}/activities/${activityId}/documents/${data.documentId}/link`, {
        notes: data.notes
      });
    },
    onSuccess: () => {
      toast({
        title: "Documento vinculado",
        description: "O documento foi vinculado com sucesso ao evento.",
      });
      refetchLinkedDocuments();
      setIsDialogOpen(false);
      setSelectedDocumentId('');
      setLinkNotes('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao vincular documento",
        description: error.message || "Não foi possível vincular o documento.",
        variant: "destructive",
      });
    }
  });

  // Unlink document mutation
  const unlinkDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      return apiRequest('DELETE', `/api/events/${eventId}/activities/${activityId}/documents/${documentId}/unlink`);
    },
    onSuccess: () => {
      toast({
        title: "Documento desvinculado",
        description: "O documento foi desvinculado com sucesso do evento.",
      });
      refetchLinkedDocuments();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao desvincular documento",
        description: error.message || "Não foi possível desvincular o documento.",
        variant: "destructive",
      });
    }
  });

  const handleLinkDocument = () => {
    if (!selectedDocumentId) {
      toast({
        title: "Selecione um documento",
        description: "Por favor, selecione um documento para vincular.",
        variant: "destructive",
      });
      return;
    }

    linkDocumentMutation.mutate({
      documentId: parseInt(selectedDocumentId),
      notes: linkNotes
    });
  };

  const handleUnlinkDocument = (documentId: number) => {
    unlinkDocumentMutation.mutate(documentId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground">
            Documentos Vinculados ao Evento
          </h4>
          <p className="text-xs text-muted-foreground">
            Documentos desta atividade que estão vinculados ao evento
          </p>
        </div>
        
        {availableDocuments.length > 0 && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Vincular Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Vincular Documento ao Evento</DialogTitle>
                <DialogDescription>
                  Vincule um documento da atividade #{activityNumber} ao evento.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="document-select">Documento</Label>
                  <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um documento" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDocuments.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id.toString()}>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>{doc.fileName || `Documento #${doc.documentNumber}`}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Adicione observações sobre este vínculo..."
                    value={linkNotes}
                    onChange={(e) => setLinkNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleLinkDocument}
                    disabled={linkDocumentMutation.isPending}
                    className="flex-1"
                  >
                    {linkDocumentMutation.isPending ? 'Vinculando...' : 'Vincular'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {linkedDocuments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum documento vinculado ao evento</p>
        </div>
      ) : (
        <div className="space-y-2">
          {linkedDocuments.map((linked: any) => (
            <Card key={linked.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <h5 className="font-medium text-sm">
                      {linked.document.fileName || `Documento #${linked.document.documentNumber}`}
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      {linked.document.description}
                    </p>
                    {linked.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <strong>Observações:</strong> {linked.notes}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Link2 className="w-3 h-3 mr-1" />
                    Vinculado
                  </Badge>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnlinkDocument(linked.document.id)}
                    disabled={unlinkDocumentMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Unlink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}