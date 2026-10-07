import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Todo } from '../database/db';
import { useTheme } from '../theme/useTheme';
import { ScaleDecorator } from 'react-native-draggable-flatlist';

interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  /** Called on long-press (row or handle) to pick the row up and drag it. */
  drag: () => void;
  /** True while this row is being dragged — used for lift/highlight feedback. */
  isActive: boolean;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggle,
  onEdit,
  onDelete,
  drag,
  isActive,
}) => {
  const { theme } = useTheme();
  const done = todo.is_completed === 1;

  return (
    <ScaleDecorator>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isActive ? theme.primarySoft : theme.surface,
            borderColor: isActive ? theme.primary : theme.border,
            borderWidth: isActive ? 2 : 1,
            opacity: done && !isActive ? 0.72 : 1,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.checkbox}
          onPress={onToggle}
          activeOpacity={0.7}
          hitSlop={10}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={done ? `Mark ${todo.text} as not done` : `Mark ${todo.text} as done`}
        >
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

        <TouchableOpacity
          onPress={onEdit}
          hitSlop={10}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${todo.text}`}
        >
          <MaterialIcons name="edit" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onDelete}
          hitSlop={10}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${todo.text}`}
        >
          <MaterialIcons name="close" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          onLongPress={drag}
          delayLongPress={250}
          disabled={isActive}
          hitSlop={10}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={`Drag ${todo.text} to reorder`}
        >
          <MaterialIcons name="drag-handle" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScaleDecorator>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  checkbox: {
    marginRight: 8,
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  actionBtn: {
    padding: 10,
    marginLeft: 2,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});