import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { Plus, Edit, Trash2, Eye, Upload, X, Search, Filter, Calendar, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventImage {
  id: number;
  eventId: number;
  imageData: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  caption?: string;
  orderIndex: number;
  uploadedBy: string;
  createdAt: string;
  event?: {
    id: number;
    eventNumber: number;
    eventDate: string;
    eventTime: string;
    location: string;
    category: string;
    status: string;
    description: string;
  };
}

interface Event {
  id: number;
  eventNumber: number;
  eventDate: string;
  eventTime: string;
  location: string;
  category: string;
  status: string;
  description: string;
}

export default function ImagesPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<EventImage | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEventId, setFilterEventId] = useState<string>('');
  const [editCaption, setEditCaption] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Carregar todas as imagens com informações do evento
  const { data: images = [], isLoading } = useQuery({
    queryKey: ['/api/admin/images'],
    queryFn: () => apiRequest('GET', '/api/admin/images'),
  });

  // Carregar eventos para seleção
  const { data: events = [] } = useQuery({
    queryKey: ['/api/events'],
    queryFn: () => apiRequest('GET', '/api/events'),
  });

  // Mutation para upload de imagem
  const uploadImageMutation = useMutation({
    mutationFn: async (data: { eventId: number; imageData: string; fileName: string; fileSize: number; mimeType: string }) => {
      return apiRequest('POST', `/api/events/${data.eventId}/images`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/images'] });
      setUploadDialogOpen(false);
      setUploadFiles([]);
      setSelectedEventId('');
      toast({
        title: "Sucesso",
        description: "Imagens enviadas com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar imagens",
        variant: "destructive",
      });
    },
  });

  // Mutation para editar legenda
  const editImageMutation = useMutation({
    mutationFn: async ({ imageId, caption }: { imageId: number; caption: string }) => {
      return apiRequest('PUT', `/api/admin/images/${imageId}`, { caption });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/images'] });
      setEditDialogOpen(false);
      setSelectedImage(null);
      toast({
        title: "Sucesso",
        description: "Legenda atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar legenda",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar imagem
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      return apiRequest('DELETE', `/api/admin/images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/images'] });
      toast({
        title: "Sucesso",
        description: "Imagem excluída com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir imagem",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Apenas imagens são permitidas",
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Máximo 5MB",
          variant: "destructive",
        });
        return false;
      }
      return true;
    });
    
    if (uploadFiles.length + validFiles.length > 8) {
      toast({
        title: "Erro",
        description: "Máximo 8 imagens por vez",
        variant: "destructive",
      });
      return;
    }
    
    setUploadFiles(prev => [...prev, ...validFiles]);
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedEventId || uploadFiles.length === 0) return;

    for (const file of uploadFiles) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        uploadImageMutation.mutate({
          eventId: parseInt(selectedEventId),
          imageData,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = (imageId: number) => {
    if (confirm('Tem certeza que deseja excluir esta imagem?')) {
      deleteImageMutation.mutate(imageId);
    }
  };

  const handleEditImage = (image: EventImage) => {
    setSelectedImage(image);
    setEditCaption(image.caption || '');
    setEditDialogOpen(true);
  };

  const handleViewImage = (image: EventImage) => {
    setSelectedImage(image);
    setViewDialogOpen(true);
  };

  const handleSaveCaption = () => {
    if (selectedImage) {
      editImageMutation.mutate({
        imageId: selectedImage.id,
        caption: editCaption
      });
    }
  };

  // Filtrar imagens
  const filteredImages = images.filter((image: EventImage) => {
    const matchesSearch = !searchQuery || 
      image.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.event?.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEvent = !filterEventId || image.eventId.toString() === filterEventId;
    
    return matchesSearch && matchesEvent;
  });

  // Agrupar por evento
  const imagesByEvent = filteredImages.reduce((acc: Record<number, EventImage[]>, image: EventImage) => {
    const eventId = image.eventId;
    if (!acc[eventId]) {
      acc[eventId] = [];
    }
    acc[eventId].push(image);
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Helmet>
        <title>Galeria de Imagens - Sistema Legislativo</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Galeria de Imagens</h1>
          <p className="text-gray-600 mt-2">Gerencie as imagens dos eventos legislativos</p>
        </div>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Imagens
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Imagens</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="event">Evento</Label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event: Event) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.category} #{event.eventNumber} - {format(new Date(event.eventDate), "dd/MM/yyyy", { locale: ptBR })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="images">Selecionar Imagens</Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Máximo 8 imagens por upload. Até 5MB por imagem.
                </p>
              </div>
              
              {uploadFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Imagens Selecionadas</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {uploadFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => removeUploadFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedEventId || uploadFiles.length === 0 || uploadImageMutation.isPending}
                  className="flex-1"
                >
                  {uploadImageMutation.isPending ? (
                    <>Enviando...</>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Enviar Imagens
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadDialogOpen(false);
                    setUploadFiles([]);
                    setSelectedEventId('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome da imagem, legenda ou evento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-64">
              <Select value={filterEventId} onValueChange={setFilterEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os eventos</SelectItem>
                  {events.map((event: Event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.category} #{event.eventNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de imagens agrupadas por evento */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(imagesByEvent).map(([eventId, eventImages]) => {
            const event = eventImages[0]?.event;
            if (!event) return null;

            return (
              <div key={eventId} className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {event.category} #{event.eventNumber}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(event.eventDate), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                      </div>
                      <Badge variant="outline">
                        {eventImages.length} {eventImages.length === 1 ? 'imagem' : 'imagens'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {eventImages.map((image) => (
                        <Card key={image.id} className="overflow-hidden group">
                          <CardContent className="p-0 relative">
                            <img
                              src={image.imageData}
                              alt={image.caption || image.fileName}
                              className="w-full h-48 object-cover cursor-pointer transition-transform hover:scale-105"
                              onClick={() => handleViewImage(image)}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleViewImage(image)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleEditImage(image)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteImage(image.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {image.caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-sm">
                                {image.caption}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
          
          {filteredImages.length === 0 && (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Nenhuma imagem encontrada</p>
                <p className="text-sm mt-2">Use o botão "Adicionar Imagens" para enviar imagens</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Dialog para visualizar imagem */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedImage?.caption || selectedImage?.fileName}
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="text-center">
              <img
                src={selectedImage.imageData}
                alt={selectedImage.caption || selectedImage.fileName}
                className="max-w-full max-h-96 mx-auto rounded"
              />
              {selectedImage.caption && (
                <p className="mt-4 text-gray-600">{selectedImage.caption}</p>
              )}
              <div className="mt-4 text-sm text-gray-500">
                <p>Evento: {selectedImage.event?.category} #{selectedImage.event?.eventNumber}</p>
                <p>Enviado em: {format(new Date(selectedImage.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para editar legenda */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Legenda</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div>
                <img
                  src={selectedImage.imageData}
                  alt={selectedImage.fileName}
                  className="w-full h-32 object-cover rounded"
                />
              </div>
              <div>
                <Label htmlFor="caption">Legenda</Label>
                <Textarea
                  id="caption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Digite uma legenda para a imagem..."
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveCaption}
                  disabled={editImageMutation.isPending}
                  className="flex-1"
                >
                  {editImageMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}