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

const PAPER_TINTS_LIGHT = ['#FFFFFF', '#FFF4E8', '#FFE9D2', '#FFF8F0'];
const PAPER_TINTS_DARK = ['#2A1E16', '#322418', '#3A281A', '#271C14'];

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
          shadowColor: theme.cardShadow,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.accent, { backgroundColor: theme.primary }]} />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {note.title || 'Untitled'}
          </Text>
          {note.is_pinned === 1 && (
            <View style={[styles.pinBadge, { backgroundColor: theme.pinned + '28' }]}>
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
            <View style={[styles.alarmChip, { backgroundColor: theme.primarySoft }]}>
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
    elevation: 3,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  accent: {
    width: 5,
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
    lineHeight: 21,
  },
  pinBadge: {
    padding: 4,
    borderRadius: 8,
    marginTop: 1,
  },
  content: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  alarmChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
