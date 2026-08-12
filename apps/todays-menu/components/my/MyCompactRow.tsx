import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ds } from '../../constants/designSystem';
import { appChrome } from '../ui/appChrome';

type Props = {
  title: string;
  subtitle?: string;
  detail?: string;
  trailingLabel?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  children?: ReactNode;
};

export function MyCompactRow({
  title,
  subtitle,
  detail,
  trailingLabel,
  onPress,
  accessibilityLabel,
  children,
}: Props) {
  const content = (
    <View style={styles.content}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
            {subtitle}
          </Text>
        ) : null}
        {detail ? (
          <Text style={styles.detail} numberOfLines={2} ellipsizeMode="tail">
            {detail}
          </Text>
        ) : null}
        {children}
      </View>
      {trailingLabel ? (
        <View style={styles.trailing}>
          <Text style={styles.trailingLabel}>{trailingLabel}</Text>
          {onPress ? (
            <MaterialCommunityIcons name="chevron-right" size={18} color={ds.colors.textMuted} />
          ) : null}
        </View>
      ) : onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color={ds.colors.textMuted} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [appChrome.card, styles.card, pressed && appChrome.pressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[appChrome.card, styles.card]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    gap: 0,
    paddingVertical: ds.spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ds.spacing.md,
    minHeight: ds.sizes.touchTarget - 8,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    fontWeight: '600',
  },
  subtitle: {
    ...ds.typography.body,
    color: ds.colors.textPrimary,
    fontWeight: '700',
  },
  detail: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    fontWeight: '500',
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  trailingLabel: {
    ...ds.typography.caption,
    color: ds.colors.textMuted,
    fontWeight: '600',
  },
});
