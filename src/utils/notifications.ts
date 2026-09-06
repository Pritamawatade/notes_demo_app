import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { MOTIVATIONAL_QUOTES } from './quotes';

const MORNING_MESSAGES = [
  "Hey Pritam! 🌅 What are we building today? Let's make it count.",
  "Good morning, Pritam! 🚀 What's the one thing you'll finish today?",
  "Rise and build, Pritam! 💪 What's your plan for today?",
  "Morning, Pritam! ☀️ What are we completing today? Time is ticking.",
  "Hey! 🎯 Today won't repeat itself. What are you working on?",
  "Good morning! 🔥 What's today's mission, Pritam?",
  "Pritam, the day is yours! 🌄 What will you accomplish today?",
  "Morning check-in! 📋 What's the task you're not going to skip today?",
  "Hey Pritam! ⚡ What's on the agenda? Make today matter.",
  "New day, new chance! 🌞 What's your focus today, Pritam?",
  "Wake up, Pritam! How are you planning to improve 1% today? 💡",
  "If you don't have any purpose of waking up, then what's the point of waking up? 🌅 Let's set a goal for today pritam.",
];

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
    await scheduleMorningProductivityNotification();
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

export const scheduleMorningProductivityNotification = async () => {
  try {
    // Cancel any existing morning productivity notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (scheduled && Array.isArray(scheduled)) {
      for (const notification of scheduled) {
        if (notification.identifier && notification.identifier.startsWith('morning-productivity-')) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    }

    // Schedule for the next 7 days at 8:00 AM
    for (let day = 0; day < 7; day++) {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + day);
      scheduledDate.setHours(8, 0, 0, 0);

      // Skip if the time has already passed today
      if (scheduledDate < new Date()) continue;

      const message = MORNING_MESSAGES[day % MORNING_MESSAGES.length];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Morning Check-in',
          body: message,
        },
        trigger: createDateTrigger(scheduledDate),
        identifier: `morning-productivity-${day}`,
      });
    }
  } catch (error) {
    console.error('Error scheduling morning productivity notification:', error);
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
