import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ds } from '../../constants/designSystem';
import { MOBILE_MAX_WIDTH } from '../../constants/mobileShell';
import { getTabBarSafeStyle } from '../../constants/tabBarLayout';
import { theme } from '../../constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarSafe = getTabBarSafeStyle(insets.bottom);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarHideOnKeyboard: true,
        sceneStyle: {
          backgroundColor: ds.colors.canvas,
          width: '100%',
          alignSelf: 'center',
          maxWidth: MOBILE_MAX_WIDTH,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.borderLight,
          width: '100%',
          maxWidth: MOBILE_MAX_WIDTH,
          alignSelf: 'center',
          height: tabBarSafe.height,
          paddingBottom: tabBarSafe.paddingBottom,
          paddingTop: tabBarSafe.paddingTop,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: '내 메뉴',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: '마이',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
