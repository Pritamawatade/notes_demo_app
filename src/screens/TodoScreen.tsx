import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import {
  Todo,
  getTodos,
  addTodo,
  updateTodo,
  toggleTodo,
  deleteTodo,
  setTodoOrder,
} from '../database/db';
import { TodoItem } from '../components/TodoItem';
import { useTheme } from '../theme/useTheme';

const TODO_TYPES = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

const emptyLists = (): Record<string, Todo[]> => ({
  daily: [],
  weekly: [],
  monthly: [],
  yearly: [],
});

export const TodoScreen = () => {
  const [todosByType, setTodosByType] = useState<Record<string, Todo[]>>(emptyLists);
  const [activeType, setActiveType] = useState<string>('daily');
  const [inputText, setInputText] = useState('');
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const isFocused = useIsFocused();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const loadTodos = useCallback(async () => {
    try {
      const results = await Promise.all(TODO_TYPES.map((t) => getTodos(t.value)));
      setTodosByType({
        daily: results[0],
        weekly: results[1],
        monthly: results[2],
        yearly: results[3],
      });
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadTodos();
    }
  }, [isFocused, loadTodos]);

  // Pop the keyboard up whenever we start editing (tapping the pencil),
  // so the user can type right away. autoFocus only fires on mount,
  // which is why the keyboard stayed hidden before.
  useEffect(() => {
    if (editingTodo) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [editingTodo]);

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
    // Jump to the tab that owns this task, so edits happen in context.
    if (todo.type !== activeType) {
      setActiveType(todo.type);
    }
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

  /** Finger-drag reorder: long-press a row (or its handle) and move it up/down. */
  const handleDragEnd = async ({ data }: { data: Todo[] }) => {
    setTodosByType((prev) => ({ ...prev, [activeType]: data }));
    try {
      await setTodoOrder(data.map((t) => t.id!));
    } catch (e) {
      console.warn(e);
      loadTodos();
    }
  };

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Todo>) => (
      <TodoItem
        todo={item}
        onToggle={() => handleToggleTodo(item)}
        onEdit={() => handleEditTodo(item)}
        onDelete={() => handleDeleteTodo(item.id!)}
        drag={drag}
        isActive={isActive}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeType, todosByType]
  );

  const todos = todosByType[activeType] ?? [];
  const remaining = todos.filter((t) => t.is_completed === 0).length;
  const progressLine =
    todos.length === 0
      ? 'Nothing here yet'
      : remaining === 0
        ? `All ${todos.length} done — nice work`
        : `${remaining} of ${todos.length} still open`;

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
            {progressLine}
          </Text>
          <Text style={[styles.sortHint, { color: theme.textSecondary }]}>
            Long-press a task and drag it up or down to reorder.
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
                  <Text style={[styles.filterText, { color: active ? theme.onPrimary : theme.textSecondary }]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <DraggableFlatList
          key={activeType}
          containerStyle={styles.list}
          style={styles.list}
          data={todos}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
          activationDistance={8}
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
            ref={inputRef}
            style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
            placeholder={editingTodo ? 'Edit task' : `Add a ${activeType} task`}
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleAddTodo}
            returnKeyType="done"
          />
          {editingTodo && (
            <TouchableOpacity onPress={handleCancelEdit} hitSlop={8} style={styles.cancelButton}>
              <MaterialIcons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.accent, opacity: inputText.trim() ? 1 : 0.5 }]}
            onPress={handleAddTodo}
            disabled={!inputText.trim()}
            accessibilityRole="button"
            accessibilityLabel={editingTodo ? 'Save edited task' : 'Add task'}
          >
            <MaterialIcons name={editingTodo ? 'check' : 'arrow-upward'} size={22} color={theme.onAccent} />
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
  sortHint: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
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
    paddingHorizontal: 20,
    paddingVertical: 14,
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
