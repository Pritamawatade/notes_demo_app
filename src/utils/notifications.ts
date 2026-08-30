import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { MOTIVATIONAL_QUOTES } from './quotes';

const createDateTrigger = (date: Date) => {
  if (Platform.OS === 'android') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: 'default',
    };
  }

  return date;
};

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
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E85D04',
    });
  }

  // Schedule motivation on startup
  try {
    await scheduleMotivationalNotifications();
  } catch (error) {
    console.error('Error in setupNotifications:', error);
  }

  return true;
};

export const scheduleMotivationalNotifications = async () => {
  try {
    // Clear existing motivational notifications to avoid duplicates/stale ones
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (scheduled && Array.isArray(scheduled)) {
      for (const notification of scheduled) {
        if (notification.identifier && notification.identifier.startsWith('motivation-')) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
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
          trigger: createDateTrigger(scheduledDate),
          identifier: `motivation-${day}-${i}`,
        });
      }
    }
  } catch (error) {
    console.error('Error scheduling motivational notifications:', error);
  }
};

export const scheduleNoteReminder = async (noteId: number, title: string, date: Date) => {
  try {
    // Cancel any existing notification for this note
    await Notifications.cancelScheduledNotificationAsync(`note-${noteId}`);

    const triggerTime = date.getTime();
    const now = new Date().getTime();
    
    if (triggerTime <= now) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Note Reminder 📝',
        body: title || 'You have a reminder for a note',
        data: { noteId },
      },
      trigger: createDateTrigger(date),
      identifier: `note-${noteId}`,
    });
  } catch (error) {
    console.error('Error scheduling note reminder:', error);
  }
};

export const cancelReminder = async (noteId: number) => {
  await Notifications.cancelScheduledNotificationAsync(`note-${noteId}`);
};
