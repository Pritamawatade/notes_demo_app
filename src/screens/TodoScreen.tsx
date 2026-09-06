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
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Todo, getTodos, addTodo, updateTodo, toggleTodo, deleteTodo } from '../database/db';
import { TodoItem } from '../components/TodoItem';
import { useTheme } from '../theme/useTheme';

const TODO_TYPES = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

export const TodoScreen = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activeType, setActiveType] = useState<string>('daily');
  const [inputText, setInputText] = useState('');
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const isFocused = useIsFocused();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const loadTodos = useCallback(async () => {
    try {
      const fetchedTodos = await getTodos(activeType);
      setTodos(fetchedTodos);
    } catch (e) {
      console.warn(e);
    }
  }, [activeType]);

  useEffect(() => {
    if (isFocused) {
      loadTodos();
    }
  }, [isFocused, loadTodos]);

  const handleAddTodo = async () => {
    const text = inputText.trim();
    if (text) {
      if (editingTodo?.id) {
        await updateTodo(editingTodo.id, text);
      } else {
        await addTodo(text, activeType);
      }
      setInputText('');
      setEditingTodo(null);
      loadTodos();
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setInputText(todo.text);
  };

  const handleCancelEdit = () => {
    setEditingTodo(null);
    setInputText('');
  };

  const handleToggleTodo = async (todo: Todo) => {
    await toggleTodo(todo.id!, todo.is_completed);
    loadTodos();
  };

  const handleDeleteTodo = async (id: number) => {
    await deleteTodo(id);
    loadTodos();
  };

  const remaining = todos.filter((t) => t.is_completed === 0).length;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <View style={styles.content}>
      <View style={styles.headerSection}>
        <Text style={[styles.kicker, { color: theme.textSecondary }]}>Stay on track</Text>
        <Text style={[styles.title, { color: theme.text }]}>Checklists</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {remaining} open · {todos.length} total
        </Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {TODO_TYPES.map((type) => {
            const active = activeType === type.value;
            return (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? theme.primary : theme.surface,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setActiveType(type.value)}
              >
                <Text style={[styles.filterText, { color: active ? '#FFF' : theme.textSecondary }]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        style={styles.list}
        data={todos}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TodoItem
            todo={item}
            onToggle={() => handleToggleTodo(item)}
            onEdit={() => handleEditTodo(item)}
            onDelete={() => handleDeleteTodo(item.id!)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
              <MaterialIcons name="playlist-add-check" size={36} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No {activeType} tasks</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Add one below to start this list.
            </Text>
          </View>
        }
      />

      </View>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: 12 + insets.bottom,
          },
        ]}
      >
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
            placeholder={editingTodo ? 'Edit task' : `Add a ${activeType} task`}
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleAddTodo}
            returnKeyType="done"
            autoFocus={editingTodo !== null}
          />
          {editingTodo && (
            <TouchableOpacity onPress={handleCancelEdit} hitSlop={8} style={styles.cancelButton}>
              <MaterialIcons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary, opacity: inputText.trim() ? 1 : 0.5 }]}
            onPress={handleAddTodo}
            disabled={!inputText.trim()}
          >
            <MaterialIcons name={editingTodo ? 'check' : 'arrow-upward'} size={22} color="#FFF" />
          </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  filterContainer: {
    paddingVertical: 14,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
  },
  filterText: {
    fontWeight: '700',
    fontSize: 13,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 56,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginRight: 10,
    fontSize: 16,
    borderWidth: 1,
  },
  cancelButton: {
    padding: 8,
    marginRight: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
