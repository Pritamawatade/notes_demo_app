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
import { Note, getNotes } from '../database/db';
import { NoteCard } from '../components/NoteCard';
import { useTheme } from '../theme/useTheme';
import { getDailyQuote } from '../utils/quotes';

const H_PAD = 16;
const GAP = 12;

export const HomeScreen = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const quote = useMemo(() => getDailyQuote(), []);

  const cardWidth = (width - H_PAD * 2 - GAP) / 2;

  const loadNotes = useCallback(async () => {
    try {
      const fetchedNotes = await getNotes(searchQuery);
      setNotes(fetchedNotes);
    } catch (e) {
      console.warn(e);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (isFocused) {
      loadNotes();
    }
  }, [isFocused, loadNotes]);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>{todayLabel}</Text>
            <Text style={[styles.appName, { color: theme.text }]}>NoteDown</Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: theme.primarySoft }]}>
            <Text style={[styles.countText, { color: theme.primary }]}>
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </Text>
          </View>
        </View>

        <View style={[styles.quoteCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.quoteIcon, { backgroundColor: theme.primarySoft }]}>
            <MaterialIcons name="format-quote" size={18} color={theme.primary} />
          </View>
          <Text style={[styles.quoteText, { color: theme.text }]} numberOfLines={3}>
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
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
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
                : 'Tap the orange button to capture your first idea.'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: theme.primary,
            shadowColor: theme.primary,
            bottom: 20 + insets.bottom,
          },
        ]}
        onPress={() => navigation.navigate('Editor')}
        activeOpacity={0.9}
      >
        <MaterialIcons name="add" size={30} color="#FFF" />
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
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  quoteIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 50,
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
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
});
