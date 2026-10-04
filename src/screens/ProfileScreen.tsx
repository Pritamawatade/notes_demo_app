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
  updateCustomQuote,
  CustomQuote,
} from '../database/db';
import { getDailyQuote, mergeQuotes } from '../utils/quotes';
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
  const [editingId, setEditingId] = useState<number | null>(null);
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
    if (saving) return;
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (trimmedFirst === savedFirst.trim() && trimmedLast === savedLast.trim()) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await saveProfile(trimmedFirst, trimmedLast);
      setFirstName(trimmedFirst);
      setLastName(trimmedLast);
      setSavedFirst(trimmedFirst);
      setSavedLast(trimmedLast);
      await scheduleMorningProductivityNotification(trimmedFirst);
      setSaveMessage('Saved — morning notifications will now use your name.');
    } catch (e) {
      console.warn(e);
      setSaveMessage('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Persist typed names when the user leaves a field, so an entered name
  // is never lost (and never stuck showing the "Your name" placeholder).
  const handleNameBlur = () => {
    if (isDirty && !saving) {
      void handleSaveName();
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
      if (editingId !== null) {
        await updateCustomQuote(editingId, text);
        setEditingId(null);
      } else {
        await addCustomQuote(text);
      }
      setNewQuote('');
      const updated = await getCustomQuotes();
      setQuotes(updated);
      await scheduleMotivationalNotifications(mergeQuotes(updated.map((q) => q.text)));
      setSaveMessage(null);
    } catch (e) {
      console.warn(e);
      Alert.alert(editingId !== null ? 'Could not save quote' : 'Could not add quote', 'Please try again.');
    } finally {
      setAddingQuote(false);
    }
  };

  const handleStartEditQuote = (quote: CustomQuote) => {
    setEditingId(quote.id!);
    setNewQuote(quote.text);
  };

  const handleCancelEditQuote = () => {
    setEditingId(null);
    setNewQuote('');
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
            if (editingId === quote.id) {
              setEditingId(null);
              setNewQuote('');
            }
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
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your name personalizes notifications. Your quotes fuel daily reminders.
          </Text>
        </View>

        {/* Name card */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
              <Text style={[styles.avatarText, { color: theme.onAccent }]}>{getInitials(firstName, lastName)}</Text>
            </View>
            <View style={styles.profileText}>
              <Text style={[styles.profileName, { color: theme.text }]} numberOfLines={1}>
                {fullName || 'Your name'}
              </Text>
              <Text style={[styles.profileSub, { color: theme.textSecondary }]} numberOfLines={2}>
                {fullName
                  ? isDirty
                    ? 'Not saved yet — tap Save or tap outside the field'
                    : 'Morning check-in will greet you by name'
                  : 'Add your name below to get started'}
              </Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={[styles.inputWrap, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>First name</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="e.g. Alex"
                placeholderTextColor={theme.textSecondary}
                value={firstName}
                onChangeText={setFirstName}
                onBlur={handleNameBlur}
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
                onBlur={handleNameBlur}
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
              <MaterialIcons name="wb-sunny" size={16} color={theme.primary} />
              <Text style={[styles.previewApp, { color: theme.textSecondary }]}>Preview</Text>
            </View>
            <Text style={[styles.previewTitle, { color: theme.text }]}>⏰ Morning Check-in</Text>
            <Text style={[styles.previewBody, { color: theme.textSecondary }]}>{previewMessage}</Text>
          </View>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.primarySoft }]}
            onPress={handleTestMorning}
            disabled={testingMorning}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Send test morning notification"
          >
            <MaterialIcons name="notifications-active" size={20} color={theme.primary} />
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
              {testingMorning ? 'Sending…' : 'Test notification'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: theme.accent, opacity: !isDirty || saving || loading ? 0.5 : 1 },
            ]}
            onPress={handleSaveName}
            disabled={!isDirty || saving || loading}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Save name"
          >
            <MaterialIcons name="check" size={20} color={theme.onAccent} />
            <Text style={[styles.primaryButtonText, { color: theme.onAccent }]}>{saving ? 'Saving…' : 'Save name'}</Text>
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
              <MaterialIcons name="format-quote" size={22} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Motivational quotes</Text>
              <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                {quotes.length > 0
                  ? `${quotes.length} custom ${quotes.length === 1 ? 'quote' : 'quotes'} mixed into your 9 AM · 2 PM · 8 PM reminders`
                  : 'Custom quotes appear in your 9 AM · 2 PM · 8 PM reminders'}
              </Text>
            </View>
          </View>

          {/* Today's quote */}
          <View style={[styles.preview, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.previewTop}>
              <MaterialIcons name="today" size={16} color={theme.primary} />
              <Text style={[styles.previewApp, { color: theme.textSecondary }]}>Today's quote</Text>
            </View>
            <Text style={[styles.previewBody, { color: theme.text }]}>“{todaysQuote}”</Text>
          </View>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.primarySoft }]}
            onPress={() => handleTestQuote(todaysQuote)}
            disabled={testingQuote}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Send test quote notification"
          >
            <MaterialIcons name="notifications-active" size={20} color={theme.primary} />
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
              {testingQuote ? 'Sending…' : 'Show demo notification'}
            </Text>
          </TouchableOpacity>

          <View style={[styles.quoteInputBox, { backgroundColor: theme.background, borderWidth: editingId !== null ? 2 : 1, borderColor: editingId !== null ? theme.primary : theme.border }]}>
            {editingId !== null && (
              <View style={styles.editingBanner}>
                <MaterialIcons name="edit" size={16} color={theme.primary} />
                <Text style={[styles.editingBannerText, { color: theme.primary }]}>Editing quote</Text>
                <TouchableOpacity onPress={handleCancelEditQuote} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancel editing">
                  <MaterialIcons name="close" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
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
              <View style={styles.quoteActions}>
                {editingId !== null && (
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: theme.border }]}
                    onPress={handleCancelEditQuote}
                    disabled={addingQuote}
                    activeOpacity={0.9}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel editing"
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: theme.accent, opacity: newQuote.trim() && !addingQuote ? 1 : 0.5 },
                  ]}
                  onPress={handleAddQuote}
                  disabled={!newQuote.trim() || addingQuote}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel={editingId !== null ? 'Save quote' : 'Add quote'}
                >
                  <MaterialIcons name={editingId !== null ? 'check' : 'add'} size={20} color={theme.onAccent} />
                  <Text style={[styles.addButtonText, { color: theme.onAccent }]}>
                    {addingQuote ? 'Saving…' : editingId !== null ? 'Save quote' : 'Add quote'}
                  </Text>
                </TouchableOpacity>
              </View>
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
                  <View style={styles.quoteRowActions}>
                    <TouchableOpacity
                      onPress={() => handleStartEditQuote(q)}
                      hitSlop={10}
                      style={styles.iconBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit quote: ${q.text.slice(0, 40)}`}
                    >
                      <MaterialIcons
                        name="edit"
                        size={20}
                        color={editingId === q.id ? theme.primary : theme.textSecondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteQuote(q)}
                      hitSlop={10}
                      style={styles.iconBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete quote: ${q.text.slice(0, 40)}`}
                    >
                      <MaterialIcons name="delete-outline" size={20} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
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
  scroll: { paddingHorizontal: 20, paddingTop: 12 },
  headerSection: { marginBottom: 24 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { fontSize: 14, fontWeight: '500', marginTop: 8, lineHeight: 21 },
  card: { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardSub: { fontSize: 13, fontWeight: '500', marginTop: 4, lineHeight: 19 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800' },
  profileText: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '800' },
  profileSub: { fontSize: 13, fontWeight: '500', marginTop: 4, lineHeight: 19 },
  fieldGroup: { gap: 12, marginTop: 20 },
  inputWrap: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  input: { fontSize: 17, fontWeight: '600', paddingVertical: 6 },
  preview: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 16 },
  previewTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  previewApp: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  previewTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  previewBody: { fontSize: 14, fontWeight: '500', lineHeight: 21 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 16,
  },
  primaryButtonText: { fontSize: 15, fontWeight: '800' },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 16,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '800' },
  savedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  savedNoteText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  quoteInputBox: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 16 },
  quoteInput: { fontSize: 15, fontWeight: '500', lineHeight: 23, minHeight: 64, textAlignVertical: 'top' },
  quoteInputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  charCount: { fontSize: 12, fontWeight: '600' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: { fontSize: 14, fontWeight: '800' },
  emptyQuotes: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16, marginTop: 8 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptyText: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 21 },
  quoteList: { gap: 12, marginTop: 16 },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  quoteMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 21 },
  quoteRowActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 10, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  quoteActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelButtonText: { fontSize: 14, fontWeight: '800' },
  editingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  editingBannerText: { flex: 1, fontSize: 13, fontWeight: '800' },
});
