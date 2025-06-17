import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import api from '../api/axios.config';
import { API_ENDPOINTS } from '../config/constants';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  recipientId: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor' | 'admin';
  avatar?: string;
}

interface Conversation {
  id: string;
  participant: Participant;
  lastMessage: Message;
  unreadCount: number;
  updatedAt: string;
}

export const useMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(API_ENDPOINTS.MESSAGES.CONVERSATIONS);
      setConversations(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch conversations'));
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (recipientId: string, content: string) => {
    try {
      const response = await api.post(API_ENDPOINTS.MESSAGES.BASE, {
        recipientId,
        content,
      });
      return response.data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to send message');
    }
  }, []);

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await api.put(`${API_ENDPOINTS.MESSAGES.BASE}/conversations/${conversationId}/read`);
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (err) {
      console.error('Failed to mark conversation as read:', err);
    }
  }, []);

  // Fetch conversations on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Set up WebSocket connection for real-time messages
  useEffect(() => {
    if (!user) return;

    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/messages`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({ type: 'auth', token: user.token }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'message') {
        setConversations(prev => {
          const conversationIndex = prev.findIndex(
            conv => conv.participant.id === data.senderId
          );

          if (conversationIndex === -1) {
            // New conversation
            return [{
              id: data.conversationId,
              participant: data.sender,
              lastMessage: data.message,
              unreadCount: 1,
              updatedAt: data.message.timestamp,
            }, ...prev];
          }

          // Update existing conversation
          const updatedConversations = [...prev];
          updatedConversations[conversationIndex] = {
            ...updatedConversations[conversationIndex],
            lastMessage: data.message,
            unreadCount: updatedConversations[conversationIndex].unreadCount + 1,
            updatedAt: data.message.timestamp,
          };

          // Move conversation to top
          const [conversation] = updatedConversations.splice(conversationIndex, 1);
          return [conversation, ...updatedConversations];
        });
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [user]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
    sendMessage,
    markAsRead,
  };
}; 