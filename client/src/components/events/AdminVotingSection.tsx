import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { addTimelineEntry, timelineActions } from "@/lib/timeline";

interface AdminVotingSectionProps {
  activityId: number;
  eventId: number;
  councilors: any[];
  existingVotes: any[];
  onVotesRegistered: () => void;
  onOptimisticUpdate?: (votes: any[]) => void;
}

export function AdminVotingSection({ 
  activityId, 
  eventId,
  councilors, 
  existingVotes, 
  onVotesRegistered,
  onOptimisticUpdate 
}: AdminVotingSectionProps) {
  const [selectedVotes, setSelectedVotes] = useState<Record<string, { vote: boolean }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Adicionar event listeners para os botões do cabeçalho
  useEffect(() => {
    const element = document.querySelector('[data-voting-section]');
    
    const handleApproveAllEvent = () => {
      handleApproveAll();
    };
    
    const handleClearSelectionEvent = () => {
      setSelectedVotes({});
      toast({
        title: "Seleção limpa",
        description: "Todas as seleções foram removidas."
      });
    };
    
    if (element) {
      element.addEventListener('approveAll', handleApproveAllEvent);
      element.addEventListener('clearSelection', handleClearSelectionEvent);
    }
    
    return () => {
      if (element) {
        element.removeEventListener('approveAll', handleApproveAllEvent);
        element.removeEventListener('clearSelection', handleClearSelectionEvent);
      }
    };
  }, [councilors]);

  const handleVoteChange = (councilorId: string, vote: boolean) => {
    setSelectedVotes(prev => ({
      ...prev,
      [councilorId]: {
        vote
      }
    }));
  };

  const handleSubmitVotes = async () => {
    const votesToSubmit = Object.entries(selectedVotes).map(([councilorId, voteData]) => ({
      userId: councilorId,
      vote: voteData.vote,
      comment: ""
    }));

    if (votesToSubmit.length === 0) {
      toast({
        title: "Nenhum voto selecionado",
        description: "Selecione pelo menos um vereador(a) para registrar votos.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Optimistic update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(votesToSubmit);
    }

    try {
      await apiRequest('POST', `/api/activities/${activityId}/votes/admin`, {
        votes: votesToSubmit,
        eventId
      });

      // Registrar ação na timeline
      const approvedVotes = votesToSubmit.filter(v => v.vote).length;
      const rejectedVotes = votesToSubmit.filter(v => !v.vote).length;
      const voteDescription = `${approvedVotes} voto(s) aprovado(s), ${rejectedVotes} voto(s) rejeitado(s)`;
      
      addTimelineEntry(eventId, timelineActions.adminVoting(activityId, voteDescription));

      toast({
        title: "Votos registrados",
        description: `${votesToSubmit.length} voto(s) registrado(s) com sucesso.`
      });

      setSelectedVotes({});
      onVotesRegistered();
    } catch (error) {
      toast({
        title: "Erro ao registrar votos",
        description: "Não foi possível registrar os votos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getExistingVote = (councilorId: string) => {
    return existingVotes.find(vote => vote.userId === councilorId);
  };

  const isCouncilorSelected = (councilorId: string) => {
    return selectedVotes[councilorId] !== undefined;
  };

  const handleApproveAll = () => {
    const allApprovedVotes: Record<string, { vote: boolean }> = {};
    
    councilors.forEach((councilor) => {
      allApprovedVotes[councilor.id] = {
        vote: true // Todos marcados como aprovado
      };
    });
    
    setSelectedVotes(allApprovedVotes);
    
    toast({
      title: "Aprovação oficial aplicada",
      description: `Todos os ${councilors.length} vereadores(as) foram selecionados com voto "Aprovado".`
    });
  };

  return (
    <div className="space-y-6" data-voting-section>
      {/* Lista de vereadores melhorada */}
      <div className="max-h-64 overflow-y-auto border rounded-xl p-4 bg-gray-50/50 space-y-3">
        {councilors.map((councilor) => {
          const existingVote = getExistingVote(councilor.id);
          const isSelected = isCouncilorSelected(councilor.id);
          
          return (
            <div key={councilor.id} className={`bg-white rounded-lg p-4 shadow-sm border-l-4 transition-all duration-200 ${
              isSelected 
                ? selectedVotes[councilor.id]?.vote 
                  ? 'border-l-green-500 bg-green-50/50' 
                  : 'border-l-red-500 bg-red-50/50'
                : 'border-l-gray-200 hover:border-l-blue-300 hover:shadow-md'
            }`}>
              <div className="flex items-start space-x-4">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleVoteChange(councilor.id, true);
                    } else {
                      setSelectedVotes(prev => {
                        const newVotes = { ...prev };
                        delete newVotes[councilor.id];
                        return newVotes;
                      });
                    }
                  }}
                  className="mt-1"
                />
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                        <AvatarImage src={councilor.profileImageUrl || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                          {councilor.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">{councilor.name}</p>
                        <p className="text-sm text-gray-500">{councilor.email}</p>
                      </div>
                    </div>
                    
                    {existingVote && (
                      <Badge 
                        variant={existingVote.vote ? "default" : "destructive"} 
                        className={`text-xs font-medium ${
                          existingVote.vote 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}
                      >
                        {existingVote.vote ? "✓ Aprovou" : "✗ Rejeitou"}
                      </Badge>
                    )}
                  </div>
                  
                  {isSelected && (
                    <div className="pl-4 border-l-2 border-gray-100">
                      <div className="flex gap-2">
                        <Button
                          variant={selectedVotes[councilor.id]?.vote === true ? "default" : "outline"}
                          size="sm"
                          className={`flex-1 transition-all duration-200 ${
                            selectedVotes[councilor.id]?.vote === true 
                              ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
                              : 'hover:bg-green-50 hover:border-green-300 hover:text-green-700'
                          }`}
                          onClick={() => handleVoteChange(councilor.id, true)}
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          variant={selectedVotes[councilor.id]?.vote === false ? "default" : "outline"}
                          size="sm"
                          className={`flex-1 transition-all duration-200 ${
                            selectedVotes[councilor.id]?.vote === false 
                              ? 'bg-red-600 hover:bg-red-700 text-white shadow-md' 
                              : 'hover:bg-red-50 hover:border-red-300 hover:text-red-700'
                          }`}
                          onClick={() => handleVoteChange(councilor.id, false)}
                        >
                          <ThumbsDown className="w-4 h-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Indicador de progresso */}
      {Object.keys(selectedVotes).length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="text-sm text-blue-700 mb-2 font-medium">
            {Object.keys(selectedVotes).length} de {councilors.length} vereadores selecionados
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(Object.keys(selectedVotes).length / councilors.length) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Botão de registrar votos centralizado */}
      {Object.keys(selectedVotes).length > 0 && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={handleSubmitVotes}
            disabled={Object.keys(selectedVotes).length === 0 || isSubmitting}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-2.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Registrando Votos...
              </>
            ) : (
              <>
                <ThumbsUp className="w-5 h-5 mr-2" />
                Registrar {Object.keys(selectedVotes).length} Voto(s)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}