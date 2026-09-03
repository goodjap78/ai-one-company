import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, TextInput, View } from 'react-native';
import { childSearchCopy } from '../../constants/childSearchCopy';
import { ds } from '../../constants/designSystem';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

export function ChildSearchBar({ value, onChangeText }: Props) {
  return (
    <View style={styles.field}>
      <MaterialCommunityIcons name="magnify" size={20} color={ds.colors.textMuted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={childSearchCopy.searchPlaceholder}
        placeholderTextColor={ds.colors.textMuted}
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel={childSearchCopy.searchPlaceholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    backgroundColor: ds.colors.card,
    borderRadius: ds.radius.card,
    borderWidth: 1,
    borderColor: ds.colors.borderLight,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: ds.colors.textPrimary,
    paddingVertical: 4,
  },
});
