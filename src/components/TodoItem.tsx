import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Todo } from '../database/db';
import { useTheme } from '../theme/useTheme';

interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  const { theme } = useTheme();
  const done = todo.is_completed === 1;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: done ? 0.72 : 1,
        },
      ]}
    >
      <TouchableOpacity style={styles.checkbox} onPress={onToggle} activeOpacity={0.7}>
        <MaterialIcons
          name={done ? 'check-circle' : 'radio-button-unchecked'}
          size={26}
          color={done ? theme.primary : theme.textSecondary}
        />
      </TouchableOpacity>

      <Text
        style={[
          styles.text,
          {
            color: done ? theme.textSecondary : theme.text,
            textDecorationLine: done ? 'line-through' : 'none',
          },
        ]}
      >
        {todo.text}
      </Text>

      <TouchableOpacity onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
        <MaterialIcons name="close" size={18} color={theme.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  checkbox: {
    marginRight: 12,
  },
  text: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  deleteBtn: {
    padding: 4,
  },
});
