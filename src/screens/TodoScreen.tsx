import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  useColorScheme,
  ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { Todo, getTodos, addTodo, toggleTodo, deleteTodo } from '../database/db';
import { TodoItem } from '../components/TodoItem';
import { Colors } from '../theme/Colors';

const TODO_TYPES = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

export const TodoScreen = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activeType, setActiveType] = useState<any>('daily');
  const [inputText, setInputText] = useState('');
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const loadTodos = useCallback(async () => {
    const fetchedTodos = await getTodos(activeType);
    setTodos(fetchedTodos);
  }, [activeType]);

  useEffect(() => {
    if (isFocused) {
      loadTodos();
    }
  }, [isFocused, loadTodos]);

  const handleAddTodo = async () => {
    if (inputText.trim()) {
      await addTodo(inputText.trim(), activeType);
      setInputText('');
      loadTodos();
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    await toggleTodo(todo.id!, todo.is_completed);
    loadTodos();
  };

  const handleDeleteTodo = async (id: number) => {
    await deleteTodo(id);
    loadTodos();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {TODO_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.filterChip,
                { 
                  backgroundColor: activeType === type.value ? theme.primary : theme.surface,
                  borderColor: theme.border
                }
              ]}
              onPress={() => setActiveType(type.value)}
            >
              <Text 
                style={[
                  styles.filterText, 
                  { color: activeType === type.value ? '#FFF' : theme.textSecondary }
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={({ item }) => (
          <TodoItem 
            todo={item} 
            onToggle={() => handleToggleTodo(item)}
            onDelete={() => handleDeleteTodo(item.id!)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="playlist-add-check" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No {activeType} tasks yet.
            </Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
            placeholder={`Add a new ${activeType} task...`}
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleAddTodo}
          />
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.primary }]} 
            onPress={handleAddTodo}
          >
            <MaterialIcons name="add" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: 16,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
  },
  filterText: {
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginRight: 12,
    fontSize: 16,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
});
