import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SEARCH_COPY } from '../../constants/searchCopy';
import { theme } from '../../constants/theme';
import {
  addRecentSearch,
  getRecentSearches,
  searchRecipes,
} from '../../services/search';
import type { RecipeSearchResult } from '../../types/recipeSearch';
import { setRecipeOpenSource } from '../../services/analytics';
import { SectionEmptyState } from '../ui/SectionEmptyState';

export function RecipeSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    getRecentSearches().then(setRecentSearches);
  }, []);

  const results = useMemo(() => searchRecipes(query), [query]);
  const trimmedQuery = query.trim();
  const showRecent = trimmedQuery.length === 0;

  const handleSelectResult = useCallback(
    async (item: RecipeSearchResult) => {
      if (trimmedQuery) {
        const next = await addRecentSearch(trimmedQuery);
        setRecentSearches(next);
      }
      setRecipeOpenSource('search');
      router.push(`/recipe/${item.recipeId}`);
    },
    [router, trimmedQuery],
  );

  const handleSelectRecent = (term: string) => {
    setQuery(term);
  };

  const renderResult = ({ item }: { item: RecipeSearchResult }) => (
    <Pressable
      style={({ pressed }) => [styles.resultRow, pressed && styles.pressed]}
      onPress={() => handleSelectResult(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title} 레시피 보기`}
    >
      <View style={styles.resultText}>
        <Text style={styles.resultTitle} numberOfLines={2} ellipsizeMode="tail">
          {item.title}
        </Text>
        {item.matchType === 'ingredient' && item.matchedIngredient ? (
          <Text style={styles.resultMeta}>
            {SEARCH_COPY.resultIngredientMatch(item.matchedIngredient)}
          </Text>
        ) : (
          <Text style={styles.resultMeta} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={theme.colors.textMuted}
      />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={SEARCH_COPY.backLabel}
          >
            <Text style={styles.backLabel}>{SEARCH_COPY.backLabel}</Text>
          </Pressable>
          <Text style={styles.title}>{SEARCH_COPY.screenTitle}</Text>
        </View>

        <View style={styles.searchField}>
          <MaterialCommunityIcons
            name="magnify"
            size={22}
            color={theme.colors.textMuted}
          />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder={SEARCH_COPY.placeholder}
            placeholderTextColor={theme.colors.textMuted}
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel={SEARCH_COPY.placeholder}
          />
        </View>

        {showRecent && recentSearches.length > 0 ? (
          <View style={styles.recentBlock}>
            <Text style={styles.recentLabel}>{SEARCH_COPY.emptyQueryHint}</Text>
            <View style={styles.recentRow}>
              {recentSearches.map((term) => (
                <Pressable
                  key={term}
                  style={({ pressed }) => [styles.recentChip, pressed && styles.pressed]}
                  onPress={() => handleSelectRecent(term)}
                  accessibilityRole="button"
                  accessibilityLabel={`${term} 검색`}
                >
                  <Text style={styles.recentChipText} numberOfLines={1} ellipsizeMode="tail">
                    {term}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {!showRecent && results.length === 0 ? (
          <SectionEmptyState emoji="🔍" message={SEARCH_COPY.emptyResults} showAvatar={false} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.recipeId}
            renderItem={renderResult}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
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
    paddingHorizontal: theme.spacing.screen,
    gap: theme.spacing.md,
  },
  header: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: theme.sizes.touchTarget,
    justifyContent: 'center',
  },
  backLabel: {
    ...theme.typography.secondaryButton,
    color: theme.colors.textSecondary,
  },
  title: {
    ...theme.typography.screenTitle,
    color: theme.colors.textPrimary,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.bubble,
  },
  input: {
    flex: 1,
    ...theme.typography.greetingSubtitle,
    color: theme.colors.textPrimary,
    fontSize: 16,
    paddingVertical: theme.spacing.sm,
  },
  recentBlock: {
    gap: theme.spacing.sm,
  },
  recentLabel: {
    ...theme.typography.metaText,
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  recentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  recentChip: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.badge,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  recentChipText: {
    ...theme.typography.metaText,
    color: theme.colors.textPrimary,
    fontSize: 13,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  resultText: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    ...theme.typography.greetingTitle,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  resultMeta: {
    ...theme.typography.metaText,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  separator: {
    height: theme.spacing.sm,
  },
  pressed: theme.interaction.pressedLight,
});
