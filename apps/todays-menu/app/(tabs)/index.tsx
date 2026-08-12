import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeScreen } from '../../components/home/HomeScreen';
import { appChrome } from '../../components/ui/appChrome';
import { ScreenLoading } from '../../components/ui/ScreenLoading';
import { getNickname } from '../../services/userStorage';

export default function HomeTab() {
  const [nickname, setNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNickname().then((value) => {
      setNickname(value);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[{ flex: 1 }, appChrome.canvas]} edges={['top']}>
        <ScreenLoading compact calm title="한끼 준비 중" />
      </SafeAreaView>
    );
  }

  if (!nickname?.trim()) {
    return <Redirect href="/onboarding" />;
  }

  return <HomeScreen nickname={nickname} />;
}
