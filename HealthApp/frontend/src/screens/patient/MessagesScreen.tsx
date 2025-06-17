import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../hooks/useAuth';
import { useMessages } from '../../hooks/useMessages';
import { format } from 'date-fns';
import { ROUTES } from '../../config/constants';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PatientStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<PatientStackParamList, typeof ROUTES.PATIENT.MESSAGES>;

const MessagesScreen: React.FC<Props> = ({ navigation }) => {
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);
  const { user } = useAuth();
  const { conversations, loading, error, refetch } = useMessages();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      console.error('Error refreshing messages:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleConversationPress = (conversation: any) => {
    try {
      navigation.navigate(ROUTES.PATIENT.CHAT, { 
        recipientId: conversation.participant.id 
      });
    } catch (err) {
      console.error('Navigation error:', err);
      Alert.alert('Error', 'Unable to open chat. Please try again.');
    }
  };

  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.conversationCard, { backgroundColor: theme.colors.card }]}
      onPress={() => handleConversationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.participant.avatar ? (
          <Image
            source={{ uri: item.participant.avatar }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar, { backgroundColor: theme.colors.border }]}>
            <Ionicons name="person" size={24} color={theme.colors.text} />
          </View>
        )}
        {item.unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.unreadBadgeText}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {item.participant.name || 'Unknown User'}
          </Text>
          <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
            {item.lastMessage?.createdAt 
              ? format(new Date(item.lastMessage.createdAt), 'MMM dd, HH:mm')
              : ''
            }
          </Text>
        </View>
        
        <Text 
          style={[
            styles.messagePreview, 
            { color: theme.colors.textSecondary },
            item.unreadCount > 0 && { fontWeight: '600', color: theme.colors.text }
          ]}
          numberOfLines={2}
        >
          {item.lastMessage?.content || 'No messages yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        No conversations yet
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
        Start a conversation with your doctor
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
      <Text style={[styles.errorText, { color: theme.colors.error }]}>
        {error || 'Failed to load messages'}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
        onPress={onRefresh}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {error && !refreshing ? (
        renderErrorState()
      ) : (
        <FlatList
          data={conversations || []}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  conversationCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  messagePreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MessagesScreen; 