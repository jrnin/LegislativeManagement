import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, User, FileText, Calendar, MessageSquare, Users } from 'lucide-react';
import { EventTimeline as EventTimelineType } from '@shared/schema';
import { formatDateTime } from '@/lib/utils';

interface EventTimelineProps {
  eventId: number;
}

export function EventTimeline({ eventId }: EventTimelineProps) {
  const { data: timeline, isLoading } = useQuery<(EventTimelineType & { user: any })[]>({
    queryKey: [`/api/events/${eventId}/timeline`],
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma atividade ainda</h3>
          <p className="text-gray-500">
            As atividades dos usuários neste evento aparecerão aqui
          </p>
        </CardContent>
      </Card>
    );
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'activity_add':
      case 'activity_remove':
        return <FileText className="w-4 h-4" />;
      case 'document_add':
      case 'document_remove':
        return <FileText className="w-4 h-4" />;
      case 'comment_create':
      case 'comment_edit':
      case 'comment_delete':
        return <MessageSquare className="w-4 h-4" />;
      case 'attendance_update':
        return <Users className="w-4 h-4" />;
      case 'vote_cast':
        return <Calendar className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'activity_add':
        return 'bg-blue-100 text-blue-800';
      case 'activity_remove':
        return 'bg-red-100 text-red-800';
      case 'document_add':
        return 'bg-green-100 text-green-800';
      case 'document_remove':
        return 'bg-red-100 text-red-800';
      case 'comment_create':
        return 'bg-purple-100 text-purple-800';
      case 'comment_edit':
        return 'bg-purple-100 text-purple-800';
      case 'comment_delete':
        return 'bg-red-100 text-red-800';
      case 'attendance_update':
        return 'bg-yellow-100 text-yellow-800';
      case 'vote_cast':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Linha do Tempo
        </CardTitle>
        <CardDescription>
          Histórico de atividades dos usuários neste evento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((entry, index) => (
            <div key={entry.id} className="flex items-start space-x-3">
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={entry.user?.profileImageUrl || ''} />
                  <AvatarFallback>
                    {entry.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {index < timeline.length - 1 && (
                  <div className="absolute top-8 left-4 w-px h-6 bg-gray-300"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className={`text-xs ${getActionColor(entry.actionType)}`}>
                    {getActionIcon(entry.actionType)}
                    <span className="ml-1">
                      {entry.actionType === 'activity_add' && 'Adicionou Atividade'}
                      {entry.actionType === 'activity_remove' && 'Removeu Atividade'}
                      {entry.actionType === 'document_add' && 'Adicionou Documento'}
                      {entry.actionType === 'document_remove' && 'Removeu Documento'}
                      {entry.actionType === 'comment_create' && 'Comentou'}
                      {entry.actionType === 'comment_edit' && 'Editou Comentário'}
                      {entry.actionType === 'comment_delete' && 'Excluiu Comentário'}
                      {entry.actionType === 'attendance_update' && 'Atualizou Presença'}
                      {entry.actionType === 'vote_cast' && 'Registrou Voto'}
                    </span>
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{entry.user?.name}</span>
                  <span className="text-xs text-gray-500">
                    {entry.user?.role === 'admin' && 'Administrador'}
                    {entry.user?.role === 'councilor' && 'Vereador'}
                    {entry.user?.role === 'user' && 'Usuário'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700">{entry.description}</p>
                
                {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <strong>Detalhes:</strong>
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}