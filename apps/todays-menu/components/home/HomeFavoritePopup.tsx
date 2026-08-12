import { memo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SeedMascot } from '../common/SeedMascot';

export type FavoriteFeedbackKind = 'saved' | 'removed';

type Props = {
  visible: boolean;
  kind: FavoriteFeedbackKind | null;
  onConfirm: () => void;
};

const COPY: Record<
  FavoriteFeedbackKind,
  { title: string; body: string; variant: 'happy' | 'think' }
> = {
  saved: {
    title: '저장했어요!',
    body: '내 메뉴에서 언제든 확인할 수 있어요.',
    variant: 'happy',
  },
  removed: {
    title: '즐겨찾기에서 삭제했어요',
    body: '다시 저장하면 언제든 볼 수 있어요.',
    variant: 'think',
  },
};

/**
 * Cream favorite feedback popup (H2-8) — transparent mascot container.
 */
export const HomeFavoritePopup = memo(function HomeFavoritePopup({
  visible,
  kind,
  onConfirm,
}: Props) {
  if (!kind) return null;
  const copy = COPY[kind];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onConfirm}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="alert">
          <View style={styles.mascotWrap}>
            <SeedMascot variant={copy.variant} size={56} style={styles.mascot} />
          </View>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.body}>{copy.body}</Text>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel="확인"
          >
            <Text style={styles.buttonText}>확인</Text>
          </Pressable>
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
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFF8EF',
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 22,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(232, 170, 120, 0.3)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
    overflow: 'visible',
  },
  mascotWrap: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascot: {
    backgroundColor: 'transparent',
  },
  title: {
    marginTop: 4,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: '#3A2417',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#8A7464',
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    alignSelf: 'stretch',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: '#FFFCF7',
  },
});
