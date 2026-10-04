import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getProfile,
  saveProfile,
  getCustomQuotes,
  addCustomQuote,
  deleteCustomQuote,
  CustomQuote,
} from '../database/db';
import { MOTIVATIONAL_QUOTES, getDailyQuote, mergeQuotes } from '../utils/quotes';
import {
  buildMorningMessages,
  scheduleMorningProductivityNotification,
  scheduleMotivationalNotifications,
  sendTestMorningNotification,
  sendTestQuoteNotification,
} from '../utils/notifications';
import { useTheme } from '../theme/useTheme';

const getInitials = (first: string, last: string): string => {
  const f = first.trim().charAt(0).toUpperCase();
  const l = last.trim().charAt(0).toUpperCase();
  if (f || l) return `${f}${l}` || '•';
  return '•';
};

export const ProfileScreen = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savedFirst, setSavedFirst] = useState('');
  const [savedLast, setSavedLast] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [quotes, setQuotes] = useState<CustomQuote[]>([]);
  const [newQuote, setNewQuote] = useState('');
  const [addingQuote, setAddingQuote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testingMorning, setTestingMorning] = useState(false);
  const [testingQuote, setTestingQuote] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [profile, custom] = await Promise.all([getProfile(), getCustomQuotes()]);
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
      setSavedFirst(profile.first_name);
      setSavedLast(profile.last_name);
      setQuotes(custom);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const isDirty =
    firstName.trim() !== savedFirst.trim() || lastName.trim() !== savedLast.trim();

  const fullName = [firstName, lastName].map((s) => s.trim()).filter(Boolean).join(' ');
  const previewMessage = useMemo(() => {
    const msgs = buildMorningMessages(firstName);
    return msgs[0];
  }, [firstName]);

  const quotePool = useMemo(
    () => mergeQuotes(quotes.map((q) => q.text)),
    [quotes]
  );
  const todaysQuote = useMemo(() => getDailyQuote(quotePool), [quotePool]);

  const handleSaveName = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await saveProfile(firstName, lastName);
      setSavedFirst(firstName.trim());
      setSavedLast(lastName.trim());
      await scheduleMorningProductivityNotification(firstName.trim());
      setSaveMessage('Saved — morning notifications will now use your name.');
    } catch (e) {
      console.warn(e);
      setSaveMessage('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuote = async () => {
    const text = newQuote.trim();
    if (!text) return;
    if (text.length < 10) {
      Alert.alert('Quote too short', 'Please write a quote with at least 10 characters.');
      return;
    }
    setAddingQuote(true);
    try {
      await addCustomQuote(text);
      setNewQuote('');
      const updated = await getCustomQuotes();
      setQuotes(updated);
      await scheduleMotivationalNotifications(mergeQuotes(updated.map((q) => q.text)));
      setSaveMessage(null);
    } catch (e) {
      console.warn(e);
      Alert.alert('Could not add quote', 'Please try again.');
    } finally {
      setAddingQuote(false);
    }
  };

  const handleDeleteQuote = (quote: CustomQuote) => {
    Alert.alert('Delete quote', 'Remove this custom quote?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCustomQuote(quote.id!);
            const updated = await getCustomQuotes();
            setQuotes(updated);
            await scheduleMotivationalNotifications(mergeQuotes(updated.map((q) => q.text)));
          } catch (e) {
            console.warn(e);
          }
        },
      },
    ]);
  };

  const handleTestMorning = async () => {
    if (testingMorning) return;
    setTestingMorning(true);
    try {
      const ok = await sendTestMorningNotification(firstName.trim());
      if (ok) {
        Alert.alert('Test sent 🔔', 'Check your notification tray to see how the morning check-in looks.');
      } else {
        Alert.alert(
          'Notifications blocked',
          'Please allow notifications for NoteDown in Settings → Apps → NoteDown → Notifications, then try again.'
        );
      }
    } finally {
      setTestingMorning(false);
    }
  };

  const handleTestQuote = async (body?: string) => {
    if (testingQuote) return;
    setTestingQuote(true);
    try {
      const ok = await sendTestQuoteNotification(body);
      if (ok) {
        Alert.alert('Test sent 🔔', 'Check your notification tray to see how the daily reminder looks.');
      } else {
        Alert.alert(
          'Notifications blocked',
          'Please allow notifications for NoteDown in Settings → Apps → NoteDown → Notifications, then try again.'
        );
      }
    } finally {
      setTestingQuote(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <Text style={[styles.kicker, { color: theme.textSecondary }]}>Make it yours</Text>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your name personalizes notifications. Your quotes fuel daily reminders.
          </Text>
        </View>

        {/* Identity card */}
        <View style={[styles.identityCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
            <Text style={[styles.avatarText, { color: theme.onAccent }]}>{getInitials(firstName, lastName)}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={[styles.identityName, { color: theme.text }]} numberOfLines={1}>
              {fullName || 'Your name'}
            </Text>
            <Text style={[styles.identitySub, { color: theme.textSecondary }]} numberOfLines={1}>
              {fullName ? 'Notifications will greet you by name' : 'Add your name to get started'}
            </Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: theme.primarySoft }]}>
            <MaterialIcons name="notifications-active" size={16} color={theme.primary} />
            <Text style={[styles.statBadgeText, { color: theme.primary }]}>Live</Text>
          </View>
        </View>

        {/* Name card */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: theme.primarySoft }]}>
              <MaterialIcons name="person-outline" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Your name</Text>
              <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                Used in the 8:00 AM check-in and daily greetings
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputWrap, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>First name</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="e.g. Alex"
                placeholderTextColor={theme.textSecondary}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                returnKeyType="next"
                maxLength={30}
              />
            </View>
            <View style={[styles.inputWrap, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Last name</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="e.g. Rivera"
                placeholderTextColor={theme.textSecondary}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                returnKeyType="done"
                maxLength={30}
                onSubmitEditing={handleSaveName}
              />
            </View>
          </View>

          {/* Notification preview */}
          <View style={[styles.preview, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.previewTop}>
              <MaterialIcons name="wb-sunny" size={14} color={theme.primary} />
              <Text style={[styles.previewApp, { color: theme.textSecondary }]}>Preview</Text>
            </View>
            <Text style={[styles.previewTitle, { color: theme.text }]}>⏰ Morning Check-in</Text>
            <Text style={[styles.previewBody, { color: theme.textSecondary }]}>{previewMessage}</Text>
          </View>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme.primarySoft }]}
            onPress={handleTestMorning}
            disabled={testingMorning}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Send test morning notification"
          >
            <MaterialIcons name="notifications-active" size={18} color={theme.primary} />
            <Text style={[styles.testButtonText, { color: theme.primary }]}>
              {testingMorning ? 'Sending…' : 'Test notification'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: theme.accent, opacity: !isDirty || saving || loading ? 0.5 : 1 },
            ]}
            onPress={handleSaveName}
            disabled={!isDirty || saving || loading}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Save name"
          >
            <MaterialIcons name="check" size={20} color={theme.onAccent} />
            <Text style={[styles.saveButtonText, { color: theme.onAccent }]}>{saving ? 'Saving…' : 'Save name'}</Text>
          </TouchableOpacity>
          {saveMessage && (
            <View style={[styles.savedNote, { backgroundColor: theme.primarySoft }]}>
              <MaterialIcons name="check-circle" size={16} color={theme.primary} />
              <Text style={[styles.savedNoteText, { color: theme.primary }]}>{saveMessage}</Text>
            </View>
          )}
        </View>

        {/* Quotes card */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: theme.primarySoft }]}>
              <MaterialIcons name="format-quote" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Motivational quotes</Text>
              <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                Custom quotes are mixed into your 9 AM · 2 PM · 8 PM reminders
              </Text>
            </View>
          </View>

          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: theme.primarySoft }]}>
              <Text style={[styles.chipText, { color: theme.primary }]}>{quotes.length} yours</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}>
              <Text style={[styles.chipText, { color: theme.textSecondary }]}>
                {MOTIVATIONAL_QUOTES.length} built-in
              </Text>
            </View>
            <View style={[styles.chip, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}>
              <Text style={[styles.chipText, { color: theme.textSecondary }]}>{quotePool.length} total</Text>
            </View>
          </View>

          {/* Today's quote */}
          <View style={[styles.preview, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.previewTop}>
              <MaterialIcons name="today" size={14} color={theme.primary} />
              <Text style={[styles.previewApp, { color: theme.textSecondary }]}>Today's quote</Text>
            </View>
            <Text style={[styles.previewBody, { color: theme.text }]}>“{todaysQuote}”</Text>
          </View>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme.primarySoft }]}
            onPress={() => handleTestQuote(todaysQuote)}
            disabled={testingQuote}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Send test quote notification"
          >
            <MaterialIcons name="notifications-active" size={18} color={theme.primary} />
            <Text style={[styles.testButtonText, { color: theme.primary }]}>
              {testingQuote ? 'Sending…' : 'Show demo notification'}
            </Text>
          </TouchableOpacity>

          <View style={[styles.quoteInputBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <TextInput
              style={[styles.quoteInput, { color: theme.text }]}
              placeholder="Write your own quote… e.g. Small steps every day beat big leaps once."
              placeholderTextColor={theme.textSecondary}
              value={newQuote}
              onChangeText={setNewQuote}
              multiline
              maxLength={280}
            />
            <View style={styles.quoteInputFooter}>
              <Text style={[styles.charCount, { color: theme.textSecondary }]}>
                {newQuote.trim().length}/280
              </Text>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  { backgroundColor: theme.accent, opacity: newQuote.trim() && !addingQuote ? 1 : 0.5 },
                ]}
                onPress={handleAddQuote}
                disabled={!newQuote.trim() || addingQuote}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Add quote"
              >
                <MaterialIcons name="add" size={20} color={theme.onAccent} />
                <Text style={[styles.addButtonText, { color: theme.onAccent }]}>{addingQuote ? 'Adding…' : 'Add quote'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {quotes.length === 0 ? (
            <View style={styles.emptyQuotes}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
                <MaterialIcons name="lightbulb-outline" size={28} color={theme.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No custom quotes yet</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Add your first quote above — it will start appearing in notifications and on the home
                screen.
              </Text>
            </View>
          ) : (
            <View style={styles.quoteList}>
              {quotes.map((q) => (
                <View
                  key={q.id}
                  style={[styles.quoteRow, { backgroundColor: theme.background, borderColor: theme.border }]}
                >
                  <View style={[styles.quoteMark, { backgroundColor: theme.primarySoft }]}>
                    <MaterialIcons name="format-quote" size={16} color={theme.primary} />
                  </View>
                  <Text style={[styles.quoteText, { color: theme.text }]}>{q.text}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteQuote(q)}
                    hitSlop={10}
                    style={styles.deleteBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete quote: ${q.text.slice(0, 40)}`}
                  >
                    <MaterialIcons name="delete-outline" size={20} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  headerSection: { paddingHorizontal: 4, paddingBottom: 12 },
  kicker: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 6, lineHeight: 19 },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800' },
  identityText: { flex: 1 },
  identityName: { fontSize: 18, fontWeight: '800' },
  identitySub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statBadgeText: { fontSize: 11, fontWeight: '800' },
  card: { borderRadius: 22, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  cardSub: { fontSize: 12, fontWeight: '500', marginTop: 2, lineHeight: 17 },
  row: { flexDirection: 'row', gap: 10 },
  inputWrap: { flex: 1, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  input: { fontSize: 16, fontWeight: '600', paddingVertical: 4 },
  preview: { borderRadius: 16, borderWidth: 1, padding: 12, marginTop: 12 },
  previewTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  previewApp: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  previewTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  previewBody: { fontSize: 13, fontWeight: '500', lineHeight: 19 },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 10,
  },
  testButtonText: { fontSize: 14, fontWeight: '800' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 12,
  },
  saveButtonText: { fontSize: 15, fontWeight: '800' },
  savedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  savedNoteText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '700' },
  quoteInputBox: { borderRadius: 16, borderWidth: 1, padding: 12 },
  quoteInput: { fontSize: 15, fontWeight: '500', lineHeight: 22, minHeight: 64, textAlignVertical: 'top' },
  quoteInputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  charCount: { fontSize: 12, fontWeight: '600' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: { fontSize: 14, fontWeight: '800' },
  emptyQuotes: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 12 },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  emptyText: { fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 19 },
  quoteList: { gap: 8, marginTop: 12 },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  quoteMark: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 19 },
  deleteBtn: { padding: 10, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
