import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getApi } from '../api/axios.config';
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
}

interface Conversation {
  id: string;
  participant: Participant;
  lastMessage?: Message;
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
      const api = await getApi();
      const response = await api.get(API_ENDPOINTS.MESSAGES.CONVERSATIONS);
      setConversations(response.data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch conversations'));
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (recipientId: string, content: string) => {
    try {
      const api = await getApi();
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
      const api = await getApi();
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

  const fetchNewMessages = useCallback(async (conversationId: string) => {
    try {
      const api = await getApi();
      const response = await api.get(`/api/messages/${conversationId}`);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch new messages:', err);
      throw err instanceof Error ? err : new Error('Failed to fetch new messages');
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

    // For now, we'll skip WebSocket implementation to avoid connection issues
    // This can be implemented later when the backend supports WebSocket
    console.log('WebSocket connection skipped for now');

    return () => {
      // Cleanup if needed
    };
  }, [user]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
    sendMessage,
    markAsRead,
    fetchNewMessages,
  };
}; 