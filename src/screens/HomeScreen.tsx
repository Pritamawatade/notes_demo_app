import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Text, 
  useColorScheme,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Note, getNotes } from '../database/db';
import { NoteCard } from '../components/NoteCard';
import { Colors } from '../theme/Colors';

export const HomeScreen = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const loadNotes = useCallback(async () => {
    const fetchedNotes = await getNotes(searchQuery);
    setNotes(fetchedNotes);
  }, [searchQuery]);

  useEffect(() => {
    if (isFocused) {
      loadNotes();
    }
  }, [isFocused, loadNotes]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <View style={styles.headerSection}>
        <Text style={[styles.greeting, { color: theme.textSecondary }]}>Hello!</Text>
        <Text style={[styles.appName, { color: theme.text }]}>Your Notes</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <MaterialIcons name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search your thoughts..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={({ item }) => (
          <NoteCard 
            note={item} 
            onPress={() => navigation.navigate('Editor', { note: item })} 
          />
        )}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.surface }]}>
              <MaterialIcons name="note-add" size={40} color={theme.primary} />
            </View>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery ? 'No matches found.' : 'Capture your first great idea!'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
        onPress={() => navigation.navigate('Editor')}
        activeOpacity={0.9}
      >
        <MaterialIcons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 10,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    width: '100%',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
});
