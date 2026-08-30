import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Markdown from 'react-native-markdown-display';
import { addNote, updateNote, deleteNote, Note } from '../database/db';
import { useTheme } from '../theme/useTheme';
import { scheduleNoteReminder, cancelReminder } from '../utils/notifications';
import { ReminderModal } from '../components/ReminderModal';

export const EditorScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();

  const existingNote = route.params?.note as Note | undefined;

  const [title, setTitle] = useState(existingNote?.title || '');
  const [content, setContent] = useState(existingNote?.content || '');
  const [isPreview, setIsPreview] = useState(false);
  const [reminderTime, setReminderTime] = useState<string | null>(existingNote?.reminder_time || null);
  const [isReminderModalVisible, setIsReminderModalVisible] = useState(false);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      navigation.goBack();
      return;
    }

    let noteId = existingNote?.id;
    if (noteId) {
      await updateNote(noteId, title, content, reminderTime);
    } else {
      noteId = await addNote(title, content, reminderTime);
    }

    if (reminderTime) {
      await scheduleNoteReminder(noteId!, title, new Date(reminderTime));
    } else if (existingNote?.id) {
      await cancelReminder(existingNote.id);
    }

    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('Delete note', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (existingNote?.id) {
            await deleteNote(existingNote.id);
            await cancelReminder(existingNote.id);
          }
          navigation.goBack();
        },
      },
    ]);
  };

  const onSelectReminder = (date: Date) => {
    setReminderTime(date.toISOString());
  };

  const removeReminder = () => {
    setReminderTime(null);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: existingNote ? 'Edit note' : 'New note',
      headerTitleStyle: { fontWeight: '700', fontSize: 17, color: theme.text },
      headerTintColor: theme.primary,
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => setIsReminderModalVisible(true)}
            style={[
              styles.headerButton,
              { backgroundColor: reminderTime ? theme.primarySoft : theme.surfaceMuted },
            ]}
          >
            <MaterialIcons
              name={reminderTime ? 'alarm-on' : 'alarm-add'}
              size={20}
              color={reminderTime ? theme.primary : theme.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsPreview(!isPreview)}
            style={[
              styles.headerButton,
              { backgroundColor: isPreview ? theme.primarySoft : theme.surfaceMuted },
            ]}
          >
            <MaterialIcons
              name={isPreview ? 'edit' : 'visibility'}
              size={20}
              color={isPreview ? theme.primary : theme.textSecondary}
            />
          </TouchableOpacity>
          {existingNote && (
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.headerButton, { backgroundColor: theme.danger + '18' }]}
            >
              <MaterialIcons name="delete-outline" size={20} color={theme.danger} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
          >
            <MaterialIcons name="check" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      ),
      headerStyle: {
        backgroundColor: theme.background,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
    });
  }, [navigation, title, content, isPreview, theme, existingNote, reminderTime]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {reminderTime && (
          <View style={[styles.reminderBanner, { backgroundColor: theme.primarySoft, borderColor: theme.border }]}>
            <View style={styles.reminderInfo}>
              <MaterialIcons name="alarm" size={18} color={theme.primary} />
              <Text style={[styles.reminderText, { color: theme.primary }]}>
                {new Date(reminderTime).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <TouchableOpacity onPress={removeReminder} style={styles.closeReminder} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={theme.primary} />
            </TouchableOpacity>
          </View>
        )}
        {isPreview ? (
          <View style={styles.previewContainer}>
            <Markdown
              style={{
                body: { color: theme.text, fontSize: 17, lineHeight: 28 },
                heading1: { color: theme.primary, fontWeight: '800', marginTop: 10 },
                link: { color: theme.primary },
              }}
            >
              {`# ${title || 'Untitled'}\n\n${content || 'No content yet...'}`}
            </Markdown>
          </View>
        ) : (
          <>
            <TextInput
              style={[styles.titleInput, { color: theme.text }]}
              placeholder="Title"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
              multiline
              selectionColor={theme.primary}
            />
            <TextInput
              style={[styles.contentInput, { color: theme.text }]}
              placeholder="Write freely..."
              placeholderTextColor={theme.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              selectionColor={theme.primary}
            />
          </>
        )}
      </ScrollView>
      <ReminderModal
        isVisible={isReminderModalVisible}
        onClose={() => setIsReminderModalVisible(false)}
        onSelectReminder={onSelectReminder}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 40,
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 12,
    alignItems: 'center',
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.6,
  },
  contentInput: {
    fontSize: 17,
    lineHeight: 28,
    flex: 1,
    minHeight: 360,
    fontWeight: '400',
  },
  previewContainer: {
    flex: 1,
  },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
  },
  closeReminder: {
    padding: 4,
  },
});
