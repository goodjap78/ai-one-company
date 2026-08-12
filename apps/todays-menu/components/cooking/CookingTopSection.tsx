import { StyleSheet, Text, View } from 'react-native';
import { getHankkiCookingMessages } from '../../constants/HankkiMessages';
import { theme } from '../../constants/theme';
import { MealImageView } from '../meal/MealImageView';
import type { RecipeImage } from '../../types/recipe';

type Props = {
  title: string;
  image: RecipeImage;
  currentStep: number;
  totalSteps: number;
};

const labels = getHankkiCookingMessages();

export function CookingTopSection({ title, image, currentStep, totalSteps }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.imageWrap}>
        <MealImageView
          image={image}
          style={styles.image}
          variant="thumb"
          showEmojiFallback
        />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.stepLabel}>
          {labels.currentStepLabel} {currentStep} / {totalSteps}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.tip,
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.primaryMuted,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...theme.typography.greetingTitle,
    fontSize: 20,
    color: theme.colors.textPrimary,
    lineHeight: 26,
  },
  stepLabel: {
    ...theme.typography.sectionEyebrow,
    color: theme.colors.primary,
  },
});
