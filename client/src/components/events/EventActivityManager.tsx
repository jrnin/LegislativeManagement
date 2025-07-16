import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Plus, X, Activity, Calendar, Search, FileText, User } from 'lucide-react';
import { LegislativeActivity } from '@shared/schema';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addTimelineEntry, timelineActions } from '@/lib/timeline';

interface EventActivityManagerProps {
  eventId: number;
  currentActivities: LegislativeActivity[];
  onRefresh: () => void;
}

export default function EventActivityManager({ eventId, currentActivities, onRefresh }: EventActivityManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Fetch all legislative activities
  const { data: allActivities = [] } = useQuery<LegislativeActivity[]>({
    queryKey: ['/api/activities'],
    select: (data: any) => data || []
  });

  // Filter activities based on search term (allowing all activities, even if already associated)
  const filteredActivities = allActivities.filter(activity =>
    activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.activityNumber.toString().includes(searchTerm) ||
    activity.activityType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add activities to event mutation
  const addActivitiesMutation = useMutation({
    mutationFn: async (activityIds: number[]) => {
      return apiRequest('POST', `/api/events/${eventId}/activities`, {
        activityIds
      });
    },
    onSuccess: () => {
      // Registrar ações na timeline para cada atividade adicionada
      selectedActivityIds.forEach(activityId => {
        const activity = allActivities.find(a => a.id === activityId);
        if (activity) {
          addTimelineEntry(eventId, timelineActions.addActivity(activityId, `${activity.activityType} ${activity.activityNumber}: ${activity.description}`));
        }
      });
      
      toast({
        title: "Atividades adicionadas",
        description: `${selectedActivityIds.length} atividade(s) foi(ram) adicionada(s) ao evento.`,
      });
      setSelectedActivityIds([]);
      setIsDialogOpen(false);
      onRefresh();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar atividades",
        description: error.message || "Não foi possível adicionar as atividades ao evento.",
        variant: "destructive",
      });
    }
  });

  // Remove activity from event mutation
  const removeActivityMutation = useMutation({
    mutationFn: async (activityId: number) => {
      return apiRequest('DELETE', `/api/events/${eventId}/activities/${activityId}`);
    },
    onSuccess: (_, activityId) => {
      // Registrar ação na timeline
      const activity = currentActivities.find(a => a.id === activityId);
      if (activity) {
        addTimelineEntry(eventId, timelineActions.removeActivity(activityId, `${activity.activityType} ${activity.activityNumber}: ${activity.description}`));
      }
      
      toast({
        title: "Atividade removida",
        description: "A atividade foi removida do evento.",
      });
      onRefresh();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover atividade",
        description: error.message || "Não foi possível remover a atividade do evento.",
        variant: "destructive",
      });
    }
  });

  const handleActivitySelection = (activityId: number, checked: boolean) => {
    if (checked) {
      setSelectedActivityIds(prev => [...prev, activityId]);
    } else {
      setSelectedActivityIds(prev => prev.filter(id => id !== activityId));
    }
  };

  const handleAddActivities = () => {
    if (selectedActivityIds.length === 0) {
      toast({
        title: "Selecione pelo menos uma atividade",
        description: "Por favor, selecione uma ou mais atividades para adicionar ao evento.",
        variant: "destructive",
      });
      return;
    }

    addActivitiesMutation.mutate(selectedActivityIds);
  };

  const handleRemoveActivity = (activityId: number) => {
    removeActivityMutation.mutate(activityId);
  };

  const handleSelectAll = () => {
    const allIds = filteredActivities.map(activity => activity.id);
    setSelectedActivityIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedActivityIds([]);
  };

  // Check if activity is already associated with current event
  const isActivityAssociated = (activityId: number) => {
    return currentActivities.some(current => current.id === activityId);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Atividades do Evento</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as atividades legislativas associadas a este evento
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Atividades
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Adicionar Atividades Legislativas ao Evento</DialogTitle>
              <DialogDescription>
                Selecione uma ou mais atividades legislativas para associar a este evento. A mesma atividade pode ser adicionada em vários eventos independente da categoria.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col space-y-4">
              {/* Search and Select All */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Pesquisar por número, tipo ou descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                {filteredActivities.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={selectedActivityIds.length === filteredActivities.length}
                    >
                      Selecionar Todas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAll}
                      disabled={selectedActivityIds.length === 0}
                    >
                      Desmarcar Todas
                    </Button>
                    <Badge variant="secondary" className="ml-2">
                      {selectedActivityIds.length} selecionada(s)
                    </Badge>
                  </div>
                )}
              </div>

              {/* Activities List */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {searchTerm ? 'Nenhuma atividade encontrada' : 'Nenhuma atividade disponível'}
                    </p>
                  </div>
                ) : (
                  filteredActivities.map((activity) => (
                    <Card key={activity.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`activity-${activity.id}`}
                          checked={selectedActivityIds.includes(activity.id)}
                          onCheckedChange={(checked) => 
                            handleActivitySelection(activity.id, checked as boolean)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              #{activity.activityNumber}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {activity.activityType}
                            </Badge>
                            {isActivityAssociated(activity.id) && (
                              <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                                Já no evento
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium line-clamp-2">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(activity.activityDate), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {activity.situacao}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={handleAddActivities}
                disabled={addActivitiesMutation.isPending || selectedActivityIds.length === 0}
                className="flex-1"
              >
                {addActivitiesMutation.isPending ? 'Adicionando...' : `Adicionar ${selectedActivityIds.length} Atividade(s)`}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {/* Current Activities */}
      {currentActivities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Nenhuma atividade associada</h3>
          <p className="text-sm">
            Use o botão "Adicionar Atividades" para associar atividades legislativas a este evento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">
              Atividades Associadas ({currentActivities.length})
            </h4>
          </div>
          
          <div className="grid gap-4">
            {currentActivities.map((activity) => (
              <Card key={activity.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{activity.activityNumber}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {activity.activityType}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {activity.situacao}
                      </Badge>
                    </div>
                    
                    <p className="text-sm font-medium">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(activity.activityDate), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {activity.regimeTramitacao}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      {activity.filePath && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="gap-1"
                          onClick={() => window.open(`/api/files/activities/${activity.id}`, '_blank')}
                        >
                          <FileText className="h-3 w-3" />
                          Arquivo
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-1"
                        onClick={() => window.open(`/legislative-activities/${activity.id}`, '_blank')}
                      >
                        <Activity className="h-3 w-3" />
                        Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveActivity(activity.id)}
                        disabled={removeActivityMutation.isPending}
                        className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-3 w-3" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}