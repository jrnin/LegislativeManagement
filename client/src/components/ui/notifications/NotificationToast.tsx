import React, { useEffect } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

const NotificationToast = () => {
  const { notifications } = useNotifications();
  const { toast } = useToast();

  // Monitorar novas notificações não lidas e convertê-las em toasts
  useEffect(() => {
    // Encontrar notificações não lidas recentes (últimos 5 segundos)
    const now = new Date();
    const recentNotifications = notifications.filter(n => 
      !n.read && 
      (now.getTime() - new Date(n.timestamp).getTime()) < 5000
    );

    // Mostrar toasts para notificações recentes
    recentNotifications.forEach(notification => {
      toast({
        title: getNotificationTitle(notification.type),
        description: notification.message,
        action: notification.activity ? (
          <ToastAction 
            altText="Ver"
            onClick={() => {
              window.location.href = `/legislative-activities/${notification.activity?.id}`;
            }}
          >
            Ver
          </ToastAction>
        ) : undefined
      });
    });
  }, [notifications]);

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'activity_vote':
        return 'Novo Voto';
      case 'activity_approval':
        return 'Atividade Aprovada';
      case 'activity_status_change':
        return 'Status Alterado';
      default:
        return 'Notificação';
    }
  };

  return null; // Este componente não renderiza nada, apenas gerencia os toasts
};

export default NotificationToast;