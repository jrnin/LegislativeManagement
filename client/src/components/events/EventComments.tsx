import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { MessageCircle, Send, Edit, Trash2, AtSign, FileText, Calendar, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventComment {
  id: number;
  eventId: number;
  userId: number;
  content: string;
  mentions: any[];
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
    profileImageUrl?: string;
  };
}

interface MentionResult {
  id: string | number;
  title: string;
  description?: string;
  type: 'event' | 'activity' | 'document';
  date?: string;
  status?: string;
  category?: string;
  url: string;
  highlight?: string;
}

interface EventCommentsProps {
  eventId: number;
}

const EventComments: React.FC<EventCommentsProps> = ({ eventId }) => {
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });
  const [mentionType, setMentionType] = useState<'event' | 'activity' | 'document' | undefined>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Fetch comments for the event
  const { data: comments = [], isLoading, error } = useQuery<EventComment[]>({
    queryKey: ['event-comments', eventId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/events/${eventId}/comments`);
      return Array.isArray(response) ? response : [];
    },
    staleTime: 0, // Always fetch fresh data
    enabled: !!eventId,
  });

  // Fetch mentions search results
  const { data: mentionResults = [], isLoading: isLoadingMentions } = useQuery<MentionResult[]>({
    queryKey: ['mentions', mentionSearch, mentionType],
    queryFn: async () => {
      if (!mentionSearch || mentionSearch.length < 2) return [];
      const params = new URLSearchParams({
        query: mentionSearch,
        ...(mentionType && { type: mentionType })
      });
      const response = await apiRequest('GET', `/api/search/mentions?${params}`);
      return response;
    },
    staleTime: 10000,
    enabled: showMentionPopover && mentionSearch.length >= 2,
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async ({ content, mentions }: { content: string; mentions: any[] }) => {
      return await apiRequest('POST', `/api/events/${eventId}/comments`, {
        content,
        mentions
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-comments', eventId] });
      queryClient.refetchQueries({ queryKey: ['event-comments', eventId] });
      setNewComment('');
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

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content, mentions }: { commentId: number; content: string; mentions: any[] }) => {
      return await apiRequest('PUT', `/api/events/${eventId}/comments/${commentId}`, {
        content,
        mentions
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-comments', eventId] });
      queryClient.refetchQueries({ queryKey: ['event-comments', eventId] });
      setEditingComment(null);
      setEditContent('');
      toast({
        title: "Comentário atualizado",
        description: "Seu comentário foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar comentário",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return await apiRequest('DELETE', `/api/events/${eventId}/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-comments', eventId] });
      queryClient.refetchQueries({ queryKey: ['event-comments', eventId] });
      toast({
        title: "Comentário excluído",
        description: "O comentário foi excluído com sucesso.",
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

  // Handle text change and mention detection
  const handleTextChange = (value: string, isEditing = false) => {
    if (isEditing) {
      setEditContent(value);
    } else {
      setNewComment(value);
    }

    // Check for mention trigger
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtSign = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSign !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtSign + 1);
      
      // Check if it's a valid mention pattern
      if (textAfterAt.length >= 0 && !textAfterAt.includes(' ')) {
        const mentionPrefix = textAfterAt.split(':')[0];
        const searchTerm = textAfterAt.split(':')[1] || '';
        
        // Determine mention type
        let type: 'event' | 'activity' | 'document' | undefined;
        if (mentionPrefix === 'evento') type = 'event';
        else if (mentionPrefix === 'atividade') type = 'activity';
        else if (mentionPrefix === 'documento') type = 'document';
        
        if (type) {
          setMentionType(type);
          setMentionSearch(searchTerm);
          setMentionPosition({ start: lastAtSign, end: cursorPos });
          setShowMentionPopover(true);
        } else {
          setShowMentionPopover(false);
        }
      } else {
        setShowMentionPopover(false);
      }
    } else {
      setShowMentionPopover(false);
    }
  };

  // Handle mention selection
  const handleMentionSelect = (mention: MentionResult) => {
    const currentText = editingComment ? editContent : newComment;
    const beforeMention = currentText.slice(0, mentionPosition.start);
    const afterMention = currentText.slice(mentionPosition.end);
    
    const mentionText = `@${mentionType}:${mention.title}`;
    const newText = beforeMention + mentionText + afterMention;
    
    if (editingComment) {
      setEditContent(newText);
    } else {
      setNewComment(newText);
    }
    
    setShowMentionPopover(false);
    textareaRef.current?.focus();
  };

  // Handle comment submission
  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    const mentions = extractMentions(newComment);
    createCommentMutation.mutate({ content: newComment, mentions });
  };

  // Handle comment update
  const handleUpdateComment = (commentId: number) => {
    if (!editContent.trim()) return;
    
    const mentions = extractMentions(editContent);
    updateCommentMutation.mutate({ commentId, content: editContent, mentions });
  };

  // Extract mentions from text
  const extractMentions = (text: string) => {
    const mentionRegex = /@(evento|atividade|documento):([^@\s]+)/g;
    const mentions: any[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const [, type, title] = match;
      mentions.push({ type, title });
    }
    
    return mentions;
  };

  // Render mentions in comment content
  const renderCommentContent = (content: string, mentions: any[] = []) => {
    if (!mentions.length) return content;
    
    let renderedContent = content;
    
    mentions.forEach((mention) => {
      const mentionText = `@${mention.type}:${mention.title}`;
      const mentionBadge = `<span class="mention-badge">${mentionText}</span>`;
      renderedContent = renderedContent.replace(mentionText, mentionBadge);
    });
    
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: renderedContent }}
        className="[&_.mention-badge]:bg-blue-100 [&_.mention-badge]:text-blue-800 [&_.mention-badge]:px-2 [&_.mention-badge]:py-1 [&_.mention-badge]:rounded-full [&_.mention-badge]:text-xs [&_.mention-badge]:font-medium"
      />
    );
  };

  // Get mention icon
  const getMentionIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-3 h-3" />;
      case 'activity':
        return <Hash className="w-3 h-3" />;
      case 'document':
        return <FileText className="w-3 h-3" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        Erro ao carregar comentários
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Comment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Adicionar Comentário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Escreva seu comentário... Use @evento:, @atividade:, ou @documento: para mencionar items"
                className="min-h-[100px] resize-none"
              />
              
              {/* Mention Popover */}
              {showMentionPopover && (
                <Popover open={showMentionPopover} onOpenChange={setShowMentionPopover}>
                  <PopoverTrigger asChild>
                    <div className="absolute inset-0 pointer-events-none" />
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0">
                    <Command>
                      <CommandInput 
                        placeholder={`Buscar ${mentionType}...`}
                        value={mentionSearch}
                        onValueChange={setMentionSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {isLoadingMentions ? "Carregando..." : "Nenhum resultado encontrado"}
                        </CommandEmpty>
                        <CommandGroup>
                          {mentionResults.map((result) => (
                            <CommandItem
                              key={result.id}
                              onSelect={() => handleMentionSelect(result)}
                              className="flex items-center gap-2"
                            >
                              {getMentionIcon(result.type)}
                              <div className="flex-1">
                                <div className="font-medium">{result.title}</div>
                                {result.description && (
                                  <div className="text-sm text-gray-500 truncate">
                                    {result.description}
                                  </div>
                                )}
                              </div>
                              <Badge variant="secondary">{result.type}</Badge>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Dica: Use @evento:, @atividade:, ou @documento: para mencionar items
              </div>
              <Button
                onClick={handleSubmitComment}
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
        {!comments || comments.length === 0 ? (
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
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.user?.name}</span>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {editingComment === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => handleTextChange(e.target.value, true)}
                            className="min-h-[100px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateComment(comment.id)}
                              disabled={updateCommentMutation.isPending}
                            >
                              {updateCommentMutation.isPending ? "Salvando..." : "Salvar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingComment(null);
                                setEditContent('');
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          {renderCommentContent(comment.content, comment.mentions)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingComment(comment.id);
                        setEditContent(comment.content);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      disabled={deleteCommentMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

export default EventComments;