import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PatientStackParamList, DoctorStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { Chat, Message, User } from '../../types';
import initializeApi from '../../api/axios.config';
import { ROUTES } from '../../config/constants';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { useAppSelector } from '../../hooks';
import { RootState } from '../../store';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import notificationService from '../../services/NotificationService';

type ChatScreenProps = {
  navigation: NativeStackNavigationProp<
    PatientStackParamList | DoctorStackParamList,
    'Chat'
  >;
  route: RouteProp<PatientStackParamList | DoctorStackParamList, 'Chat'>;
};

interface ChatWithUser extends Chat {
  otherUser: User;
  messages: Message[];
}

export default function ChatScreen() {
  const navigation = useNavigation<ChatScreenProps['navigation']>();
  const route = useRoute<ChatScreenProps['route']>();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { isDark, getThemeStyles } = useTheme();
  const theme = getThemeStyles(isDark);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll for new messages
    return () => clearInterval(interval);
  }, [route.params.chatId]);

  useEffect(() => {
    const markAsRead = async () => {
      try {
        const api = await initializeApi();
        await api.put(`/api/messages/conversations/${route.params.chatId}/read`);
      } catch (err) {
        // Ignore errors for now
      }
    };
    if (route.params.chatId) {
      markAsRead();
    }
  }, [route.params.chatId]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const api = await initializeApi();
      const response = await api.get(`/api/messages/${route.params.chatId}`);
      setMessages(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load chat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      setIsSending(true);
      const api = await initializeApi();
      const response = await api.post(`/api/messages`, {
        conversationId: route.params.chatId,
        content: newMessage.trim(),
      });
      setMessages([...messages, response.data]);
      setNewMessage('');
      flatListRef.current?.scrollToEnd();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message');
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleImageUpload = async (uri: string) => {
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);

      const api = await initializeApi();
      const response = await api.post(
        `/chats/${route.params.chatId}/messages/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setMessages([...messages, response.data]);
      flatListRef.current?.scrollToEnd();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image');
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        await handleFileUpload(result);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleFileUpload = async (file: DocumentPicker.DocumentResult) => {
    if (file.type !== 'success') return;

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType,
        name: file.name,
      } as any);

      const api = await initializeApi();
      const response = await api.post(
        `/chats/${route.params.chatId}/messages/file`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setMessages([...messages, response.data]);
      flatListRef.current?.scrollToEnd();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload file');
      Alert.alert('Error', 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDownload = async (message: Message) => {
    if (!message.fileUrl) return;

    try {
      const downloadResult = await FileSystem.downloadAsync(
        message.fileUrl,
        FileSystem.documentDirectory + message.fileName
      );

      if (downloadResult.status === 200) {
        Alert.alert(
          'Success',
          `File downloaded to ${downloadResult.uri}`,
          [
            {
              text: 'Open',
              onPress: () => Linking.openURL(downloadResult.uri),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to download file');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatMessageTime = (date: string) => {
    const messageDate = parseISO(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return 'Yesterday ' + format(messageDate, 'HH:mm');
    } else {
      return format(messageDate, 'MMM dd, HH:mm');
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === user?.id;
    const showDate = index === 0 || !isToday(parseISO(messages[index - 1].createdAt));

    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {format(parseISO(item.createdAt), 'MMMM dd, yyyy')}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
          ]}
        >
          {item.type === 'image' ? (
            <Image source={{ uri: item.content }} style={styles.messageImage} />
          ) : item.type === 'file' ? (
            <TouchableOpacity
              style={styles.fileContainer}
              onPress={() => handleFileDownload(item)}
            >
              <View style={styles.fileIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={isOwnMessage ? theme.colors.white : theme.colors.primary}
                />
              </View>
              <View style={styles.fileInfo}>
                <Text
                  style={[
                    styles.fileName,
                    isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                  ]}
                  numberOfLines={1}
                >
                  {item.fileName}
                </Text>
                <Text style={styles.fileSize}>
                  {formatFileSize(item.fileSize)}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {item.content}
            </Text>
          )}
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>
              {formatMessageTime(item.createdAt)}
            </Text>
            {isOwnMessage && (
              <View style={styles.readStatus}>
                {item.readAt ? (
                  <Ionicons
                    name="checkmark-done"
                    size={16}
                    color={theme.colors.primary}
                  />
                ) : (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={theme.colors.text.default + '80'}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background.secondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.default,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: theme.spacing.md,
    },
    headerInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text.default,
    },
    userStatus: {
      fontSize: 12,
      color: theme.colors.text.default + 'CC',
    },
    messagesContainer: {
      flex: 1,
      padding: theme.spacing.md,
    },
    dateContainer: {
      alignItems: 'center',
      marginVertical: theme.spacing.md,
    },
    dateText: {
      fontSize: 12,
      color: theme.colors.text.default + '80',
      backgroundColor: theme.colors.background.secondary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.layout.borderRadius.small,
    },
    messageContainer: {
      maxWidth: '80%',
      marginBottom: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.layout.borderRadius.large,
    },
    ownMessage: {
      alignSelf: 'flex-end',
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: theme.layout.borderRadius.small,
    },
    otherMessage: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.background.secondary,
      borderBottomLeftRadius: theme.layout.borderRadius.small,
    },
    messageText: {
      fontSize: 16,
      marginBottom: theme.spacing.xs,
    },
    ownMessageText: {
      color: theme.colors.white,
    },
    otherMessageText: {
      color: theme.colors.text.default,
    },
    messageTime: {
      fontSize: 10,
      color: theme.colors.text.default + '80',
      alignSelf: 'flex-end',
    },
    messageImage: {
      width: 200,
      height: 200,
      borderRadius: theme.layout.borderRadius.large,
      marginBottom: theme.spacing.xs,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background.secondary,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.default,
    },
    input: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
      borderRadius: theme.layout.borderRadius.md,
      padding: theme.spacing.md,
      marginRight: theme.spacing.md,
      color: theme.colors.text.default,
      fontSize: 16,
    },
    sendButton: {
      backgroundColor: theme.colors.primary,
      width: 40,
      height: 40,
      borderRadius: theme.layout.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: theme.colors.primary + '80',
    },
    attachButton: {
      marginRight: theme.spacing.md,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    fileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: theme.layout.borderRadius.md,
      padding: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    fileIcon: {
      marginRight: theme.spacing.sm,
    },
    fileInfo: {
      flex: 1,
    },
    fileName: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: theme.spacing.xs,
    },
    fileSize: {
      fontSize: 12,
      color: theme.colors.text.default + '80',
    },
    messageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    readStatus: {
      marginLeft: theme.spacing.xs,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Use navigation params for header info
  const chatHeaderName = route.params?.patientName || route.params?.doctorName || 'Chat';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={{ color: theme.colors.white, fontSize: 16 }}>
            {chatHeaderName.split(' ').map((n: string) => n[0]).join('')}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{chatHeaderName}</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleImagePick}
          disabled={isUploading}
        >
          <Ionicons
            name="image-outline"
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleFilePick}
          disabled={isUploading}
        >
          <Ionicons
            name="document-outline"
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.text.default + '80'}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || isSending || isUploading) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || isSending || isUploading}
        >
          {isSending || isUploading ? (
            <ActivityIndicator color={theme.colors.white} size="small" />
          ) : (
            <Ionicons name="send" size={20} color={theme.colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
} 