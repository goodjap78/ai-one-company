import { Alert, Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ds } from '../../constants/designSystem';
import { LEGAL_URLS } from '../../constants/legalUrls';
import { MY_PAGE_COPY } from '../../constants/myPageCopy';
import { buildInquiryMailUrl, PUBLIC_SUPPORT_EMAIL } from '../../utils/buildInquiryMailUrl';
import { openExternalUrl } from '../../utils/openExternalUrl';
import { appChrome } from '../ui/appChrome';

type LegalRow = {
  id: string;
  label: string;
  description: string;
  url: string;
  showEmail?: boolean;
};

const LEGAL_ROWS: LegalRow[] = [
  {
    id: 'privacy',
    label: MY_PAGE_COPY.legal.privacy,
    description: MY_PAGE_COPY.legal.privacyDescription,
    url: LEGAL_URLS.privacy,
  },
  {
    id: 'terms',
    label: MY_PAGE_COPY.legal.terms,
    description: MY_PAGE_COPY.legal.termsDescription,
    url: LEGAL_URLS.terms,
  },
];

export function MyLegalSection() {
  const handleInquiry = async () => {
    const url = buildInquiryMailUrl();
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) throw new Error('cannot open mailto');
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        '이메일 앱을 열 수 없어요',
        `${PUBLIC_SUPPORT_EMAIL}으로 문의해 주세요.`,
        [
          {
            text: '주소 복사',
            onPress: () => {
              void Share.share({ message: PUBLIC_SUPPORT_EMAIL });
            },
          },
          { text: '확인', style: 'cancel' },
        ],
      );
    }
  };

  const handleLegalLink = (url: string) => {
    void openExternalUrl(url, {
      failureTitle: '연결할 수 없어요',
      failureMessage: '잠시 후 다시 시도해 주세요.',
    });
  };

  return (
    <View style={appChrome.card}>
      <Text style={styles.sectionTitle}>
        {MY_PAGE_COPY.legal.emoji} {MY_PAGE_COPY.legal.title}
      </Text>

      <View style={styles.list}>
        <Pressable
          style={({ pressed }) => [styles.row, pressed && appChrome.pressed]}
          onPress={handleInquiry}
          accessibilityRole="button"
          accessibilityLabel={`${MY_PAGE_COPY.legal.inquiry}, ${PUBLIC_SUPPORT_EMAIL}`}
        >
          <View style={styles.rowText}>
            <Text style={styles.label}>{MY_PAGE_COPY.legal.inquiry}</Text>
            <Text style={styles.description}>{PUBLIC_SUPPORT_EMAIL}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={ds.colors.textMuted} />
        </Pressable>

        {LEGAL_ROWS.map((row) => (
          <View key={row.id}>
            <View style={styles.divider} />
            <Pressable
              style={({ pressed }) => [styles.row, pressed && appChrome.pressed]}
              onPress={() => handleLegalLink(row.url)}
              accessibilityRole="button"
              accessibilityLabel={row.label}
            >
              <View style={styles.rowText}>
                <Text style={styles.label}>{row.label}</Text>
                <Text style={styles.description}>{row.description}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={ds.colors.textMuted} />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...appChrome.sectionTitle,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: ds.sizes.touchTarget,
    paddingVertical: ds.spacing.md,
    gap: ds.spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...ds.typography.body,
    color: ds.colors.textPrimary,
    fontWeight: '600',
  },
  description: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ds.colors.borderLight,
  },
});
