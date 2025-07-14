import { apiRequest } from './queryClient';

interface TimelineEntry {
  actionType: string;
  targetType: string;
  targetId?: number;
  description: string;
  metadata?: any;
}

export async function addTimelineEntry(eventId: number, entry: TimelineEntry): Promise<void> {
  try {
    await apiRequest('POST', `/api/events/${eventId}/timeline`, entry);
  } catch (error) {
    console.error('Error adding timeline entry:', error);
    // Falha silenciosa para não interromper o fluxo do usuário
  }
}

export const timelineActions = {
  // Ações para atividades
  viewActivity: (activityId: number, activityName: string) => ({
    actionType: 'activity_view',
    targetType: 'activity',
    targetId: activityId,
    description: `Visualizou a atividade: ${activityName}`,
  }),

  // Ações para documentos
  viewDocument: (documentId: number, documentName: string) => ({
    actionType: 'document_view',
    targetType: 'document',
    targetId: documentId,
    description: `Visualizou o documento: ${documentName}`,
  }),

  // Ações para comentários
  createComment: (commentId: number, commentText: string) => ({
    actionType: 'comment_create',
    targetType: 'comment',
    targetId: commentId,
    description: `Adicionou um comentário: "${commentText.substring(0, 100)}${commentText.length > 100 ? '...' : ''}"`,
  }),

  viewComments: () => ({
    actionType: 'comment_view',
    targetType: 'tab',
    description: 'Visualizou a aba de comentários',
  }),

  // Ações para lista de presença
  viewAttendance: () => ({
    actionType: 'attendance_view',
    targetType: 'tab',
    description: 'Visualizou a lista de presença',
  }),

  // Ações para votações
  viewVoting: () => ({
    actionType: 'voting_view',
    targetType: 'tab',
    description: 'Visualizou a aba de votações',
  }),
};