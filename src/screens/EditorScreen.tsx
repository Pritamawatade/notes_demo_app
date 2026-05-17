import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  useColorScheme,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Markdown from 'react-native-markdown-display';
import { addNote, updateNote, deleteNote, togglePin, Note } from '../database/db';
import { Colors } from '../theme/Colors';

export const EditorScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  
  const existingNote = route.params?.note as Note | undefined;
  
  const [title, setTitle] = useState(existingNote?.title || '');
  const [content, setContent] = useState(existingNote?.content || '');
  const [isPreview, setIsPreview] = useState(false);
  const [isPinned, setIsPinned] = useState(existingNote?.is_pinned === 1);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      navigation.goBack();
      return;
    }

    if (existingNote?.id) {
      await updateNote(existingNote.id, title, content);
    } else {
      await addNote(title, content);
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            if (existingNote?.id) {
              await deleteNote(existingNote.id);
            }
            navigation.goBack();
          } 
        },
      ]
    );
  };

  const handleTogglePin = async () => {
    if (existingNote?.id) {
      await togglePin(existingNote.id, existingNote.is_pinned);
      setIsPinned(!isPinned);
    } else {
      // For new notes, we just toggle local state and save it when the note is created
      setIsPinned(!isPinned);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: existingNote ? 'Edit Note' : 'New Note',
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setIsPreview(!isPreview)} style={styles.headerButton}>
            <MaterialIcons 
              name={isPreview ? 'edit' : 'visibility'} 
              size={24} 
              color={theme.primary} 
            />
          </TouchableOpacity>
          {existingNote && (
            <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
              <MaterialIcons name="delete" size={24} color={theme.danger} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <MaterialIcons name="check" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, title, content, isPreview, theme, existingNote]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isPreview ? (
          <View style={styles.previewContainer}>
            <Markdown style={{
              body: { color: theme.text },
              heading1: { color: theme.primary },
              link: { color: theme.accent },
            }}>
              {`# ${title}\n\n${content}`}
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
            />
            <TextInput
              style={[styles.contentInput, { color: theme.text }]}
              placeholder="Start writing..."
              placeholderTextColor={theme.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 10,
  },
  headerButton: {
    marginLeft: 15,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  contentInput: {
    fontSize: 18,
    flex: 1,
    minHeight: 300,
  },
  previewContainer: {
    flex: 1,
  },
});
