import React, { useState, useLayoutEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Text
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Markdown from 'react-native-markdown-display';
import { addNote, updateNote, deleteNote, Note } from '../database/db';
import { Colors } from '../theme/Colors';
import { scheduleNoteReminder, cancelReminder } from '../utils/notifications';
import { ReminderModal } from '../components/ReminderModal';

export const EditorScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  
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
    Alert.alert(
      'Delete Note',
      'This action cannot be undone.',
      [
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
          } 
        },
      ]
    );
  };

  const onSelectReminder = (date: Date) => {
    setReminderTime(date.toISOString());
  };

  const removeReminder = () => {
    setReminderTime(null);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => setIsReminderModalVisible(true)} 
            style={[styles.headerButton, { backgroundColor: reminderTime ? theme.accent + '20' : theme.surface }]}
          >
            <MaterialIcons 
              name={reminderTime ? "alarm-on" : "alarm-add"} 
              size={22} 
              color={reminderTime ? theme.accent : theme.textSecondary} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setIsPreview(!isPreview)} 
            style={[styles.headerButton, { backgroundColor: isPreview ? theme.primary + '20' : theme.surface }]}
          >
            <MaterialIcons 
              name={isPreview ? 'edit' : 'visibility'} 
              size={22} 
              color={isPreview ? theme.primary : theme.textSecondary} 
            />
          </TouchableOpacity>
          {existingNote && (
            <TouchableOpacity 
              onPress={handleDelete} 
              style={[styles.headerButton, { backgroundColor: theme.danger + '10' }]}
            >
              <MaterialIcons name="delete-outline" size={22} color={theme.danger} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.headerButton, { backgroundColor: theme.primary }]}
          >
            <MaterialIcons name="done" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      ),
      headerStyle: {
        backgroundColor: theme.background,
        elevation: 0,
        shadowOpacity: 0,
      }
    });
  }, [navigation, title, content, isPreview, theme, existingNote, reminderTime]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {reminderTime && (
          <View style={[styles.reminderBanner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.reminderInfo}>
              <MaterialIcons name="alarm" size={18} color={theme.accent} />
              <Text style={[styles.reminderText, { color: theme.textSecondary }]}>
                {new Date(reminderTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <TouchableOpacity onPress={removeReminder} style={styles.closeReminder}>
              <MaterialIcons name="close" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
        {isPreview ? (
          <View style={styles.previewContainer}>
            <Markdown style={{
              body: { color: theme.text, fontSize: 18, lineHeight: 28 },
              heading1: { color: theme.primary, fontWeight: '800', marginTop: 10 },
              link: { color: theme.accent },
            }}>
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
              placeholder="What's on your mind?"
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
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 16,
    alignItems: 'center',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  titleInput: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -1,
  },
  contentInput: {
    fontSize: 18,
    lineHeight: 28,
    flex: 1,
    minHeight: 400,
    fontWeight: '400',
  },
  previewContainer: {
    flex: 1,
  },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  closeReminder: {
    padding: 4,
  },
});
