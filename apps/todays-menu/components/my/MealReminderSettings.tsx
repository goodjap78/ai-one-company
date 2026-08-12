import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import { MEAL_REMINDER_COPY, MEAL_REMINDER_SLOT_ORDER } from '../../constants/mealReminderCopy';
import { MY_PAGE_COPY } from '../../constants/myPageCopy';
import {
  getMealReminderSettings,
  setMealReminderEnabled,
  setMealReminderTime,
} from '../../services/reminder';
import type { MealReminderSettings, MealReminderSlot } from '../../types/mealReminder';
import { appChrome } from '../ui/appChrome';
import { ScreenLoading } from '../ui/ScreenLoading';
import { SectionEmptyState } from '../ui/SectionEmptyState';
import { MySectionCard } from './MySectionCard';
export function MealReminderSettings() {
  const [settings, setSettings] = useState<MealReminderSettings | null>(null);
  const [pendingSlot, setPendingSlot] = useState<MealReminderSlot | null>(null);
  const [editingSlot, setEditingSlot] = useState<MealReminderSlot | null>(null);
  const [draftTime, setDraftTime] = useState('');
  const [timeError, setTimeError] = useState<string | null>(null);

  const slotLabels = MY_PAGE_COPY.notifications.slotLabels;

  const loadSettings = useCallback(async () => {
    const next = await getMealReminderSettings();
    setSettings(next);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const allDisabled = useMemo(() => {
    if (!settings) return false;
    return MEAL_REMINDER_SLOT_ORDER.every((slot) => !settings.slots[slot].enabled);
  }, [settings]);

  const handleToggle = async (slot: MealReminderSlot, enabled: boolean) => {
    setPendingSlot(slot);
    try {
      const next = await setMealReminderEnabled(slot, enabled);
      setSettings(next);
    } finally {
      setPendingSlot(null);
    }
  };

  const startEditing = (slot: MealReminderSlot, currentTime: string) => {
    setEditingSlot(slot);
    setDraftTime(currentTime);
    setTimeError(null);
  };

  const cancelEditing = () => {
    setEditingSlot(null);
    setDraftTime('');
    setTimeError(null);
  };

  const commitTime = async (slot: MealReminderSlot) => {
    setPendingSlot(slot);
    const result = await setMealReminderTime(slot, draftTime);
    setPendingSlot(null);

    if (!result.ok) {
      setTimeError(MEAL_REMINDER_COPY.invalidTimeMessage);
      return;
    }

    setSettings(result.settings);
    cancelEditing();
  };

  const { notifications: copy } = MY_PAGE_COPY;

  return (
    <MySectionCard emoji={copy.emoji} title={copy.title}>
      {!settings ? (
        <ScreenLoading compact />
      ) : (
        <>
          <View style={styles.list}>
            {MEAL_REMINDER_SLOT_ORDER.map((slot, index) => {
              const slotSettings = settings.slots[slot];
              const isPending = pendingSlot === slot;
              const isEditing = editingSlot === slot;

              return (
                <View key={slot}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.row}>
                    <Text style={styles.label} numberOfLines={1}>
                      {slotLabels[slot]}
                    </Text>

                    <Switch
                      value={slotSettings.enabled}
                      onValueChange={(enabled) => handleToggle(slot, enabled)}
                      disabled={isPending}
                      trackColor={{
                        false: ds.colors.borderLight,
                        true: ds.colors.primarySoft,
                      }}
                      thumbColor={
                        slotSettings.enabled ? ds.colors.primary : ds.colors.card
                      }
                      accessibilityLabel={slotLabels[slot]}
                    />

                    {isEditing ? (
                      <TextInput
                        style={[styles.timeInput, timeError ? styles.timeInputError : null]}
                        value={draftTime}
                        onChangeText={setDraftTime}
                        onBlur={() => commitTime(slot)}
                        onSubmitEditing={() => commitTime(slot)}
                        placeholder="08:00"
                        placeholderTextColor={ds.colors.textMuted}
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                        autoFocus
                        selectTextOnFocus
                        accessibilityLabel={`${slotLabels[slot]} 시간`}
                      />
                    ) : (
                      <Pressable
                        style={({ pressed }) => [styles.timeButton, pressed && appChrome.pressed]}
                        onPress={() => startEditing(slot, slotSettings.time)}
                        accessibilityRole="button"
                        accessibilityLabel={`${slotLabels[slot]} ${slotSettings.time}. ${MEAL_REMINDER_COPY.editTimeHint}`}
                      >
                        <Text style={styles.timeText}>{slotSettings.time}</Text>
                      </Pressable>
                    )}
                  </View>
                  {isEditing && timeError ? (
                    <Text style={styles.errorText}>{timeError}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>

          {allDisabled ? (
            <SectionEmptyState
              emoji="🔔"
              title={MEAL_REMINDER_COPY.emptyNotificationsTitle}
              message={MEAL_REMINDER_COPY.emptyNotificationsMessage}
              compact
            />
          ) : null}
        </>
      )}
    </MySectionCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
    paddingVertical: ds.spacing.md,
  },
  label: {
    ...ds.typography.caption,
    flex: 1,
    flexShrink: 1,
    color: ds.colors.textPrimary,
    fontWeight: '600',
  },
  timeButton: {
    minWidth: 56,
    height: ds.sizes.chipHeight,
    paddingHorizontal: ds.spacing.md,
    borderRadius: ds.radius.chip,
    backgroundColor: ds.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    ...ds.typography.caption,
    color: ds.colors.primary,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timeInput: {
    minWidth: 64,
    height: ds.sizes.chipHeight,
    paddingHorizontal: ds.spacing.md,
    borderRadius: ds.radius.chip,
    borderWidth: 1,
    borderColor: ds.colors.primary,
    backgroundColor: ds.colors.card,
    color: ds.colors.textPrimary,
    fontSize: ds.typography.caption.fontSize,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  timeInputError: {
    borderColor: '#E53935',
  },
  errorText: {
    ...ds.typography.caption,
    color: '#E53935',
    marginTop: -4,
    marginBottom: ds.spacing.md,
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ds.colors.borderLight,
  },
});