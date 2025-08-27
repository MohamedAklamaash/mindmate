import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../../store/userStore';
import { useAnswerStore } from './AnswerManager';
import { QuestionHeader } from './QuestionHeader';

type SignupMethod = 'email' | 'oauth' | 'none';

type NicknameInputScreenProps = {
  signupMethod?: SignupMethod;
  onComplete?: (params: { nickname: string; email?: string }) => void;
};

export default function NicknameInputScreen({ signupMethod = 'none', onComplete }: NicknameInputScreenProps) {
  const [userEmail, setUserEmail] = useState('');
  const [userNickname, setUserNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, setUser } = useUserStore();
  const setNeedsNickname = useUserStore((s) => s.setNeedsNickname);
  const setOnboardingStage = useUserStore((s) => s.setOnboardingStage);
  const setUserName = useAnswerStore((s) => s.setUserName);

  // Set onboarding stage to 'namePage' when component mounts
  useEffect(() => {
    setOnboardingStage('namePage');
  }, [setOnboardingStage]);

  const isPrimaryDisabled = useMemo(() => {
    const hasNickname = userNickname.trim().length > 0;
    if (signupMethod === 'email') {
      return !hasNickname || userEmail.trim().length === 0 || isLoading;
    }
    return !hasNickname || isLoading;
  }, [signupMethod, userEmail, userNickname, isLoading]);

  const handleSignupComplete = async () => {
    if (isPrimaryDisabled) return;
    
    setIsLoading(true);
    
    try {
      // Save the user's name to the AnswerManager
      setUserName(userNickname.trim());

      // Update the user store with the new information
      if (user) {
        setUser({
          ...user,
          name: userNickname.trim(),
          email: signupMethod === 'email' ? userEmail.trim() : user?.email || null,
        });
      }

      // Call the completion callback
      onComplete?.({ 
        nickname: userNickname.trim(), 
        email: (signupMethod === 'email' ? userEmail.trim() : user?.email) || undefined 
      });

      // Advance to Question One
      setNeedsNickname(false);
      setOnboardingStage('questionOne');
      
    } catch (error) {
      console.error('Error processing nickname: ', error);
      Alert.alert(
        'Error', 
        'Failed to save your information. Please try again.',
        [
          { text: 'Retry', onPress: handleSignupComplete },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#EBF4FF', '#F3E8FF', '#FDF2F8']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <QuestionHeader />
        <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.contentWrapper}>
              <View style={styles.headerSection}>
                <LinearGradient colors={['#60A5FA', '#A78BFA']} style={styles.iconContainer}>
                  <MaterialCommunityIcons name="heart-outline" size={40} color="white" />
                </LinearGradient>
                <Text style={styles.title}>How Can I Call You?</Text>
                <Text style={styles.subtitle}>Choose a nickname that makes you feel comfortable</Text>
              </View>

              <View style={styles.formSection}>
                {signupMethod === 'email' && (
                  <View style={styles.inputBlock}>
                    <TextInput
                      value={userEmail}
                      onChangeText={setUserEmail}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.input}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                )}

                <View style={styles.inputBlock}>
                  <TextInput
                    value={userNickname}
                    onChangeText={setUserNickname}
                    placeholder="Enter your nickname"
                    style={styles.input}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <Pressable onPress={handleSignupComplete} disabled={isPrimaryDisabled} style={styles.buttonWrapper}>
                  {({ pressed }) => (
                    <LinearGradient
                      colors={['#60A5FA', '#A78BFA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.primaryButton, (pressed || isPrimaryDisabled) && styles.primaryButtonPressed]}
                    >
                      <Text style={styles.primaryButtonText}>
                        {isLoading ? 'Saving...' : 'Continue'}
                      </Text>
                    </LinearGradient>
                  )}
                </Pressable>
              </View>

              <View style={styles.footerSection}>
                <Text style={styles.footerText}>Your information is safe and confidential with us</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  contentWrapper: {
    maxWidth: 340,
    width: '100%',
    alignSelf: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  inputBlock: {
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E9D5FF',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  buttonWrapper: {
    width: '100%',
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});


