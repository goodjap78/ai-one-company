import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ds } from '../../constants/designSystem';

type Props = {
  tags: string[];
  draft: string;
  placeholder: string;
  addLabel: string;
  onDraftChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (tag: string) => void;
  editable?: boolean;
};

export function IngredientTagEditor({
  tags,
  draft,
  placeholder,
  addLabel,
  onDraftChange,
  onAdd,
  onRemove,
  editable = true,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={onDraftChange}
          onSubmitEditing={onAdd}
          placeholder={placeholder}
          placeholderTextColor={ds.colors.textMuted}
          returnKeyType="done"
          editable={editable}
        />
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          onPress={onAdd}
          disabled={!editable}
          accessibilityRole="button"
          accessibilityLabel={addLabel}
        >
          <Text style={styles.addButtonLabel}>{addLabel}</Text>
        </Pressable>
      </View>

      {tags.length > 0 ? (
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <Pressable
              key={tag}
              style={({ pressed }) => [styles.tag, pressed && styles.tagPressed]}
              onPress={() => onRemove(tag)}
              accessibilityRole="button"
              accessibilityLabel={`${tag} 제거`}
            >
              <Text style={styles.tagLabel}>{tag}</Text>
              <Text style={styles.tagRemove}>×</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: ds.spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.card,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.md,
    minHeight: ds.sizes.buttonHeight,
    ...ds.typography.body,
    color: ds.colors.textPrimary,
    backgroundColor: ds.colors.card,
  },
  addButton: {
    minWidth: 56,
    height: ds.sizes.buttonHeight,
    borderRadius: ds.radius.chip,
    backgroundColor: ds.colors.primarySoft,
    borderWidth: 1,
    borderColor: ds.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ds.spacing.md,
  },
  addButtonPressed: {
    opacity: 0.92,
  },
  addButtonLabel: {
    ...ds.typography.caption,
    color: ds.colors.primary,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: 6,
    borderRadius: ds.radius.chip,
    backgroundColor: ds.colors.primarySoft,
    borderWidth: 1,
    borderColor: ds.colors.primary,
  },
  tagPressed: {
    opacity: 0.9,
  },
  tagLabel: {
    ...ds.typography.caption,
    color: ds.colors.primary,
    fontWeight: '600',
  },
  tagRemove: {
    ...ds.typography.caption,
    color: ds.colors.primary,
    fontWeight: '700',
  },
});
