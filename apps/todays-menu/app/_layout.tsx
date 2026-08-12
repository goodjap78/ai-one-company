import { Jua_400Regular } from '@expo-google-fonts/jua';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ds } from '../constants/designSystem';

/**
 * Root layout — load shared fonts before mounting the app tree (Sprint H4).
 * Home title uses fontFamily.titleRound (Jua) identically on iPhone and Android.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Jua_400Regular,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: ds.colors.canvas }} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="ingredients/[id]" />
        <Stack.Screen name="delivery/[id]" />
        <Stack.Screen name="meal-confirmed/[id]" />
        <Stack.Screen name="recipe/[id]" />
        <Stack.Screen name="cooking/[recipeId]" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="search" />
        <Stack.Screen name="dine-out-coming-soon" />
        <Stack.Screen name="ai-recommendation-settings" />
        <Stack.Screen name="meal-history" />
        <Stack.Screen name="recently-viewed" />
        <Stack.Screen name="shopping/[recipeId]" />
        <Stack.Screen name="fridge-raid/index" />
        <Stack.Screen name="fridge-raid/results" />
        <Stack.Screen name="convenience-combos/index" />
        <Stack.Screen name="convenience-combos/all" />
        <Stack.Screen name="convenience-combos/[id]" />
      </Stack>
    </SafeAreaProvider>
  );
}
