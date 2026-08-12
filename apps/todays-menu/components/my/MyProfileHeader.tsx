import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { MY_PAGE_COPY } from '../../constants/myPageCopy';
import { getNickname } from '../../services/userStorage';
import { MyCompactRow } from './MyCompactRow';

/**
 * Compact profile summary — nickname from the same storage as onboarding.
 */
export function MyProfileHeader() {
  const router = useRouter();
  const [nickname, setNickname] = useState<string | null>(null);

  const loadNickname = useCallback(() => {
    getNickname().then(setNickname);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNickname();
    }, [loadNickname]),
  );

  const trimmed = nickname?.trim() ?? '';
  const displayName = trimmed
    ? MY_PAGE_COPY.profileNameWithSuffix(trimmed)
    : MY_PAGE_COPY.profileNameFallback;

  return (
    <MyCompactRow
      title={MY_PAGE_COPY.profileTitle}
      subtitle={displayName}
      trailingLabel={MY_PAGE_COPY.profileEditLabel}
      onPress={() => router.push('/onboarding?mode=edit')}
      accessibilityLabel={`${MY_PAGE_COPY.profileTitle}, ${displayName}, ${MY_PAGE_COPY.profileEditLabel}`}
    />
  );
}
