import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { elementaryBreakfastWeeklyPlanCopy as elemBreakfastCopy } from '../../constants/elementaryBreakfastWeeklyPlanCopy';
import { elementaryDinnerWeeklyPlanCopy as elemDinnerCopy } from '../../constants/elementaryDinnerWeeklyPlanCopy';
import { toddlerBreakfastWeeklyPlanCopy as toddlerBreakfastCopy } from '../../constants/toddlerBreakfastWeeklyPlanCopy';
import { toddlerDinnerWeeklyPlanCopy as toddlerDinnerCopy } from '../../constants/toddlerDinnerWeeklyPlanCopy';
import { ds } from '../../constants/designSystem';
import { SHARE_CARD_QA_PREVIEW_MAX_WIDTH } from '../../constants/elementaryWeeklyShareCardLayout';
import { generateElementaryBreakfastWeek } from '../../data/recipes/elementaryBreakfastWeeklyPlan';
import { generateElementaryDinnerWeek } from '../../data/recipes/elementaryDinnerWeeklyPlan';
import { generateToddlerBreakfastWeek } from '../../data/recipes/toddlerBreakfastWeeklyPlan';
import { generateToddlerDinnerWeek } from '../../data/recipes/toddlerDinnerWeeklyPlan';
import { buildElementaryBreakfastWeeklyShareCardModel } from '../../services/weeklyPlan/elementaryBreakfastWeeklyPlanDisplay';
import { buildElementaryDinnerWeeklyShareCardModel } from '../../services/weeklyPlan/elementaryDinnerWeeklyPlanDisplay';
import {
  buildToddlerBreakfastWeeklyShareCardModel,
  buildToddlerDinnerWeeklyShareCardModel,
} from '../../services/weeklyPlan/toddlerBfDnWeeklyPlanDisplay';
import { ElementaryWeeklyShareCardPreview } from '../elementaryWeekly/ElementaryWeeklyShareCardPreview';
import { ScreenBackButton } from '../ui/ScreenBackButton';

type Audience = 'elementary' | 'toddler';
type MealMode = 'breakfast' | 'dinner';

/** Dev-only preview for family weekly share cards (not shown in production). */
export function ElementaryWeeklyShareQaScreen() {
  const [audience, setAudience] = useState<Audience>('toddler');
  const [mode, setMode] = useState<MealMode>('breakfast');

  const models = useMemo(() => {
    const elemBf = generateElementaryBreakfastWeek(42);
    const elemDn = generateElementaryDinnerWeek(42);
    const todBf = generateToddlerBreakfastWeek(42);
    const todDn = generateToddlerDinnerWeek(42);
    return {
      elementary: {
        breakfast:
          elemBf.ok && elemBf.plan
            ? buildElementaryBreakfastWeeklyShareCardModel(elemBf.plan)
            : null,
        dinner:
          elemDn.ok && elemDn.plan
            ? buildElementaryDinnerWeeklyShareCardModel(elemDn.plan)
            : null,
      },
      toddler: {
        breakfast:
          todBf.ok && todBf.plan ? buildToddlerBreakfastWeeklyShareCardModel(todBf.plan) : null,
        dinner: todDn.ok && todDn.plan ? buildToddlerDinnerWeeklyShareCardModel(todDn.plan) : null,
      },
    };
  }, []);

  const activeModel = models[audience][mode];
  const activeCopy =
    audience === 'elementary'
      ? mode === 'breakfast'
        ? elemBreakfastCopy
        : elemDinnerCopy
      : mode === 'breakfast'
        ? toddlerBreakfastCopy
        : toddlerDinnerCopy;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenBackButton label="뒤로" />
        <Text style={styles.title}>Weekly Share QA</Text>
        <Text style={styles.hint}>
          Dev / QA only — 초등 / 유아 · 아침 / 저녁. Preview scaled to min(90vw,{' '}
          {SHARE_CARD_QA_PREVIEW_MAX_WIDTH}px); capture stays 360×450 → 1080×1350
        </Text>

        <View style={styles.switchRow}>
          <Pressable
            style={[styles.switchChip, audience === 'toddler' && styles.switchChipActive]}
            onPress={() => setAudience('toddler')}
            accessibilityRole="button"
            accessibilityState={{ selected: audience === 'toddler' }}
          >
            <Text style={[styles.switchText, audience === 'toddler' && styles.switchTextActive]}>
              유아
            </Text>
          </Pressable>
          <Pressable
            style={[styles.switchChip, audience === 'elementary' && styles.switchChipActive]}
            onPress={() => setAudience('elementary')}
            accessibilityRole="button"
            accessibilityState={{ selected: audience === 'elementary' }}
          >
            <Text
              style={[styles.switchText, audience === 'elementary' && styles.switchTextActive]}
            >
              초등학생
            </Text>
          </Pressable>
        </View>

        <View style={styles.switchRow}>
          <Pressable
            style={[styles.switchChip, mode === 'breakfast' && styles.switchChipActive]}
            onPress={() => setMode('breakfast')}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'breakfast' }}
          >
            <Text style={[styles.switchText, mode === 'breakfast' && styles.switchTextActive]}>
              아침 7일
            </Text>
          </Pressable>
          <Pressable
            style={[styles.switchChip, mode === 'dinner' && styles.switchChipActive]}
            onPress={() => setMode('dinner')}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'dinner' }}
          >
            <Text style={[styles.switchText, mode === 'dinner' && styles.switchTextActive]}>
              저녁 7일
            </Text>
          </Pressable>
        </View>

        <Text style={styles.section}>
          {audience === 'toddler' ? '유아' : '초등학생'} · {mode === 'breakfast' ? '아침' : '저녁'} 7일
        </Text>
        {activeModel ? (
          <View style={styles.previewWrap}>
            <ElementaryWeeklyShareCardPreview model={activeModel} copy={activeCopy} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ds.colors.canvas,
  },
  content: {
    padding: ds.spacing.screen,
    gap: ds.spacing.md,
    alignItems: 'center',
  },
  title: {
    ...ds.typography.sectionTitle,
    color: ds.colors.textPrimary,
    alignSelf: 'flex-start',
  },
  hint: {
    ...ds.typography.caption,
    color: ds.colors.textMuted,
    alignSelf: 'flex-start',
  },
  switchRow: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'flex-start',
  },
  switchChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ds.colors.border,
    backgroundColor: ds.colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  switchChipActive: {
    borderColor: ds.colors.primary,
    backgroundColor: ds.colors.primarySoft,
  },
  switchText: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
  switchTextActive: {
    color: ds.colors.primaryDark,
  },
  section: {
    ...ds.typography.caption,
    fontWeight: '800',
    color: ds.colors.primary,
    alignSelf: 'flex-start',
  },
  previewWrap: {
    alignItems: 'center',
    width: '100%',
  },
});
