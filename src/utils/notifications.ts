import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { MOTIVATIONAL_QUOTES, mergeQuotes } from './quotes';
import { getCustomQuotes, getProfile } from '../database/db';

export const buildMorningMessages = (firstName: string): string[] => {
  const name = firstName.trim();
  const hey = name ? `Hey ${name}!` : 'Hey!';
  const morning = name ? `Good morning, ${name}!` : 'Good morning!';
  const rise = name ? `Rise and build, ${name}! 💪` : 'Rise and build! 💪';
  const genericMorning = name ? `Morning, ${name}! ☀️` : 'Morning! ☀️';

  return [
    `${hey} 🌅 What are we building today? Let's make it count.`,
    `${morning}  What's the one thing you'll finish today?`,
    `${rise} What's your plan for today?`,
    `${genericMorning} What are we completing today? Time is ticking.`,
    `Hey! 🎯 Today won't repeat itself. What are you working on?`,
    `Good morning! 🔥 What's today's mission${name ? `, ${name}` : ''}?`,
    name ? `${name}, the day is yours! 🌄 What will you accomplish today?` : `The day is yours! 🌄 What will you accomplish today?`,
    `Morning check-in! 📋 What's the task you're not going to skip today?`,
    `${hey} ⚡ What's on the agenda? Make today matter.`,
    `New day, new chance! 🌞 What's your focus today${name ? `, ${name}` : ''}?`,
    name ? `Wake up, ${name}! How are you planning to improve 1% today? 💡` : `Wake up! How are you planning to improve 1% today? 💡`,
    name
      ? `If you don't have any purpose of waking up, then what's the point of waking up? 🌅 Let's set a goal for today ${name.toLowerCase()}.`
      : `If you don't have any purpose of waking up, then what's the point of waking up? 🌅 Let's set a goal for today.`,
  ];
};

// Backwards-compatible export (defaults to no name)
export const MORNING_MESSAGES = buildMorningMessages('');

export const getNotificationDisplayName = async (): Promise<{ firstName: string; fullName: string }> => {
  try {
    const profile = await getProfile();
    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
    return { firstName: profile.first_name.trim(), fullName };
  } catch {
    return { firstName: '', fullName: '' };
  }
};

export const getQuotePool = async (): Promise<string[]> => {
  try {
    const custom = await getCustomQuotes();
    return mergeQuotes(custom.map((q) => q.text));
  } catch {
    return [...MOTIVATIONAL_QUOTES];
  }
};

const createDateTrigger = (date: Date): Notifications.DateTriggerInput => {
  if (Platform.OS === 'android') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: 'default',
    };
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date,
  };
};

export const setupNotifications = async () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
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

export const scheduleMotivationalNotifications = async (quotePool?: string[]) => {
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

    const quotes = quotePool && quotePool.length > 0 ? quotePool : await getQuotePool();

    const times = [
      { hour: 9, minute: 0 }, // Morning
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

        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Daily Reminder',
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

export const scheduleMorningProductivityNotification = async (firstNameOverride?: string) => {
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

    let firstName = (firstNameOverride ?? '').trim();
    if (firstNameOverride === undefined) {
      try {
        const { firstName: stored } = await getNotificationDisplayName();
        firstName = stored;
      } catch {
        firstName = '';
      }
    }
    const messages = buildMorningMessages(firstName);

    // Schedule for the next 7 days at 8:00 AM
    for (let day = 0; day < 7; day++) {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + day);
      scheduledDate.setHours(8, 0, 0, 0);

      // Skip if the time has already passed today
      if (scheduledDate < new Date()) continue;

      const message = messages[day % messages.length];

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

const ensureTestPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E85D04',
    });
  }
  return true;
};

/** Fire an immediate "Daily Reminder" notification so users can preview how quotes look. */
export const sendTestQuoteNotification = async (bodyText?: string): Promise<boolean> => {
  try {
    const granted = await ensureTestPermissions();
    if (!granted) return false;

    let body = (bodyText ?? '').trim();
    if (!body) {
      const pool = await getQuotePool();
      body = pool[Math.floor(Math.random() * pool.length)] ?? 'Small progress is still progress.';
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Reminder',
        body,
      },
      trigger: null,
    });
    return true;
  } catch (error) {
    console.error('Error sending test quote notification:', error);
    return false;
  }
};

/** Fire an immediate "Morning Check-in" notification so users can preview the greeting. */
export const sendTestMorningNotification = async (firstName?: string): Promise<boolean> => {
  try {
    const granted = await ensureTestPermissions();
    if (!granted) return false;

    let name = (firstName ?? '').trim();
    if (firstName === undefined) {
      try {
        const { firstName: stored } = await getNotificationDisplayName();
        name = stored;
      } catch {
        name = '';
      }
    }
    const message = buildMorningMessages(name)[0];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Morning Check-in',
        body: message,
      },
      trigger: null,
    });
    return true;
  } catch (error) {
    console.error('Error sending test morning notification:', error);
    return false;
  }
};
