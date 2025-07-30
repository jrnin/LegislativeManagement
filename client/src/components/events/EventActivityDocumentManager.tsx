import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link2, Unlink, FileText, Download, Plus, X, Activity, Calendar } from 'lucide-react';
import { Document, LegislativeActivity } from '@shared/schema';

interface EventActivityDocumentManagerProps {
  eventId: number;
}

export default function EventActivityDocumentManager({ eventId }: EventActivityDocumentManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [linkNotes, setLinkNotes] = useState('');
  const { toast } = useToast();

  // Fetch all legislative activities
  const { data: activities = [] } = useQuery<LegislativeActivity[]>({
    queryKey: ['/api/activities'],
    select: (data: any) => data || []
  });

  // Fetch all documents for the selected activity
  const { data: activityDocuments = [] } = useQuery<Document[]>({
    queryKey: [`/api/files/activities/${selectedActivityId}`],
    enabled: !!selectedActivityId,
    select: (data: any) => data || []
  });

  // Fetch already linked documents for this event
  const { data: linkedDocuments = [], refetch: refetchLinkedDocuments } = useQuery({
    queryKey: [`/api/events/${eventId}/activity-documents`],
    select: (data: any) => data || []
  });

  // Get available activities (only return all activities, filtering will be done in UI)
  const activitiesWithDocuments = activities;

  // Get available documents (not yet linked for this activity)
  const availableDocuments = activityDocuments.filter(doc => 
    !linkedDocuments.some((linked: any) => 
      linked.activityId === parseInt(selectedActivityId) && linked.documentId === doc.id
    )
  );

  // Link document mutation
  const linkDocumentMutation = useMutation({
    mutationFn: async (data: { activityId: number; documentId: number; notes?: string }) => {
      return apiRequest('POST', `/api/events/${eventId}/activities/${data.activityId}/documents/${data.documentId}/link`, {
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
      setSelectedActivityId('');
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
    mutationFn: async (data: { activityId: number; documentId: number }) => {
      return apiRequest('DELETE', `/api/events/${eventId}/activities/${data.activityId}/documents/${data.documentId}/unlink`);
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
    if (!selectedActivityId || !selectedDocumentId) {
      toast({
        title: "Selecione atividade e documento",
        description: "Por favor, selecione uma atividade e um documento para vincular.",
        variant: "destructive",
      });
      return;
    }

    linkDocumentMutation.mutate({
      activityId: parseInt(selectedActivityId),
      documentId: parseInt(selectedDocumentId),
      notes: linkNotes
    });
  };

  const handleUnlinkDocument = (activityId: number, documentId: number) => {
    unlinkDocumentMutation.mutate({ activityId, documentId });
  };

  const getActivityById = (id: number) => {
    return activities.find(activity => activity.id === id);
  };

  return (
    <div className="space-y-6">
      {/* Add New Link Section */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Documentos Vinculados</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie documentos de atividades legislativas vinculados a este evento
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Vincular Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Vincular Documento de Atividade ao Evento</DialogTitle>
              <DialogDescription>
                Selecione uma atividade legislativa e um documento para vincular ao evento.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="activity-select">Atividade Legislativa</Label>
                <Select value={selectedActivityId} onValueChange={setSelectedActivityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma atividade" />
                  </SelectTrigger>
                  <SelectContent>
                    {activities.map((activity) => (
                      <SelectItem key={activity.id} value={activity.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          <span>#{activity.activityNumber} - {activity.description.substring(0, 50)}...</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedActivityId && (
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
                  
                  {availableDocuments.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhum documento disponível para esta atividade ou todos já estão vinculados.
                    </p>
                  )}
                </div>
              )}
              
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
                  disabled={linkDocumentMutation.isPending || !selectedActivityId || !selectedDocumentId}
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
      </div>

      <Separator />

      {/* Linked Documents List */}
      {linkedDocuments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Nenhum documento vinculado</h3>
          <p className="text-sm">
            Use o botão "Vincular Documento" para adicionar documentos de atividades a este evento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {linkedDocuments.map((linked: any) => {
            const activity = getActivityById(linked.activityId);
            return (
              <Card key={linked.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <Badge variant="outline" className="text-xs">
                          Atividade #{activity?.activityNumber}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-sm">
                          {linked.document.fileName || `Documento #${linked.document.documentNumber}`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Atividade:</strong> {activity?.description}</p>
                      {linked.document.description && (
                        <p><strong>Documento:</strong> {linked.document.description}</p>
                      )}
                      {linked.notes && (
                        <p><strong>Observações:</strong> {linked.notes}</p>
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
                      onClick={() => handleUnlinkDocument(linked.activityId, linked.document.id)}
                      disabled={unlinkDocumentMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Unlink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}