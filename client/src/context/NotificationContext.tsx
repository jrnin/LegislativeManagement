import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: string;
  message: string;
  activity?: {
    id: number;
    title: string;
    description?: string;
  };
  timestamp: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de um NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { user, isAuthenticated } = useAuth();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Conectar ao WebSocket quando o usuário estiver autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      // Criar a conexão WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host || 'localhost:5000';
      const wsUrl = `${protocol}//${host}/ws`;
      
      console.log('Tentando conectar ao WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Conexão WebSocket estabelecida');
        // Autenticar o WebSocket com o ID do usuário
        if (user.id) {
          ws.send(JSON.stringify({
            type: 'auth',
            userId: user.id
          }));
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Lidar com diferentes tipos de mensagens
          if (data.type === 'connection') {
            console.log('Conexão confirmada:', data.message);
          } else if (['activity_vote', 'activity_approval', 'activity_status_change'].includes(data.type)) {
            // Criar uma notificação baseada na mensagem recebida
            const newNotification: Notification = {
              id: crypto.randomUUID(),
              type: data.type,
              message: data.message,
              activity: data.activity,
              timestamp: data.timestamp,
              read: false
            };
            
            // Adicionar à lista de notificações
            setNotifications(prev => [newNotification, ...prev]);
            
            // Mostrar um toast com a notificação
            toast({
              title: 'Nova notificação',
              description: data.message,
              duration: 5000,
            });
          }
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('Erro na conexão WebSocket:', error);
      };
      
      ws.onclose = (event) => {
        console.log('Conexão WebSocket fechada:', event.code, event.reason);
        // Não tentar reconectar automaticamente para evitar loops
      };
      
      setSocket(ws);
      
      // Limpar a conexão
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }
  }, [isAuthenticated, user]);
  
  // Recuperar notificações armazenadas localmente ao iniciar
  useEffect(() => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        setNotifications(JSON.parse(storedNotifications));
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
      }
    }
  }, []);
  
  // Salvar notificações no localStorage sempre que forem atualizadas
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);
  
  // Funções para gerenciar notificações
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
  };
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};