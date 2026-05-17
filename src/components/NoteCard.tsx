import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Note } from '../database/db';
import { Colors } from '../theme/Colors';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPress }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.surface, 
          borderColor: theme.border,
          shadowColor: theme.cardShadow 
        }
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {note.title || 'Untitled'}
        </Text>
        {note.is_pinned === 1 && (
          <View style={[styles.pinBadge, { backgroundColor: theme.pinned + '20' }]}>
            <MaterialIcons name="push-pin" size={14} color={theme.pinned} />
          </View>
        )}
      </View>
      <Text style={[styles.content, { color: theme.textSecondary }]} numberOfLines={3}>
        {note.content}
      </Text>
      <View style={styles.footer}>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </Text>
        {note.reminder_time && (
          <MaterialIcons name="alarm" size={14} color={theme.accent} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.5,
  },
  pinBadge: {
    padding: 4,
    borderRadius: 8,
  },
  content: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
  },
});
