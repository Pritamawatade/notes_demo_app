import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
  const [showCustom, setShowCustom] = useState(false);
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);
  const [hourText, setHourText] = useState('9');
  const [minuteText, setMinuteText] = useState('00');
  const [isAM, setIsAM] = useState(true);
  const [customError, setCustomError] = useState<string | null>(null);

  const dayOptions = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  // Reset custom picker state every time the modal opens
  useEffect(() => {
    if (isVisible) {
      setShowCustom(false);
      setSelectedDayOffset(0);
      const now = new Date();
      const nextHour = now.getMinutes() >= 55 ? now.getHours() + 1 : now.getHours();
      const h12 = nextHour % 12 === 0 ? 12 : nextHour % 12;
      setHourText(String(h12));
      setMinuteText('00');
      setIsAM(nextHour < 12);
      setCustomError(null);
    }
  }, [isVisible]);

  const buildCustomDate = (): Date | null => {
    const hours = parseInt(hourText, 10);
    const minutes = parseInt(minuteText, 10);
    if (Number.isNaN(hours) || hours < 1 || hours > 12) return null;
    if (Number.isNaN(minutes) || minutes < 0 || minutes > 59) return null;
    const base = dayOptions[selectedDayOffset] ?? new Date();
    const date = new Date(base);
    let hours24 = hours % 12;
    if (!isAM) hours24 += 12;
    date.setHours(hours24, minutes, 0, 0);
    return date;
  };

  const customPreview = useMemo(() => {
    const date = buildCustomDate();
    if (!date) return null;
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDayOffset, hourText, minuteText, isAM, dayOptions]);

  const handleCustomConfirm = () => {
    const date = buildCustomDate();
    if (!date) {
      setCustomError('Enter a valid time (hour 1–12, minute 00–59).');
      return;
    }
    if (date.getTime() <= Date.now()) {
      setCustomError('Please pick a future time.');
      return;
    }
    setCustomError(null);
    onSelectReminder(date);
    onClose();
  };

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
      <KeyboardAvoidingView
        style={styles.avoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
      <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.surface }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <Text style={[styles.title, { color: theme.text }]}>Remind me</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Pick a time to come back to this note
          </Text>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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

            <TouchableOpacity
              style={[
                styles.row,
                {
                  borderColor: showCustom ? theme.primary : theme.border,
                  backgroundColor: showCustom ? theme.primarySoft : theme.background,
                },
              ]}
              onPress={() => setShowCustom((v) => !v)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Pick a custom date and time"
            >
              <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
                <MaterialIcons name="event" size={18} color={theme.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Custom date & time</Text>
              <MaterialIcons
                name={showCustom ? 'expand-less' : 'expand-more'}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            {showCustom && (
              <View
                style={[
                  styles.customBox,
                  { borderColor: theme.border, backgroundColor: theme.background },
                ]}
              >
                <Text style={[styles.customLabel, { color: theme.textSecondary }]}>Date</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayStrip}>
                  {dayOptions.map((day, index) => {
                    const selected = index === selectedDayOffset;
                    const weekday = day.toLocaleDateString(undefined, { weekday: 'short' });
                    const label =
                      index === 0
                        ? 'Today'
                        : index === 1
                          ? 'Tmrw'
                          : day.toLocaleDateString(undefined, { day: 'numeric' });
                    const month =
                      index > 1 ? day.toLocaleDateString(undefined, { month: 'short' }) : undefined;
                    return (
                      <TouchableOpacity
                        key={day.toISOString()}
                        onPress={() => {
                          setSelectedDayOffset(index);
                          setCustomError(null);
                        }}
                        style={[
                          styles.dayChip,
                          {
                            borderColor: selected ? theme.primary : theme.border,
                            backgroundColor: selected ? theme.primary : theme.surface,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={day.toDateString()}
                      >
                        <Text
                          style={[
                            styles.dayWeekday,
                            { color: selected ? theme.onPrimary ?? '#fff' : theme.textSecondary },
                          ]}
                        >
                          {weekday}
                        </Text>
                        <Text
                          style={[
                            styles.dayNum,
                            { color: selected ? theme.onPrimary ?? '#fff' : theme.text },
                          ]}
                        >
                          {label}
                        </Text>
                        {month && (
                          <Text
                            style={[
                              styles.dayMonth,
                              { color: selected ? theme.onPrimary ?? '#fff' : theme.textSecondary },
                            ]}
                          >
                            {month}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={[styles.customLabel, { color: theme.textSecondary }]}>Time</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    value={hourText}
                    onChangeText={(t) => {
                      setHourText(t.replace(/[^0-9]/g, '').slice(0, 2));
                      setCustomError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="9"
                    placeholderTextColor={theme.textSecondary}
                    selectionColor={theme.primary}
                    style={[
                      styles.timeInput,
                      { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
                    ]}
                    accessibilityLabel="Hour, 1 to 12"
                  />
                  <Text style={[styles.timeColon, { color: theme.text }]}>:</Text>
                  <TextInput
                    value={minuteText}
                    onChangeText={(t) => {
                      setMinuteText(t.replace(/[^0-9]/g, '').slice(0, 2));
                      setCustomError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor={theme.textSecondary}
                    selectionColor={theme.primary}
                    style={[
                      styles.timeInput,
                      { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
                    ]}
                    accessibilityLabel="Minute, 00 to 59"
                  />
                  <View style={[styles.ampmWrap, { borderColor: theme.border }]}>
                    <TouchableOpacity
                      onPress={() => {
                        setIsAM(true);
                        setCustomError(null);
                      }}
                      style={[
                        styles.ampmButton,
                        isAM && { backgroundColor: theme.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.ampmText,
                          { color: isAM ? theme.onPrimary ?? '#fff' : theme.textSecondary },
                        ]}
                      >
                        AM
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setIsAM(false);
                        setCustomError(null);
                      }}
                      style={[
                        styles.ampmButton,
                        !isAM && { backgroundColor: theme.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.ampmText,
                          { color: !isAM ? theme.onPrimary ?? '#fff' : theme.textSecondary },
                        ]}
                      >
                        PM
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {customPreview && (
                  <View style={[styles.previewBox, { backgroundColor: theme.primarySoft }]}>
                    <MaterialIcons name="alarm" size={16} color={theme.primary} />
                    <Text style={[styles.previewText, { color: theme.primary }]}>
                      {customPreview}
                    </Text>
                  </View>
                )}
                {customError && (
                  <Text style={[styles.errorText, { color: theme.danger }]}>{customError}</Text>
                )}
                <TouchableOpacity
                  onPress={handleCustomConfirm}
                  style={[styles.confirmButton, { backgroundColor: theme.primary }]}
                  accessibilityRole="button"
                  accessibilityLabel="Set custom reminder"
                >
                  <Text style={[styles.confirmText, { color: theme.onPrimary ?? '#fff' }]}>
                    Set reminder
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.surfaceMuted }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  avoid: {
    flex: 1,
  },
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
    maxHeight: '88%',
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
    paddingBottom: 4,
  },
  scroll: {
    maxHeight: 460,
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
  customBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  customLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  dayStrip: {
    flexGrow: 0,
  },
  dayChip: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    minWidth: 62,
    alignItems: 'center',
  },
  dayWeekday: {
    fontSize: 11,
    fontWeight: '700',
  },
  dayNum: {
    fontSize: 14,
    fontWeight: '800',
  },
  dayMonth: {
    fontSize: 11,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    width: 56,
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
  },
  timeColon: {
    fontSize: 20,
    fontWeight: '800',
    marginHorizontal: 6,
  },
  ampmWrap: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 10,
  },
  ampmButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  ampmText: {
    fontSize: 14,
    fontWeight: '800',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  previewText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmButton: {
    marginTop: 6,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmText: {
    fontWeight: '800',
    fontSize: 15,
  },
});
