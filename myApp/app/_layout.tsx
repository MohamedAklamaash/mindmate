import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { SplashScreen } from '@/components/SplashScreen';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { useUserStore } from '@/store/userStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  
  const userType = useUserStore((state) => state.userType);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  console.log('RootLayout render - userType:', userType);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  // Show splash screen if user type is not selected
  if (userType === null) {
    return <SplashScreen />;
  }

  // If user type is 'user' but not authenticated, show Google Sign In
  if (userType === 'user' && !isAuthenticated) {
    return <GoogleSignIn />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
