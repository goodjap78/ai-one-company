import { StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';

type Props = {
  title: string;
  body: string;
};

export function ElementaryWeeklyShareTipCell({ title, body }: Props) {
  return (
    <View style={styles.cell}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    minWidth: 0,
    backgroundColor: ds.colors.honeyTipBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ds.colors.borderLight,
    padding: 8,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: ds.colors.primaryDark,
  },
  body: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    color: ds.colors.warmText,
  },
});
