import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  useColorScheme 
} from 'react-native';
import { Colors } from '../theme/Colors';

interface ReminderModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectReminder: (date: Date) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ isVisible, onClose, onSelectReminder }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const presets = [
    { label: '5 Min', value: 5 },
    { label: '10 Min', value: 10 },
    { label: '20 Min', value: 20 },
    { label: '1 Hour', value: 60 },
    { label: 'Today (8 PM)', value: 'today_8pm' },
    { label: 'Tomorrow (9 AM)', value: 'tomorrow_9am' },
  ];

  const handlePreset = (preset: any) => {
    let date = new Date();
    if (typeof preset.value === 'number') {
      date.setMinutes(date.getMinutes() + preset.value);
    } else if (preset.value === 'today_8pm') {
      date.setHours(20, 0, 0, 0);
      if (date < new Date()) date.setDate(date.getDate() + 1);
    } else if (preset.value === 'tomorrow_9am') {
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);
    }
    onSelectReminder(date);
    onClose();
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={[styles.content, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.text }]}>Add Reminder</Text>
          <View style={styles.grid}>
            {presets.map((preset) => (
              <TouchableOpacity
                key={preset.label}
                style={[styles.presetButton, { borderColor: theme.border }]}
                onPress={() => handlePreset(preset)}
              >
                <Text style={{ color: theme.primary }}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: theme.background }]} 
            onPress={onClose}
          >
            <Text style={{ color: theme.textSecondary }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '80%',
    padding: 20,
    borderRadius: 15,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetButton: {
    width: '48%',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
