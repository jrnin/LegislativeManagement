import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { Link } from 'wouter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function NotificationPanel() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAllNotifications 
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'activity_vote':
        return <Badge variant="outline" className="bg-blue-50">Voto</Badge>;
      case 'activity_approval':
        return <Badge variant="outline" className="bg-green-50">Aprovação</Badge>;
      case 'activity_status_change':
        return <Badge variant="outline" className="bg-amber-50">Status</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  // Determinar a URL para cada tipo de notificação
  const getNotificationUrl = (notification: any) => {
    if (notification.activity && notification.activity.id) {
      if (['activity_vote', 'activity_approval', 'activity_status_change'].includes(notification.type)) {
        return `/activities/${notification.activity.id}`;
      }
    }
    return '#';
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true,
        locale: ptBR 
      });
    } catch (error) {
      return 'agora';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 text-[10px] font-bold flex items-center justify-center rounded-full bg-red-500 text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium text-sm">Notificações</h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={markAllAsRead}
                title="Marcar todas como lidas"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={clearAllNotifications}
                title="Limpar todas"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {notifications.length === 0 ? (
          <div className="py-12 px-4 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhuma notificação</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px]">
            <div className="flex flex-col divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex p-3 hover:bg-accent/30 ${!notification.read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={getNotificationUrl(notification)}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getNotificationIcon(notification.type)}
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm font-medium line-clamp-2">{notification.message}</p>
                      {notification.activity && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {notification.activity.title}
                        </p>
                      )}
                    </Link>
                  </div>
                  <div className="ml-2 flex flex-col gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => removeNotification(notification.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {!notification.read && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationPanel;