import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from '../api/axios.config';
import { Message } from '../types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log('Push notifications are not available on emulator');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      this.pushToken = token;

      // Store the token on the server
      await api.post('/users/push-token', { pushToken: token });

      // Configure for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }

  async handleNewMessage(message: Message, senderName: string) {
    const isChatScreen = false; // TODO: Get this from navigation state

    if (!isChatScreen) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `New message from ${senderName}`,
          body: message.type === 'text' ? message.content : 'Sent an attachment',
          data: {
            messageId: message.id,
            chatId: message.chatId,
            type: 'message',
          },
        },
        trigger: null, // Show immediately
      });
    }
  }

  async handleMessageRead(chatId: string) {
    try {
      await api.post(`/chats/${chatId}/read`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  async removePushToken() {
    if (this.pushToken) {
      try {
        await api.delete('/users/push-token', {
          data: { pushToken: this.pushToken },
        });
        this.pushToken = null;
      } catch (error) {
        console.error('Error removing push token:', error);
      }
    }
  }

  // Add notification response handler
  addNotificationResponseHandler(
    handler: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  // Add notification received handler
  addNotificationReceivedHandler(
    handler: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(handler);
  }
}

export default NotificationService.getInstance(); 