import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { MOTIVATIONAL_QUOTES } from './quotes';

export const setupNotifications = async () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for notification!');
    return false;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Schedule motivation on startup
  await scheduleMotivationalNotifications();

  return true;
};

export const scheduleMotivationalNotifications = async () => {
  // Clear existing motivational notifications to avoid duplicates/stale ones
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.identifier.startsWith('motivation-')) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  const times = [
    { hour: 9, minute: 0 },  // Morning
    { hour: 14, minute: 0 }, // Afternoon
    { hour: 20, minute: 0 }, // Night
  ];

  // Schedule for the next 7 days
  for (let day = 0; day < 7; day++) {
    for (let i = 0; i < times.length; i++) {
      const { hour, minute } = times[i];
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + day);
      scheduledDate.setHours(hour, minute, 0, 0);

      // Don't schedule if the time has already passed for today
      if (scheduledDate < new Date()) continue;

      const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Motivation 🚀',
          body: randomQuote,
        },
        trigger: {
          date: scheduledDate,
        },
        identifier: `motivation-${day}-${i}`,
      });
    }
  }
};

export const scheduleNoteReminder = async (noteId: number, title: string, date: Date) => {
  // Cancel any existing notification for this note
  await Notifications.cancelScheduledNotificationAsync(`note-${noteId}`);

  const trigger = date.getTime();
  const now = new Date().getTime();
  
  if (trigger <= now) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Note Reminder 📝',
      body: title || 'You have a reminder for a note',
      data: { noteId },
    },
    trigger: {
      date: date,
    },
    identifier: `note-${noteId}`,
  });
};

export const cancelReminder = async (noteId: number) => {
  await Notifications.cancelScheduledNotificationAsync(`note-${noteId}`);
};
