import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';

class NotificationService {
  async requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    return enabled;
  }

  async getFcmToken() {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  }

  listenForNotifications() {
    messaging().onMessage(async remoteMessage => {
      Alert.alert(remoteMessage.notification?.title || '', remoteMessage.notification?.body || '');
    });

    // Background handler
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });
  }
}

export default new NotificationService();
