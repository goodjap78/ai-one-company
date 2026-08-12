import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScreenLoading } from '../ui/ScreenLoading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getHankkiCookingMessages } from '../../constants/HankkiMessages';
import { theme } from '../../constants/theme';
import { recordHomeCookingComplete } from '../../services/homeService';
import { fetchRecipe } from '../../services/recipe';
import type { Recipe } from '../../types/recipe';
import { estimateStepMinutes } from '../../utils/cookingStepTime';
import { getCurrentMealType } from '../../utils/mealType';
import { CookingCompleteScreen } from './CookingCompleteScreen';
import { CookingStepActions } from './CookingStepActions';
import { CookingStepCard } from './CookingStepCard';
import { CookingStepProgress } from './CookingStepProgress';
import { CookingTopSection } from './CookingTopSection';

type Props = {
  recipeId: string;
};

type CookingPhase = 'cooking' | 'complete';

const labels = getHankkiCookingMessages();
const STEP_FADE_MS = 220;

export function CookingScreen({ recipeId }: Props) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<CookingPhase>('cooking');
  const stepOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!recipeId) {
      setRecipe(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setStepIndex(0);
    setPhase('cooking');

    fetchRecipe(recipeId).then((data) => {
      if (cancelled) return;
      setRecipe(data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  const steps = recipe?.steps ?? [];
  const currentStep = steps[stepIndex] ?? null;
  const totalSteps = steps.length;
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;

  const stepMinutes = recipe
    ? estimateStepMinutes(recipe.cookTime, totalSteps)
    : null;

  const animateStepChange = (nextIndex: number) => {
    Animated.timing(stepOpacity, {
      toValue: 0,
      duration: STEP_FADE_MS / 2,
      useNativeDriver: true,
    }).start(() => {
      setStepIndex(nextIndex);
      Animated.timing(stepOpacity, {
        toValue: 1,
        duration: STEP_FADE_MS / 2,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  const handlePrevious = () => {
    animateStepChange(Math.max(stepIndex - 1, 0));
  };

  const handleNext = () => {
    animateStepChange(Math.min(stepIndex + 1, totalSteps - 1));
  };

  const handleComplete = async () => {
    if (recipe) {
      await recordHomeCookingComplete(
        recipeId,
        getCurrentMealType(),
        recipe.cookTime,
      );
    }
    setPhase('complete');
  };

  const handleGoHome = () => {
    router.replace('/');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenLoading message={labels.loadingMessage} />
      </SafeAreaView>
    );
  }

  if (!recipe || recipe.mode === 'delivery' || !currentStep || totalSteps === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{labels.notFoundMessage}</Text>
          <Pressable style={styles.backFallback} onPress={handleBack}>
            <Text style={styles.backFallbackText}>{labels.backLabel}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'complete') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <CookingCompleteScreen mealTitle={recipe.title} onGoHome={handleGoHome} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.page}>
        <View style={styles.content}>
          <View style={styles.frame}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel={labels.backLabel}
            >
              <Text style={styles.backLabel}>{labels.backLabel}</Text>
            </Pressable>

            <CookingTopSection
              title={recipe.title}
              image={recipe.image}
              currentStep={currentStep.order}
              totalSteps={totalSteps}
            />

            <CookingStepProgress currentStep={currentStep.order} totalSteps={totalSteps} />

            {isFirstStep ? (
              <Text style={styles.startHint}>{labels.startHint}</Text>
            ) : null}

            <Animated.View style={{ opacity: stepOpacity }}>
              <CookingStepCard step={currentStep} estimatedMinutes={stepMinutes} />
            </Animated.View>
          </View>
        </View>

        <CookingStepActions
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onComplete={handleComplete}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundCream,
  },
  page: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  frame: {
    width: '100%',
    maxWidth: theme.sizes.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.screen,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md + 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: theme.sizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
    marginLeft: -theme.spacing.sm,
  },
  pressed: theme.interaction.pressedLight,
  backLabel: {
    ...theme.typography.secondaryButton,
    color: theme.colors.textSecondary,
  },
  startHint: {
    ...theme.typography.greetingSubtitle,
    color: theme.colors.primary,
    textAlign: 'center',
    fontSize: 15,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.screen,
  },
  errorText: {
    ...theme.typography.chefMessage,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  backFallback: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.button,
  },
  backFallbackText: {
    ...theme.typography.secondaryButton,
    color: theme.colors.primary,
  },
});
