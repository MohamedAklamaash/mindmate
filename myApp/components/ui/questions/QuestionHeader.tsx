import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../../store/userStore';

interface QuestionHeaderProps {
  onBack?: () => void;
  onCancel?: () => void;
  showBack?: boolean;
  showCancel?: boolean;
}

export function QuestionHeader({ 
  onBack, 
  onCancel, 
  showBack = true, 
  showCancel = true 
}: QuestionHeaderProps) {
  const router = useRouter();
  const { signOut, setOnboardingStage } = useUserStore();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Get current onboarding stage to determine the proper back navigation
      const currentStage = useUserStore.getState().onboardingStage;
      
      // Define the navigation flow
      const navigationFlow: Record<string, string> = {
        'questionOne': 'namePage',
        'questionTwo': 'questionOne',
        'questionThree': 'questionTwo',
        'questionFour': 'questionThree',
        'questionFive': 'questionFour',
        'questionSix': 'questionFive',
        'questionSeven': 'questionSix',
        'questionEight': 'questionSeven',
        'questionNine': 'questionEight',
        'questionTen': 'questionNine',
        'namePage': 'questionTen',
      };

      // Try to navigate to the previous question
      const previousStage = navigationFlow[currentStage];
      
      if (previousStage) {
        setOnboardingStage(previousStage as any);
      } else {
        // If no previous stage, try router.back() first
        try {
          if (router.canGoBack()) {
            router.back();
          } else {
            // Fallback: go to splash screen
            router.replace('/');
          }
        } catch (error) {
          // Fallback: go to splash screen
          router.replace('/');
        }
      }
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Default cancel behavior - show confirmation and redirect to GoogleSignIn
      Alert.alert(
        'Cancel Setup',
        'Are you sure you want to cancel? Your progress will be lost.',
        [
          {
            text: 'Continue Setup',
            style: 'cancel',
          },
          {
            text: 'Cancel Setup',
            style: 'destructive',
            onPress: () => {
              // Reset authentication state to show GoogleSignIn component
              setOnboardingStage('none');
              signOut(); // This will reset authentication state and show GoogleSignIn
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.headerContainer}>
      {showBack && (
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <AntDesign name="arrowleft" size={24} color="#374151" />
        </TouchableOpacity>
      )}
      
      <View style={styles.spacer} />
      
      {showCancel && (
        <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
          <AntDesign name="close" size={24} color="#374151" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
    width: '100%',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  spacer: {
    flex: 1,
  },
});
