import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Text,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Note, getNotes, getProfile, getCustomQuotes } from '../database/db';
import { NoteCard } from '../components/NoteCard';
import { useTheme } from '../theme/useTheme';
import { getDailyQuote, mergeQuotes } from '../utils/quotes';

const H_PAD = 16;
const GAP = 12;

const greetingForHour = (hour: number): string => {
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const HomeScreen = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [firstName, setFirstName] = useState('');
  const [quotePool, setQuotePool] = useState<string[] | undefined>(undefined);
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const quote = useMemo(() => getDailyQuote(quotePool), [quotePool]);

  const cardWidth = (width - H_PAD * 2 - GAP) / 2;

  const loadNotes = useCallback(async () => {
    try {
      const fetchedNotes = await getNotes(searchQuery);
      setNotes(fetchedNotes);
    } catch (e) {
      console.warn(e);
    }
  }, [searchQuery]);

  const loadPersonalization = useCallback(async () => {
    try {
      const [profile, custom] = await Promise.all([getProfile(), getCustomQuotes()]);
      setFirstName(profile.first_name.trim());
      setQuotePool(mergeQuotes(custom.map((q) => q.text)));
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadNotes();
      loadPersonalization();
    }
  }, [isFocused, loadNotes, loadPersonalization]);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const greeting = `${greetingForHour(new Date().getHours())}${firstName ? `, ${firstName}` : ''}`;

  // Inverted ritual panel: deep ink on light, soft paper on dark.
  const ritualBg = isDark ? theme.text : '#123B34';
  const ritualText = isDark ? '#0B1513' : '#F2F7F4';
  const ritualMuted = isDark ? '#3D5A54' : '#A9C7BE';

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>{todayLabel}</Text>
            <Text style={[styles.appName, { color: theme.text }]}>{greeting}</Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: theme.primarySoft }]}>
            <Text style={[styles.countText, { color: theme.primary }]}>
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </Text>
          </View>
        </View>

        <View style={[styles.quoteCard, { backgroundColor: ritualBg }]}>
          <View style={styles.quoteTop}>
            <View style={[styles.quoteIcon, { backgroundColor: theme.accent }]}>
              <MaterialIcons name="format-quote" size={18} color={theme.onAccent} />
            </View>
            <Text style={[styles.quoteLabel, { color: ritualMuted }]}>Today's note to self</Text>
          </View>
          <Text style={[styles.quoteText, { color: ritualText }]} numberOfLines={3}>
            {quote}
          </Text>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MaterialIcons name="search" size={22} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search notes"
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search notes"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <MaterialIcons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={notes}
        key={notes.length === 0 ? 'notes-empty' : 'notes-grid-2'}
        keyExtractor={(item) => String(item.id)}
        numColumns={notes.length === 0 ? 1 : 2}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            width={cardWidth}
            onPress={() => navigation.navigate('Editor', { note: item })}
          />
        )}
        columnWrapperStyle={notes.length === 0 ? undefined : styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          notes.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { width: width - H_PAD * 2 }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.primarySoft }]}>
              <MaterialIcons name="edit-note" size={42} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {searchQuery ? 'No matching notes' : 'Start writing'}
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery
                ? 'Try a different search.'
                : 'Tap the button below to capture your first idea.'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: theme.accent,
            bottom: 20 + insets.bottom,
          },
        ]}
        onPress={() => navigation.navigate('Editor')}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Create new note"
      >
        <MaterialIcons name="add" size={30} color={theme.onAccent} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quoteCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  quoteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  quoteIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 120,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: GAP,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    alignSelf: 'center',
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowColor: '#000',
  },
});
