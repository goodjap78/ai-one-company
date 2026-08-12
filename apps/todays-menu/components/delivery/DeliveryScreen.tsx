import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getHankkiDeliveryMessages } from '../../constants/HankkiMessages';
import { theme } from '../../constants/theme';
import { fetchRecipe, getMenuById } from '../../services/recipe';
import { SeedMascot } from '../common/SeedMascot';
import { MealHeroImage } from '../home/MealHeroImage';
import { recordHomeDeliveryComplete } from '../../services/homeService';
import { recordViewedRecipe } from '../../services/viewedRecipe';
import { buildSuggestedPairings } from '../../services/recommendation/mealExperience/buildSuggestedPairings';
import { getCurrentMealType } from '../../utils/mealType';
import { resolveMealHeroImage } from '../../utils/mealHeroImage';
import { SuggestedPairingsRow } from '../home/SuggestedPairingsRow';
import { ScreenLoading } from '../ui/ScreenLoading';
import { screenLayout, FOOTER_SCROLL_PADDING } from '../ui/screenLayout';

type Props = {
  recipeId: string;
};

type DeliveryPhase = 'browse' | 'complete';

const labels = getHankkiDeliveryMessages();

export function DeliveryScreen({ recipeId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [image, setImage] = useState(resolveMealHeroImage(recipeId, 'delivery'));
  const [phase, setPhase] = useState<DeliveryPhase>('browse');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!recipeId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    let cancelled = false;

    async function load() {
      const menu = getMenuById(recipeId);
      if (menu?.mode === 'delivery') {
        if (!cancelled) {
          setTitle(menu.title);
          setSubtitle(menu.subtitle);
          setImage(resolveMealHeroImage(recipeId, 'delivery'));
          setNotFound(false);
          setLoading(false);
        }
        return;
      }

      const recipe = await fetchRecipe(recipeId);
      if (!cancelled) {
        if (recipe?.mode === 'delivery') {
          setTitle(recipe.title);
          setSubtitle(recipe.description);
          setImage(resolveMealHeroImage(recipeId, 'delivery', recipe.image.url));
          setNotFound(false);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      }
    }

    setLoading(true);
    load();

    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  useEffect(() => {
    if (!recipeId || notFound || !title) return;
    void recordViewedRecipe(recipeId);
  }, [recipeId, notFound, title]);

  const pairings = useMemo(() => {
    const menu = getMenuById(recipeId);
    return menu ? buildSuggestedPairings(menu) : [];
  }, [recipeId]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await recordHomeDeliveryComplete(recipeId, getCurrentMealType());
    setPhase('complete');
  };

  if (loading) {
    return (
      <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
        <ScreenLoading message={labels.loadingMessage} />
      </SafeAreaView>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
        <View style={screenLayout.centered}>
          <Text style={screenLayout.errorText}>{labels.notFoundMessage}</Text>
          <Pressable
            style={({ pressed }) => [screenLayout.backLink, pressed && screenLayout.pressed]}
            onPress={handleBack}
          >
            <Text style={screenLayout.backLinkText}>{labels.backToHomeLabel}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'complete') {
    return (
      <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
        <View style={styles.completePage}>
          <View style={styles.completeCard}>
            <SeedMascot variant="happy" size={56} />
            <Text style={styles.completeMessage}>{labels.completionMessage}</Text>
            <Text style={styles.completeSub}>{labels.completionSub}</Text>
            <Text style={styles.completeMeal}>{title}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              screenLayout.primaryButton,
              pressed && screenLayout.pressedPrimary,
            ]}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={labels.goHomeButton}
          >
            <Text style={screenLayout.primaryText}>{labels.goHomeButton}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
      <View style={screenLayout.page}>
        <ScrollView
          contentContainerStyle={[screenLayout.scrollContent, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <View style={screenLayout.frame}>
            <Pressable
              style={({ pressed }) => [screenLayout.backLink, pressed && screenLayout.pressed]}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel={labels.backToHomeLabel}
            >
              <Text style={screenLayout.backLinkText}>{labels.backToHomeLabel}</Text>
            </Pressable>

            <View style={styles.headerBlock}>
              <Text style={screenLayout.eyebrow}>{labels.screenEyebrow}</Text>
              <Text style={screenLayout.title} numberOfLines={2} ellipsizeMode="tail">
                {title}
              </Text>
              {subtitle ? (
                <Text style={screenLayout.subtitle} numberOfLines={2} ellipsizeMode="tail">
                  {subtitle}
                </Text>
              ) : null}
            </View>

            <MealHeroImage image={image} />

            {pairings.length > 0 ? <SuggestedPairingsRow pairings={pairings} /> : null}

            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderTitle}>{labels.placeholderTitle}</Text>
              <Text style={styles.placeholderBody}>{labels.placeholderBody}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={screenLayout.footer}>
          <Pressable
            style={({ pressed }) => [
              screenLayout.primaryButton,
              pressed && screenLayout.pressedPrimary,
            ]}
            onPress={handleComplete}
            accessibilityRole="button"
            accessibilityLabel={labels.completeButton}
          >
            <Text style={screenLayout.primaryText}>{labels.completeButton}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: FOOTER_SCROLL_PADDING,
  },
  headerBlock: {
    gap: theme.spacing.xs,
  },
  placeholderCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.tip,
  },
  placeholderTitle: {
    ...theme.typography.sectionTitle,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  placeholderBody: {
    ...theme.typography.greetingSubtitle,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  completePage: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.section,
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: theme.spacing.xl,
  },
  completeCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.card,
  },
  completeMessage: {
    ...theme.typography.greetingTitle,
    fontSize: 26,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
  },
  completeSub: {
    ...theme.typography.greetingSubtitle,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  completeMeal: {
    ...theme.typography.metaText,
    color: theme.colors.primary,
    fontSize: 15,
    marginTop: theme.spacing.sm,
  },
});
