import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';

interface ReminderModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectReminder: (date: Date) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isVisible,
  onClose,
  onSelectReminder,
}) => {
  const { theme } = useTheme();

  const presets = [
    { label: '5 minutes', value: 5, icon: 'timer' as const },
    { label: '10 minutes', value: 10, icon: 'timer' as const },
    { label: '20 minutes', value: 20, icon: 'timer' as const },
    { label: '1 hour', value: 60, icon: 'schedule' as const },
    { label: 'Tonight, 8 PM', value: 'today_8pm', icon: 'nights-stay' as const },
    { label: 'Tomorrow, 9 AM', value: 'tomorrow_9am', icon: 'wb-sunny' as const },
  ];

  const handlePreset = (preset: (typeof presets)[number]) => {
    const date = new Date();
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
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.surface }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <Text style={[styles.title, { color: theme.text }]}>Remind me</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Pick a time to come back to this note
          </Text>
          <View style={styles.list}>
            {presets.map((preset) => (
              <TouchableOpacity
                key={preset.label}
                style={[styles.row, { borderColor: theme.border, backgroundColor: theme.background }]}
                onPress={() => handlePreset(preset)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
                  <MaterialIcons name={preset.icon} size={18} color={theme.primary} />
                </View>
                <Text style={[styles.rowLabel, { color: theme.text }]}>{preset.label}</Text>
                <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.surfaceMuted }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontWeight: '700',
    fontSize: 15,
  },
});
