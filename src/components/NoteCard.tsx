import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Note } from '../database/db';
import { useTheme } from '../theme/useTheme';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  width: number;
}

const PAPER_TINTS_LIGHT = ['#FFFFFF', '#F1FAF6', '#E6F3ED', '#FFFFFF'];
const PAPER_TINTS_DARK = ['#162825', '#182D29', '#142420', '#1A2E29'];

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, width }) => {
  const { theme, isDark } = useTheme();
  const tints = isDark ? PAPER_TINTS_DARK : PAPER_TINTS_LIGHT;
  const paper = tints[(note.id ?? 0) % tints.length];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width,
          backgroundColor: paper,
          borderColor: theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Open note: ${note.title || 'Untitled'}`}
    >
      <View style={[styles.accent, { backgroundColor: theme.primary }]} />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {note.title || 'Untitled'}
          </Text>
          {note.is_pinned === 1 && (
            <View
              style={[styles.pinBadge, { backgroundColor: theme.pinned + '22' }]}
              accessibilityLabel="Pinned"
            >
              <MaterialIcons name="push-pin" size={13} color={theme.pinned} />
            </View>
          )}
        </View>
        <Text style={[styles.content, { color: theme.textSecondary }]} numberOfLines={4}>
          {note.content || 'No additional text'}
        </Text>
        <View style={styles.footer}>
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {new Date(note.updated_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          {note.reminder_time ? (
            <View
              style={[styles.alarmChip, { backgroundColor: theme.primarySoft }]}
              accessibilityLabel="Has reminder"
            >
              <MaterialIcons name="alarm" size={12} color={theme.primary} />
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 168,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  pinBadge: {
    padding: 4,
    borderRadius: 8,
    marginTop: 1,
  },
  content: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  alarmChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
