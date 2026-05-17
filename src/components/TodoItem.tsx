import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  useColorScheme 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Todo } from '../database/db';
import { Colors } from '../theme/Colors';

interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity 
        style={styles.checkbox} 
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <MaterialIcons 
          name={todo.is_completed ? "check-circle" : "radio-button-unchecked"} 
          size={26} 
          color={todo.is_completed ? theme.primary : theme.textSecondary} 
        />
      </TouchableOpacity>
      
      <Text 
        style={[
          styles.text, 
          { 
            color: todo.is_completed ? theme.textSecondary : theme.text,
            textDecorationLine: todo.is_completed ? 'line-through' : 'none'
          }
        ]}
      >
        {todo.text}
      </Text>

      <TouchableOpacity onPress={onDelete}>
        <MaterialIcons name="delete-outline" size={24} color={theme.danger} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  checkbox: {
    marginRight: 12,
  },
  text: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});
