import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, X, Eye, Edit, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { EventImage } from '@shared/schema';

interface EventImageGalleryProps {
  eventId: number;
  isAdmin?: boolean;
}

export function EventImageGallery({ eventId, isAdmin = false }: EventImageGalleryProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<EventImage | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [editCaption, setEditCaption] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Carregar imagens do evento
  const { data: imagesData = [], isLoading } = useQuery({
    queryKey: ['/api/events', eventId, 'images'],
    queryFn: () => apiRequest('GET', `/api/events/${eventId}/images`),
    refetchOnWindowFocus: false,
  });

  // Garantir que images seja sempre um array
  const images = Array.isArray(imagesData) ? imagesData : [];

  // Mutation para upload de imagem
  const uploadImageMutation = useMutation({
    mutationFn: async (imageData: any) => {
      return apiRequest('POST', `/api/events/${eventId}/images`, imageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'images'] });
      setUploadDialogOpen(false);
      setUploadFiles([]);
      toast({
        title: "Sucesso",
        description: "Imagem enviada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar imagem",
        variant: "destructive",
      });
    },
  });

  // Mutation para editar legenda
  const editImageMutation = useMutation({
    mutationFn: async ({ imageId, caption }: { imageId: number; caption: string }) => {
      return apiRequest('PUT', `/api/events/${eventId}/images/${imageId}`, { caption });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'images'] });
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
      return apiRequest('DELETE', `/api/events/${eventId}/images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'images'] });
      toast({
        title: "Sucesso",
        description: "Imagem removida com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover imagem",
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
    
    const totalImages = images.length + uploadFiles.length + validFiles.length;
    if (totalImages > 8) {
      toast({
        title: "Erro",
        description: "Limite de 8 imagens por evento",
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
    if (uploadFiles.length === 0) return;

    for (const file of uploadFiles) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        await uploadImageMutation.mutateAsync({
          imageData,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          caption: ''
        });
      };
      reader.readAsDataURL(file);
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

  const handleDeleteImage = (imageId: number) => {
    if (confirm('Tem certeza que deseja remover esta imagem?')) {
      deleteImageMutation.mutate(imageId);
    }
  };

  const handleSaveCaption = () => {
    if (selectedImage) {
      editImageMutation.mutate({
        imageId: selectedImage.id,
        caption: editCaption
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Galeria de Imagens</h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {images.length}/8
          </Badge>
          {isAdmin && (
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={images.length >= 8} className="h-8">
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Imagens ao Evento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
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
                      Máximo 8 imagens por evento. Até 5MB por imagem.
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
                      disabled={uploadFiles.length === 0 || uploadImageMutation.isPending}
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
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {images.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">Nenhuma imagem disponível</p>
          {isAdmin && (
            <p className="text-xs mt-1 text-gray-400">Use "Adicionar" para enviar imagens</p>
          )}
        </div>
      ) : images.length > 0 && images[0] ? (
        <div className="flex items-center gap-4">
          <div className="relative group w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={images[0].imageData}
              alt={images[0].caption || images[0].fileName}
              className="w-full h-full object-cover cursor-pointer transition-all duration-200 group-hover:scale-105"
              onClick={() => handleViewImage(images[0])}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-6 w-6 p-0"
                  onClick={() => handleViewImage(images[0])}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0"
                      onClick={() => handleEditImage(images[0])}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 w-6 p-0"
                      onClick={() => handleDeleteImage(images[0].id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              {images[0].caption || "Imagem do evento"}
            </p>
            {images.length > 1 && (
              <p className="text-xs text-gray-500 mt-1">
                +{images.length - 1} imagens adicionais
              </p>
            )}
          </div>
          
          {images.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewImage(images[0])}
            >
              Ver todas ({images.length})
            </Button>
          )}
        </div>
      ) : null}

      {/* Dialog para visualizar todas as imagens */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Galeria do Evento - Todas as Imagens
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Grid com todas as imagens */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image: EventImage) => (
                <div key={image.id} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.imageData}
                    alt={image.caption || image.fileName}
                    className="w-full h-full object-cover cursor-pointer transition-all duration-200 group-hover:scale-105"
                    onClick={() => {
                      // Abrir imagem em nova janela para visualização completa
                      const newWindow = window.open('', '_blank');
                      if (newWindow) {
                        newWindow.document.write(`
                          <html>
                            <head><title>${image.caption || image.fileName}</title></head>
                            <body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;">
                              <img src="${image.imageData}" style="max-width:100%;max-height:100vh;object-fit:contain;" alt="${image.caption || image.fileName}" />
                            </body>
                          </html>
                        `);
                      }
                    }}
                  />
                  
                  {isAdmin && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditImage(image)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDeleteImage(image.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs truncate">{image.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Contador de imagens */}
            <div className="text-center text-sm text-gray-500 border-t pt-4">
              {images.length} {images.length === 1 ? 'imagem' : 'imagens'} neste evento
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar legenda */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Legenda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedImage && (
              <div className="text-center">
                <img
                  src={selectedImage.imageData}
                  alt={selectedImage.fileName}
                  className="max-w-full h-32 mx-auto rounded"
                />
              </div>
            )}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}