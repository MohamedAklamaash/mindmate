import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { SplashScreen } from '@/components/SplashScreen';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import NicknameInputScreen from '@/components/ui/questions/NamePage';
import QuestionOne from '@/components/ui/questions/QuestionOne';
import QuestionTwo from '@/components/ui/questions/QuestionTwo';
import QuestionThree from '@/components/ui/questions/QuestionThree';
import QuestionFour from '@/components/ui/questions/QuestionFour';
import QuestionFive from '@/components/ui/questions/QuestionFive';
import QuestionSix from '@/components/ui/questions/QuestionSix';
import QuestionSeven from '@/components/ui/questions/QuestionSeven';
import QuestionEight from '@/components/ui/questions/QuestionEight';
import QuestionNine from '@/components/ui/questions/QuestionNine';
import QuestionTen from '@/components/ui/questions/QuestionTen';
import { useUserStore } from '@/store/userStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  
  const userType = useUserStore((state) => state.userType);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const needsNickname = useUserStore((state) => state.needsNickname);
  const onboardingStage = useUserStore((state) => state.onboardingStage);

  console.log('RootLayout render - userType:', userType);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  // Show splash screen if user type is not selected
  if (userType === null) {
    return <SplashScreen />;
  }

  // If user type is 'user' but not authenticated and needs nickname, go to NamePage
  if (userType === 'user' && !isAuthenticated && (needsNickname || onboardingStage === 'namePage')) {
    return <NicknameInputScreen signupMethod="none" />;
  }

  // If in onboarding Question One stage
  if (userType === 'user' && !isAuthenticated && onboardingStage === 'questionOne') {
    return <QuestionOne />;
  }

  // If in onboarding Question Two stage
  if (userType === 'user' && !isAuthenticated && onboardingStage === 'questionTwo') {
    return <QuestionTwo />;
  }

  // If in onboarding Question Three stage
  if (userType === 'user' && !isAuthenticated && onboardingStage === 'questionThree') {
    return <QuestionThree />;
  }

  // If in onboarding Question Four stage
  if (userType === 'user' && !isAuthenticated && onboardingStage === 'questionFour') {
    return <QuestionFour />;
  }

  // If in onboarding Question Five stage
  if (userType === 'user' && !isAuthenticated && onboardingStage === 'questionFive') {
    return <QuestionFive />;
  }

  // If in onboarding Question Six stage
  if (userType === 'user' && !isAuthenticated && onboardingStage === 'questionSix') {
    return <QuestionSix />;
  }

  // If in onboarding Question Seven stage
  if (userType === 'user' && !isAuthenticated && onboardingStage === 'questionSeven') {
    return <QuestionSeven />;
  }

  // If in onboarding Question Eight stage
  if (userType === 'user' && !isAuthenticated && onboardingStage === 'questionEight') {
    return <QuestionEight />;
  }

  // If in onboarding Question Nine stage
  if (userType === 'user' && !isAuthenticated && onboardingStage === 'questionNine') {
    return <QuestionNine />;
  }

  // If in onboarding Question Ten stage
  if (userType === 'user' && !isAuthenticated && onboardingStage === 'questionTen') {
    return <QuestionTen />;
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
