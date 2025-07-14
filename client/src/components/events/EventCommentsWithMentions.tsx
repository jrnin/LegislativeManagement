import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Send, 
  AtSign, 
  Calendar, 
  FileText,
  Activity,
  User,
  Hash,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addTimelineEntry, timelineActions } from '@/lib/timeline';

interface EventComment {
  id: number;
  eventId: number;
  userId: string;
  content: string;
  mentions: Mention[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profileImageUrl?: string;
  };
}

interface Mention {
  id: number;
  type: 'event' | 'activity' | 'document';
  title: string;
  position: number;
  length: number;
}

interface EventCommentsWithMentionsProps {
  eventId: number;
}

const EventCommentsWithMentions: React.FC<EventCommentsWithMentionsProps> = ({ eventId }) => {
  const [newComment, setNewComment] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [mentionType, setMentionType] = useState<'event' | 'activity' | 'document'>('event');
  const [currentMentions, setCurrentMentions] = useState<Mention[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch comments for the event
  const { data: comments = [], isLoading, refetch } = useQuery<EventComment[]>({
    queryKey: ['event-comments', eventId],
    queryFn: async () => {
      const response = await apiRequest<EventComment[]>(`/api/events/${eventId}/comments`);
      return Array.isArray(response) ? response : [];
    },
    enabled: !!eventId,
    staleTime: 0,
  });

  // Fetch mention suggestions
  const { data: mentionSuggestions = [] } = useQuery({
    queryKey: ['mention-suggestions', mentionType, mentionQuery],
    queryFn: async () => {
      if (!mentionQuery.trim()) return [];
      const response = await apiRequest<any[]>(`/api/mentions/search?type=${mentionType}&query=${encodeURIComponent(mentionQuery)}`);
      return response;
    },
    enabled: showMentions && mentionQuery.length > 0,
    staleTime: 30000,
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (data: { content: string; mentions: Mention[] }) => {
      const response = await apiRequest('POST', `/api/events/${eventId}/comments`, data);
      return await response.json();
    },
    onSuccess: (newComment) => {
      queryClient.invalidateQueries({ queryKey: ['event-comments', eventId] });
      refetch();
      
      // Registrar na timeline
      addTimelineEntry(eventId, timelineActions.createComment(newComment.id, newComment.content));
      
      setNewComment('');
      setCurrentMentions([]);
      setShowMentions(false);
      toast({
        title: "Comentário criado",
        description: "Seu comentário foi adicionado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar comentário",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest('DELETE', `/api/events/${eventId}/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-comments', eventId] });
      refetch();
      toast({
        title: "Comentário excluído",
        description: "O comentário foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir comentário",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setNewComment(value);

    // Check for mention trigger
    const beforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/(@|#|!)([^@#!\s]*)$/);
    
    if (mentionMatch) {
      const [, trigger, query] = mentionMatch;
      setMentionQuery(query);
      setMentionPosition(cursorPosition - query.length);
      setShowMentions(true);
      
      // Set mention type based on trigger
      if (trigger === '@') setMentionType('event');
      else if (trigger === '#') setMentionType('activity'); 
      else if (trigger === '!') setMentionType('document');
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (suggestion: any) => {
    const trigger = mentionType === 'event' ? '@' : mentionType === 'activity' ? '#' : '!';
    const mentionText = `${trigger}${suggestion.title || suggestion.activityNumber || suggestion.documentNumber}`;
    
    const beforeMention = newComment.substring(0, mentionPosition - 1);
    const afterMention = newComment.substring(mentionPosition + mentionQuery.length);
    
    const newContent = beforeMention + mentionText + afterMention;
    setNewComment(newContent);
    setShowMentions(false);
    
    // Store the mention data
    const mentionData: Mention = {
      id: suggestion.id,
      type: mentionType,
      title: suggestion.title || suggestion.activityNumber || suggestion.documentNumber,
      position: mentionPosition - 1,
      length: mentionText.length
    };
    
    // Add to current mentions array
    setCurrentMentions(prev => [...prev, mentionData]);
    
    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
      const newCursorPosition = beforeMention.length + mentionText.length;
      textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    }
  };

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    createCommentMutation.mutate({
      content: newComment.trim(),
      mentions: currentMentions
    });
  };

  const handleDeleteComment = (commentId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este comentário?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const canDeleteComment = (comment: EventComment) => {
    return user && (user.id === comment.userId || user.role === 'admin');
  };

  const getNavigationUrl = (mention: Mention) => {
    switch (mention.type) {
      case 'event':
        return `/events/${mention.id}`;
      case 'activity':
        return `/activities/${mention.id}`;
      case 'document':
        return `/documents/${mention.id}`;
      default:
        return '#';
    }
  };

  const renderCommentContent = (comment: EventComment) => {
    if (!comment.mentions || comment.mentions.length === 0) {
      return <p className="text-gray-700">{comment.content}</p>;
    }

    const parts = [];
    let lastIndex = 0;
    
    comment.mentions
      .sort((a, b) => a.position - b.position)
      .forEach((mention, index) => {
        // Add text before mention
        if (mention.position > lastIndex) {
          parts.push(comment.content.substring(lastIndex, mention.position));
        }
        
        // Add mention as clickable link
        const mentionText = comment.content.substring(mention.position, mention.position + mention.length);
        const icon = mention.type === 'event' ? Calendar : 
                    mention.type === 'activity' ? Activity : FileText;
        const IconComponent = icon;
        const navigationUrl = getNavigationUrl(mention);
        
        parts.push(
          <button
            key={`mention-${index}`}
            onClick={() => navigate(navigationUrl)}
            className="inline-flex items-center gap-1 mx-1 px-2 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
          >
            <IconComponent className="w-3 h-3" />
            {mentionText}
            <ExternalLink className="w-3 h-3" />
          </button>
        );
        
        lastIndex = mention.position + mention.length;
      });
    
    // Add remaining text
    if (lastIndex < comment.content.length) {
      parts.push(comment.content.substring(lastIndex));
    }
    
    return <div className="text-gray-700">{parts}</div>;
  };

  const getMentionIcon = (type: string) => {
    switch (type) {
      case 'event': return Calendar;
      case 'activity': return Activity;
      case 'document': return FileText;
      default: return Hash;
    }
  };

  const getMentionTrigger = (type: string) => {
    switch (type) {
      case 'event': return '@';
      case 'activity': return '#';
      case 'document': return '!';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Comentários do Evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={handleTextareaChange}
                placeholder="Escreva seu comentário... Use @ para mencionar eventos, # para atividades, ! para documentos"
                className="min-h-[100px] pr-12"
              />
              
              {/* Mention suggestions */}
              {showMentions && mentionSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-lg">
                  {mentionSuggestions.map((suggestion, index) => {
                    const Icon = getMentionIcon(mentionType);
                    const trigger = getMentionTrigger(mentionType);
                    const displayText = suggestion.title || 
                                     suggestion.activityNumber || 
                                     suggestion.documentNumber || 
                                     suggestion.eventNumber;
                    
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => insertMention(suggestion)}
                      >
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          {trigger}{displayText}
                        </span>
                        {suggestion.description && (
                          <span className="text-xs text-gray-500 ml-2">
                            {suggestion.description}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <AtSign className="w-4 h-4" />
                  @ eventos
                </div>
                <div className="flex items-center gap-1">
                  <Hash className="w-4 h-4" />
                  # atividades
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold">!</span>
                  documentos
                </div>
              </div>
              
              <Button
                onClick={handleSubmit}
                disabled={!newComment.trim() || createCommentMutation.isPending}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {createCommentMutation.isPending ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Carregando comentários...</p>
            </CardContent>
          </Card>
        ) : comments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum comentário ainda.</p>
              <p className="text-sm text-gray-400">Seja o primeiro a comentar!</p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={comment.user?.profileImageUrl} />
                    <AvatarFallback>
                      {comment.user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{comment.user?.name}</span>
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(comment.createdAt), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                        {comment.isEdited && (
                          <Badge variant="outline" className="text-xs">
                            Editado
                          </Badge>
                        )}
                      </div>
                      
                      {canDeleteComment(comment) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deleteCommentMutation.isPending}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      {renderCommentContent(comment)}
                    </div>
                    
                    {comment.mentions && comment.mentions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {comment.mentions.map((mention, index) => {
                          const Icon = getMentionIcon(mention.type);
                          return (
                            <Badge 
                              key={index}
                              variant="outline" 
                              className="text-xs flex items-center gap-1"
                            >
                              <Icon className="w-3 h-3" />
                              {mention.title}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default EventCommentsWithMentions;