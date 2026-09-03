import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ONBOARDING_COPY } from '../../constants/onboardingCopy';
import { NAV_BACK } from '../../constants/navigationCopy';
import { theme } from '../../constants/theme';
import {
  nicknameValidationMessage,
  NICKNAME_MAX_LENGTH,
  validateNicknameInput,
  waitForImeCommit,
} from '../../services/nicknameValidation';
import { setOnboardingComplete } from '../../services/onboardingStorage';
import { saveUserProfile } from '../../services/memory';
import { saveNickname, getNickname } from '../../services/userStorage';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { SeedMascot, type SeedMascotSize } from '../common/SeedMascot';

/**
 * First-launch nickname onboarding (H2-9 / ONB-2).
 * Edit mode (`?mode=edit`) uses a compact layout without the onboarding hero.
 */
export function OnboardingScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';
  const copy = isEditMode ? ONBOARDING_COPY.edit : ONBOARDING_COPY;
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const nicknameRef = useRef('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editReady, setEditReady] = useState(!isEditMode);

  const syncNickname = useCallback((text: string) => {
    nicknameRef.current = text;
    setNickname(text);
  }, []);

  const dismissKeyboard = useCallback(() => {
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const scrollFormIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      const delay = Platform.OS === 'android' ? 120 : 0;
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, delay);
    });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const showSub = Keyboard.addListener(showEvent, scrollFormIntoView);
    return () => {
      showSub.remove();
    };
  }, [scrollFormIntoView]);

  useFocusEffect(
    useCallback(() => {
      if (!isEditMode) return undefined;
      dismissKeyboard();
      return undefined;
    }, [dismissKeyboard, isEditMode]),
  );

  useEffect(() => {
    if (!isEditMode) return;
    dismissKeyboard();
    setEditReady(false);
    getNickname().then((value) => {
      if (value?.trim()) syncNickname(value.trim());
      setEditReady(true);
      dismissKeyboard();
    });
  }, [dismissKeyboard, isEditMode, syncNickname]);

  const resolveNicknameForSubmit = useCallback(async (): Promise<string> => {
    dismissKeyboard();
    await waitForImeCommit();
    return nicknameRef.current;
  }, [dismissKeyboard]);

  const handleNicknameChange = useCallback(
    (text: string) => {
      syncNickname(text);
      if (error) setError('');
    },
    [error, syncNickname],
  );

  const handleNicknameEndEditing = useCallback(
    (text: string) => {
      syncNickname(text);
    },
    [syncNickname],
  );

  // ~40–50% larger than previous 80px; slightly smaller on short phones.
  const mascotSize: SeedMascotSize = height < 700 ? 112 : width <= 375 ? 116 : 120;
  const compact = height < 700 || width <= 360;

  const handleStart = async () => {
    if (saving) return;

    setSaving(true);
    setError('');

    try {
      const raw = await resolveNicknameForSubmit();
      const validated = validateNicknameInput(raw);
      if (!validated.ok) {
        setError(nicknameValidationMessage(validated.error));
        return;
      }

      const trimmed = validated.value;
      syncNickname(trimmed);

      await saveNickname(trimmed);
      await saveUserProfile({ nickname: trimmed });
      await setOnboardingComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (isEditMode) {
        router.back();
        return;
      }
      router.replace('/(tabs)');
    } catch {
      setError(ONBOARDING_COPY.errorSave);
    } finally {
      setSaving(false);
    }
  };

  const handleInputFocus = () => {
    scrollFormIntoView();
  };

  if (isEditMode) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.editPage, compact && styles.editPageCompact]}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <ScreenBackButton label={NAV_BACK.myPage} fallbackHref="/(tabs)/my" />

            <View style={styles.editHeader}>
              <Text style={[styles.title, compact && styles.titleCompact]} accessibilityRole="header">
                {copy.titleLine1}
              </Text>
              <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>{copy.subtitle}</Text>
            </View>

            <View style={styles.editForm}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={nickname}
                onChangeText={handleNicknameChange}
                onEndEditing={(event) => handleNicknameEndEditing(event.nativeEvent.text)}
                placeholder={ONBOARDING_COPY.placeholder}
                placeholderTextColor={theme.colors.textMuted}
                maxLength={NICKNAME_MAX_LENGTH}
                autoFocus={false}
                showSoftInputOnFocus
                autoCorrect={false}
                autoComplete="off"
                editable={editReady}
                returnKeyType="done"
                blurOnSubmit={false}
                onFocus={handleInputFocus}
                onSubmitEditing={() => {
                  void handleStart();
                }}
                accessibilityLabel={ONBOARDING_COPY.placeholder}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && !saving && styles.buttonPressed,
                  saving && styles.buttonDisabled,
                ]}
                onPress={() => {
                  void handleStart();
                }}
                disabled={saving || !editReady}
                accessibilityRole="button"
                accessibilityLabel={copy.startButton}
              >
                <Text style={styles.buttonText}>{copy.startButton}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.page, compact && styles.pageCompact, styles.scrollContent]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.hero}>
            <View style={[styles.mascotStage, { minHeight: mascotSize }]}>
              <SeedMascot variant="wave" size={mascotSize} />
            </View>

            <View style={styles.greeting}>
              <Text
                style={[styles.title, compact && styles.titleCompact]}
                accessibilityRole="header"
              >
                {copy.titleLine1}
              </Text>
              {copy.titleLine2 ? (
                <Text style={[styles.titleSecond, compact && styles.titleCompact]}>
                  {copy.titleLine2}
                </Text>
              ) : null}
              <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
                {copy.subtitle}
              </Text>
            </View>
          </View>

          <View style={styles.form}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={nickname}
              onChangeText={handleNicknameChange}
              onEndEditing={(event) => handleNicknameEndEditing(event.nativeEvent.text)}
              placeholder={ONBOARDING_COPY.placeholder}
              placeholderTextColor={theme.colors.textMuted}
              maxLength={NICKNAME_MAX_LENGTH}
              autoFocus={false}
              showSoftInputOnFocus
              autoCorrect={false}
              autoComplete="off"
              returnKeyType="done"
              blurOnSubmit={false}
              onFocus={handleInputFocus}
              onSubmitEditing={() => {
                void handleStart();
              }}
              accessibilityLabel={ONBOARDING_COPY.placeholder}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && !saving && styles.buttonPressed,
                saving && styles.buttonDisabled,
              ]}
              onPress={() => {
                void handleStart();
              }}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={copy.startButton}
            >
              <Text style={styles.buttonText}>{copy.startButton}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8EF',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.screen,
    justifyContent: 'flex-start',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    maxWidth: theme.sizes.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  editPage: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.screen,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    maxWidth: theme.sizes.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
    gap: theme.spacing.lg,
  },
  editPageCompact: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  pageCompact: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  hero: {
    alignItems: 'center',
    width: '100%',
  },
  mascotStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  greeting: {
    marginTop: theme.spacing.sm,
    alignItems: 'center',
    gap: 2,
    width: '100%',
  },
  editHeader: {
    gap: theme.spacing.xs,
    width: '100%',
  },
  editForm: {
    gap: theme.spacing.md,
    width: '100%',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'left',
    letterSpacing: -0.4,
  },
  titleSecond: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  titleCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    color: '#8A7464',
    textAlign: 'left',
  },
  subtitleCompact: {
    fontSize: 15,
    lineHeight: 20,
  },
  form: {
    marginTop: 'auto',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
  input: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFFCF7',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.primaryDark,
    textAlign: 'center',
    fontWeight: '600',
  },
  button: {
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.button,
  },
  buttonPressed: {
    ...theme.interaction.pressed,
    backgroundColor: theme.colors.primaryDark,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: '#FFFCF7',
  },
});
