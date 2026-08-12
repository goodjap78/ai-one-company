import { memo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COMING_SOON_SURVEY_COPY } from '../../constants/comingSoonSurveyCopy';
import { ds } from '../../constants/designSystem';
import type { ComingSoonFeatureId, FeatureSurveyOption } from '../../types/featureSurvey';

type Props = {
  featureId: ComingSoonFeatureId | null;
  title: string;
  description: string;
  options: FeatureSurveyOption[];
  selectedOptionId: string | null;
  phase: 'choose' | 'done';
  visible: boolean;
  onClose: () => void;
  onSelectOption: (optionId: string) => void;
  onSubmit: () => void;
};

/**
 * Sprint H3-12 — lightweight Coming Soon priority survey modal.
 */
export const ComingSoonSurveyModal = memo(function ComingSoonSurveyModal({
  featureId,
  title,
  description,
  options,
  selectedOptionId,
  phase,
  visible,
  onClose,
  onSelectOption,
  onSubmit,
}: Props) {
  if (!featureId) return null;

  const canSubmit = Boolean(selectedOptionId);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={styles.card}
          accessibilityRole="summary"
          accessibilityLabel={`${title} 설문`}
        >
          {phase === 'done' ? (
            <>
              <Text style={styles.title}>{COMING_SOON_SURVEY_COPY.doneTitle}</Text>
              <Text style={styles.body}>{COMING_SOON_SURVEY_COPY.doneBody}</Text>
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={COMING_SOON_SURVEY_COPY.confirmButton}
              >
                <Text style={styles.primaryButtonText}>{COMING_SOON_SURVEY_COPY.confirmButton}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.body}>{description}</Text>

              <ScrollView
                style={styles.optionsScroll}
                contentContainerStyle={styles.optionsList}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {options.map((option) => {
                  const selected = option.id === selectedOptionId;
                  return (
                    <Pressable
                      key={option.id}
                      style={({ pressed }) => [
                        styles.option,
                        selected && styles.optionSelected,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => onSelectOption(option.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={option.label}
                    >
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected ? <View style={styles.radioDot} /> : null}
                      </View>
                      <Text
                        style={[styles.optionLabel, selected && styles.optionLabelSelected]}
                        numberOfLines={2}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  !canSubmit && styles.primaryButtonDisabled,
                  pressed && canSubmit && styles.pressed,
                ]}
                onPress={onSubmit}
                disabled={!canSubmit}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSubmit }}
                accessibilityLabel={COMING_SOON_SURVEY_COPY.voteButton}
              >
                <Text style={styles.primaryButtonText}>{COMING_SOON_SURVEY_COPY.voteButton}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={COMING_SOON_SURVEY_COPY.closeButton}
              >
                <Text style={styles.secondaryButtonText}>{COMING_SOON_SURVEY_COPY.closeButton}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(58, 36, 23, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '82%',
    backgroundColor: ds.colors.canvas,
    borderRadius: 24,
    paddingTop: 24,
    paddingBottom: 18,
    paddingHorizontal: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    color: '#3A2417',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: ds.colors.warmText,
    textAlign: 'center',
  },
  optionsScroll: {
    maxHeight: 260,
  },
  optionsList: {
    gap: 8,
    paddingVertical: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: ds.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ds.colors.borderLight,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionSelected: {
    borderColor: 'rgba(232, 90, 40, 0.45)',
    backgroundColor: ds.colors.primarySoft,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C4A892',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: ds.colors.primaryDark,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ds.colors.primaryDark,
  },
  optionLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#3A2417',
  },
  optionLabelSelected: {
    fontWeight: '700',
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: ds.colors.primaryDark,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: '#FFFCF7',
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: ds.colors.secondaryButton,
    borderWidth: 1,
    borderColor: ds.colors.secondaryBorder,
  },
  secondaryButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: '#6A5244',
  },
  pressed: {
    opacity: 0.88,
  },
});
