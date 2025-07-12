import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";

interface AdminVotingSectionProps {
  activityId: number;
  councilors: any[];
  existingVotes: any[];
  onVotesRegistered: () => void;
}

export function AdminVotingSection({ 
  activityId, 
  councilors, 
  existingVotes, 
  onVotesRegistered 
}: AdminVotingSectionProps) {
  const [selectedVotes, setSelectedVotes] = useState<Record<string, { vote: boolean; comment: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleVoteChange = (councilorId: string, vote: boolean) => {
    setSelectedVotes(prev => ({
      ...prev,
      [councilorId]: {
        vote,
        comment: prev[councilorId]?.comment || ""
      }
    }));
  };

  const handleCommentChange = (councilorId: string, comment: string) => {
    setSelectedVotes(prev => ({
      ...prev,
      [councilorId]: {
        vote: prev[councilorId]?.vote || true,
        comment
      }
    }));
  };

  const handleSubmitVotes = async () => {
    const votesToSubmit = Object.entries(selectedVotes).map(([councilorId, voteData]) => ({
      councilorId,
      vote: voteData.vote,
      comment: voteData.comment
    }));

    if (votesToSubmit.length === 0) {
      toast({
        title: "Nenhum voto selecionado",
        description: "Selecione pelo menos um vereador para registrar votos.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest('POST', `/api/activities/${activityId}/votes/admin`, {
        votes: votesToSubmit
      });

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

  return (
    <div className="space-y-4">
      <div className="max-h-64 overflow-y-auto border rounded-lg p-4 space-y-3">
        {councilors.map((councilor) => {
          const existingVote = getExistingVote(councilor.id);
          const isSelected = isCouncilorSelected(councilor.id);
          
          return (
            <div key={councilor.id} className="flex items-start space-x-3">
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
              />
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={councilor.profileImageUrl || ''} />
                    <AvatarFallback>{councilor.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{councilor.name}</p>
                    <p className="text-sm text-muted-foreground">{councilor.email}</p>
                  </div>
                  
                  {existingVote && (
                    <Badge variant={existingVote.vote ? "default" : "destructive"} className="text-xs">
                      {existingVote.vote ? "Aprovou" : "Rejeitou"}
                    </Badge>
                  )}
                </div>
                
                {isSelected && (
                  <div className="space-y-2 pl-11">
                    <div className="flex gap-2">
                      <Button
                        variant={selectedVotes[councilor.id]?.vote === true ? "default" : "outline"}
                        size="sm"
                        className={`${selectedVotes[councilor.id]?.vote === true ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        onClick={() => handleVoteChange(councilor.id, true)}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        variant={selectedVotes[councilor.id]?.vote === false ? "default" : "outline"}
                        size="sm"
                        className={`${selectedVotes[councilor.id]?.vote === false ? 'bg-red-600 hover:bg-red-700' : ''}`}
                        onClick={() => handleVoteChange(councilor.id, false)}
                      >
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor={`comment-${councilor.id}`} className="text-xs">
                        Comentário (opcional):
                      </Label>
                      <Textarea
                        id={`comment-${councilor.id}`}
                        value={selectedVotes[councilor.id]?.comment || ""}
                        onChange={(e) => handleCommentChange(councilor.id, e.target.value)}
                        placeholder="Comentário sobre o voto..."
                        className="resize-none min-h-[60px] text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setSelectedVotes({})}
          disabled={Object.keys(selectedVotes).length === 0}
        >
          Limpar Seleção
        </Button>
        <Button
          onClick={handleSubmitVotes}
          disabled={Object.keys(selectedVotes).length === 0 || isSubmitting}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              <ThumbsUp className="w-4 h-4 mr-2" />
              Registrar Votos ({Object.keys(selectedVotes).length})
            </>
          )}
        </Button>
      </div>
    </div>
  );
}