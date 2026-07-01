import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  // Schedule a daily 9 PM debrief notification.
  // Call once on app start — Expo dedupes by identifier.
  async scheduleDailyDebrief(hour = 21, minute = 0): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync('daily-debrief').catch(() => null);

    await Notifications.scheduleNotificationAsync({
      identifier: 'daily-debrief',
      content: {
        title: '🧠 Your LifeLog Debrief is Ready',
        body: 'Tap to see how your day went and what tomorrow could look like.',
        data: { screen: 'Summary' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }

  // Fire an immediate notification (e.g. after summary is generated in background)
  async sendSummaryReady(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Debrief Generated',
        body: 'Your daily summary is ready.',
        data: { screen: 'Summary' },
      },
      trigger: null,
    });
  }
}

export const notificationService = new NotificationService();
