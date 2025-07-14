import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, FileText, Calendar, Download, Eye, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { addTimelineEntry, timelineActions } from "@/lib/timeline";

interface EventDocumentManagerProps {
  eventId: string;
  associatedDocuments: any[];
}

export function EventDocumentManager({ eventId, associatedDocuments }: EventDocumentManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all documents
  const { data: documentsData } = useQuery({
    queryKey: ['/api/documents']
  });

  const allDocuments = documentsData?.documents || [];

  // Filter documents that are not already associated with the event
  const availableDocuments = allDocuments.filter((doc: any) => 
    !associatedDocuments.some(assocDoc => assocDoc.id === doc.id)
  );

  // Filter documents based on search term
  const filteredDocuments = availableDocuments.filter((doc: any) =>
    doc.documentNumber?.toString().includes(searchTerm) ||
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.documentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDocumentToggle = (documentId: number) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAll = () => {
    setSelectedDocuments(filteredDocuments.map((doc: any) => doc.id));
  };

  const handleDeselectAll = () => {
    setSelectedDocuments([]);
  };

  const handleAddDocuments = async () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: "Nenhum documento selecionado",
        description: "Selecione pelo menos um documento para adicionar ao evento.",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest('POST', `/api/events/${eventId}/documents`, {
        documentIds: selectedDocuments
      });

      // Registrar ações na timeline para cada documento adicionado
      selectedDocuments.forEach(docId => {
        const document = allDocuments.find(d => d.id === docId);
        if (document) {
          addTimelineEntry(Number(eventId), timelineActions.addDocument(docId, `${document.documentType} ${document.documentNumber}: ${document.title}`));
        }
      });

      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/details`] });
      setSelectedDocuments([]);
      setIsDialogOpen(false);
      toast({
        title: "Documentos adicionados",
        description: `${selectedDocuments.length} documento(s) adicionado(s) ao evento com sucesso.`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar os documentos ao evento.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveDocument = async (documentId: number) => {
    if (confirm('Tem certeza que deseja remover este documento do evento?')) {
      try {
        // Encontrar o documento para registrar na timeline
        const document = associatedDocuments.find(d => d.id === documentId);
        
        await apiRequest('DELETE', `/api/events/${eventId}/documents/${documentId}`);
        
        // Registrar ação na timeline
        if (document) {
          addTimelineEntry(Number(eventId), timelineActions.removeDocument(documentId, `${document.documentType} ${document.documentNumber}: ${document.title}`));
        }
        
        queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/details`] });
        toast({
          title: "Documento removido",
          description: "O documento foi removido do evento com sucesso."
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível remover o documento do evento.",
          variant: "destructive"
        });
      }
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case "Ata": return "bg-green-100 text-green-800";
      case "Parecer": return "bg-blue-100 text-blue-800";
      case "Lista de Presença": return "bg-purple-100 text-purple-800";
      case "Ofício": return "bg-orange-100 text-orange-800";
      case "Requerimento": return "bg-yellow-100 text-yellow-800";
      case "Projeto de Lei": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerenciar Documentos do Evento
          </CardTitle>
          <CardDescription>
            Adicione ou remova documentos associados a este evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{associatedDocuments.length}</span> documento(s) associado(s)
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Documentos
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Documentos ao Evento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Search and Actions */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Buscar por número, título, tipo ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        disabled={filteredDocuments.length === 0}
                      >
                        Selecionar Todos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectAll}
                        disabled={selectedDocuments.length === 0}
                      >
                        Desmarcar Todos
                      </Button>
                    </div>
                  </div>

                  {/* Documents List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredDocuments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "Nenhum documento encontrado" : "Todos os documentos já estão associados ao evento"}
                      </div>
                    ) : (
                      filteredDocuments.map((document: any) => (
                        <div
                          key={document.id}
                          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedDocuments.includes(document.id)}
                            onCheckedChange={() => handleDocumentToggle(document.id)}
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-normal">
                                #{document.documentNumber}
                              </Badge>
                              <Badge 
                                variant="secondary" 
                                className={getDocumentTypeColor(document.documentType)}
                              >
                                {document.documentType}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium">{document.title}</p>
                              {document.description && (
                                <p className="text-sm text-muted-foreground">{document.description}</p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {format(new Date(document.documentDate), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddDocuments}
                      disabled={selectedDocuments.length === 0}
                    >
                      Adicionar {selectedDocuments.length > 0 && `(${selectedDocuments.length})`}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Associated Documents Display */}
      {associatedDocuments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Documentos Associados ({associatedDocuments.length})</h3>
          <div className="grid gap-4">
            {associatedDocuments.map((document: any) => (
              <Card key={document.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-normal">
                        #{document.documentNumber}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={getDocumentTypeColor(document.documentType)}
                      >
                        {document.documentType}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">{document.title}</p>
                      {document.description && (
                        <p className="text-sm text-muted-foreground">{document.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {format(new Date(document.documentDate), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      {document.filePath && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="gap-1"
                          onClick={() => window.open(`/api/files/documents/${document.id}`, '_blank')}
                        >
                          <Download className="h-3 w-3" />
                          Arquivo
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-1"
                        onClick={() => window.open(`/documents/${document.id}`, '_blank')}
                      >
                        <Eye className="h-3 w-3" />
                        Detalhes
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveDocument(document.id)}
                      >
                        <X className="h-3 w-3" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}