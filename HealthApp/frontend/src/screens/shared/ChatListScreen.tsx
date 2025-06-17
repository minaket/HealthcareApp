import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PatientStackParamList, DoctorStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { Chat, User, Message } from '../../types';
import api from '../../api/axios.config';
import { ROUTES } from '../../config/constants';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { useAppSelector } from '../../hooks';
import { RootState } from '../../store';

type ChatListScreenProps = {
  navigation: NativeStackNavigationProp<
    PatientStackParamList | DoctorStackParamList,
    'ChatList'
  >;
};

interface ChatWithUser extends Chat {
  otherUser: User;
  lastMessage: Message;
  unreadCount: number;
}

export default function ChatListScreen() {
  const navigation = useNavigation<ChatListScreenProps['navigation']>();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  const [chats, setChats] = useState<ChatWithUser[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchChats = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await api.get('/chats');
      const sortedChats = response.data.sort(
        (a: ChatWithUser, b: ChatWithUser) =>
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime()
      );
      setChats(sortedChats);
      setFilteredChats(sortedChats);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load chats');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = chats.filter(
        (chat) =>
          chat.otherUser.firstName.toLowerCase().includes(query) ||
          chat.otherUser.lastName.toLowerCase().includes(query) ||
          chat.lastMessage.content.toLowerCase().includes(query)
      );
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chats);
    }
  }, [searchQuery, chats]);

  const handleRefresh = () => {
    fetchChats(true);
  };

  const handleChatPress = (chatId: string) => {
    navigation.navigate(ROUTES.SHARED.CHAT, { chatId });
  };

  const formatMessageTime = (date: string) => {
    const messageDate = parseISO(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMM dd');
    }
  };

  const renderChatItem = ({ item }: { item: ChatWithUser }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item.id)}
    >
      <View style={styles.avatarContainer}>
        {item.otherUser.avatar ? (
          <Image
            source={{ uri: item.otherUser.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>
              {item.otherUser.firstName[0]}
              {item.otherUser.lastName[0]}
            </Text>
          </View>
        )}
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.userName}>
            {user?.role === 'patient'
              ? `Dr. ${item.otherUser.firstName} ${item.otherUser.lastName}`
              : `${item.otherUser.firstName} ${item.otherUser.lastName}`}
          </Text>
          <Text style={styles.messageTime}>
            {formatMessageTime(item.lastMessage.createdAt)}
          </Text>
        </View>
        <Text
          style={[
            styles.lastMessage,
            item.unreadCount > 0 && styles.unreadMessage,
          ]}
          numberOfLines={1}
        >
          {item.lastMessage.content}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    searchContainer: {
      marginBottom: theme.spacing.lg,
    },
    searchInput: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      color: theme.colors.text,
      fontSize: 16,
    },
    chatItem: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
    },
    avatarContainer: {
      position: 'relative',
      marginRight: theme.spacing.md,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: theme.colors.white,
      fontSize: 18,
      fontWeight: 'bold',
    },
    unreadBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 5,
    },
    unreadCount: {
      color: theme.colors.white,
      fontSize: 12,
      fontWeight: 'bold',
    },
    chatInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    chatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    userName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    messageTime: {
      fontSize: 12,
      color: theme.colors.text + 'CC',
    },
    lastMessage: {
      fontSize: 14,
      color: theme.colors.text + 'CC',
    },
    unreadMessage: {
      color: theme.colors.text,
      fontWeight: 'bold',
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.text + 'CC',
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={theme.colors.text + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {filteredChats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'No conversations found matching your search'
                : 'No conversations yet'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredChats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
          />
        )}
      </View>
    </View>
  );
} 