import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../hooks';
import { RootState } from '../../store';
import { Chat, User, Message } from '../../types';
import { getApi } from '../../api/axios.config';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from '../../config/constants';

type DoctorMessagesScreenNavigationProp = NativeStackNavigationProp<
  any,
  'DoctorMessages'
>;

interface ChatWithPatient extends Chat {
  patient: User;
  lastMessage?: Message;
  unreadCount: number;
}

export default function DoctorMessagesScreen() {
  const navigation = useNavigation<DoctorMessagesScreenNavigationProp>();
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [conversations, setConversations] = useState<ChatWithPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = async () => {
    try {
      const client = await getApi();
      const response = await client.get('/api/doctor/conversations');
      setConversations(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Fetch conversations error:', err);
      setError('Failed to load conversations');
      setConversations([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchConversations();
  };

  const handleChatPress = (chat: ChatWithPatient) => {
    navigation.navigate(ROUTES.DOCTOR.CHAT, {
      chatId: chat.id,
      patientName: `${chat.patient.firstName} ${chat.patient.lastName}`,
    });
  };

  const formatLastMessageTime = (date: string) => {
    const messageDate = parseISO(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMM dd');
    }
  };

  const getFilteredConversations = () => {
    if (!searchQuery.trim()) return conversations;
    
    return conversations.filter(chat => 
      chat.patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.patient.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderConversation = ({ item }: { item: ChatWithPatient }) => (
    <TouchableOpacity
      style={[styles.conversationCard, { backgroundColor: theme.colors.background.secondary }]}
      onPress={() => handleChatPress(item)}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.avatarText, { color: 'white' }]}>
            {item.patient.firstName.charAt(0)}{item.patient.lastName.charAt(0)}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: theme.colors.error }]}>
            <Text style={styles.unreadText}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.patientName, { color: theme.colors.text.default }]}>
            {item.patient.firstName} {item.patient.lastName}
          </Text>
          {item.lastMessage && (
            <Text style={[styles.messageTime, { color: theme.colors.text.secondary }]}>
              {formatLastMessageTime(item.lastMessage.createdAt)}
            </Text>
          )}
        </View>

        {item.lastMessage ? (
          <Text 
            style={[
              styles.lastMessage, 
              { 
                color: item.unreadCount > 0 
                  ? theme.colors.text.default 
                  : theme.colors.text.secondary 
              }
            ]}
            numberOfLines={1}
          >
            {item.lastMessage.content}
          </Text>
        ) : (
          <Text style={[styles.noMessages, { color: theme.colors.text.secondary }]}>
            No messages yet
          </Text>
        )}
      </View>

      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={theme.colors.text.secondary} 
      />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.background.secondary }]}>
        <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text.default }]}
          placeholder="Search patients..."
          placeholderTextColor={theme.colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      )}

      <FlatList
        data={getFilteredConversations()}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons 
              name="chatbubbles-outline" 
              size={64} 
              color={theme.colors.text.secondary} 
              style={styles.emptyIcon} 
            />
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              {searchQuery ? 'No patients found' : 'No conversations yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.text.secondary }]}>
              {searchQuery ? 'Try a different search term' : 'Start a conversation with your patients'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 12,
  },
  lastMessage: {
    fontSize: 14,
  },
  noMessages: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 