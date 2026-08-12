import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { SplashScreen } from '../components/splash/SplashScreen';
import { theme } from '../constants/theme';
import { getNickname } from '../services/userStorage';

type BootstrapState = {
  /** Existing users with a saved nickname skip onboarding. */
  hasNickname: boolean;
  loaded: boolean;
};

/**
 * App entry: Splash → nickname onboarding (new) or Home (existing).
 */
export default function Index() {
  const [bootstrap, setBootstrap] = useState<BootstrapState>({
    hasNickname: false,
    loaded: false,
  });
  const [showSplash, setShowSplash] = useState(true);
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getNickname().then((nickname) => {
      setBootstrap({
        hasNickname: Boolean(nickname?.trim()),
        loaded: true,
      });
    });
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [contentOpacity]);

  const shouldMountContent = bootstrap.loaded && !showSplash;

  const renderMainContent = () => {
    if (!bootstrap.loaded || showSplash) return null;

    if (!bootstrap.hasNickname) {
      return <Redirect href="/onboarding" />;
    }

    return <Redirect href="/(tabs)" />;
  };

  return (
    <View style={styles.root}>
      {shouldMountContent && (
        <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
          {renderMainContent()}
        </Animated.View>
      )}

      {showSplash && (
        <SplashScreen ready={bootstrap.loaded} onFinish={handleSplashFinish} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.backgroundCream,
  },
  content: {
    flex: 1,
  },
});
