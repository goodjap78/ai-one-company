import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ds } from '../../constants/designSystem';
import { appChrome } from '../ui/appChrome';

type Props = {
  emoji: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  children?: ReactNode;
  accessibilityLabel?: string;
};

export function MySectionCard({
  emoji,
  title,
  subtitle,
  onPress,
  children,
  accessibilityLabel,
}: Props) {
  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {emoji} {title}
          </Text>
          {subtitle ? <Text style={appChrome.sectionHint}>{subtitle}</Text> : null}
        </View>
        {onPress ? (
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={ds.colors.textMuted}
          />
        ) : null}
      </View>
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [appChrome.card, pressed && appChrome.pressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={appChrome.card}>{content}</View>;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ds.spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...ds.typography.sectionTitle,
    fontSize: 18,
    lineHeight: 24,
    color: ds.colors.textPrimary,
  },
});
