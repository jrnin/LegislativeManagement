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
  addActivity: (activityId: number, activityName: string) => ({
    actionType: 'activity_add',
    targetType: 'activity',
    targetId: activityId,
    description: `Adicionou a atividade: ${activityName}`,
  }),

  removeActivity: (activityId: number, activityName: string) => ({
    actionType: 'activity_remove',
    targetType: 'activity',
    targetId: activityId,
    description: `Removeu a atividade: ${activityName}`,
  }),

  // Ações para documentos
  addDocument: (documentId: number, documentName: string) => ({
    actionType: 'document_add',
    targetType: 'document',
    targetId: documentId,
    description: `Adicionou o documento: ${documentName}`,
  }),

  removeDocument: (documentId: number, documentName: string) => ({
    actionType: 'document_remove',
    targetType: 'document',
    targetId: documentId,
    description: `Removeu o documento: ${documentName}`,
  }),

  // Ações para comentários
  createComment: (commentId: number, commentText: string) => ({
    actionType: 'comment_create',
    targetType: 'comment',
    targetId: commentId,
    description: `Adicionou um comentário: "${commentText.substring(0, 100)}${commentText.length > 100 ? '...' : ''}"`,
  }),

  editComment: (commentId: number, commentText: string) => ({
    actionType: 'comment_edit',
    targetType: 'comment',
    targetId: commentId,
    description: `Editou um comentário: "${commentText.substring(0, 100)}${commentText.length > 100 ? '...' : ''}"`,
  }),

  deleteComment: (commentId: number) => ({
    actionType: 'comment_delete',
    targetType: 'comment',
    targetId: commentId,
    description: `Excluiu um comentário`,
  }),

  // Ações para lista de presença
  updateAttendance: (userId: string, userName: string, status: string) => ({
    actionType: 'attendance_update',
    targetType: 'attendance',
    targetId: null,
    description: `Atualizou a presença de ${userName} para ${status}`,
  }),

  // Ações para votações
  castVote: (activityId: number, activityName: string, voteType: string) => ({
    actionType: 'vote_cast',
    targetType: 'vote',
    targetId: activityId,
    description: `Votou ${voteType} na atividade: ${activityName}`,
  }),

  cancelVote: (activityId: number, activityName: string) => ({
    actionType: 'vote_cancel',
    targetType: 'vote',
    targetId: activityId,
    description: `Cancelou o voto na atividade: ${activityName}`,
  }),

  adminVoting: (activityId: number, voteDescription: string) => ({
    actionType: 'admin_vote',
    targetType: 'vote',
    targetId: activityId,
    description: `Registrou votos administrativos: ${voteDescription}`,
  }),
};