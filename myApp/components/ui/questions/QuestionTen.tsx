import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert, NativeModules } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useUserStore } from '../../../store/userStore';
import { useAnswerStore } from './AnswerManager';
import { saveUserWithAnswers, updateUserAnswers } from '../../../services/firebaseService';
import { QuestionHeader } from './QuestionHeader';
import { StatusBar } from 'expo-status-bar';

const { UsageModule } = NativeModules;
export default function QuestionTen() {
  const [isLoading, setIsLoading] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const setAuthenticated = useUserStore((s) => s.setAuthenticated);
  const setOnboardingStage = useUserStore((s) => s.setOnboardingStage);
  const setUserFirestoreId = useUserStore((s) => s.setUserFirestoreId);
  const setUserId = useUserStore((s) => s.setUserId);
  const user = useUserStore((s) => s.user);
  const getAllAnswers = useAnswerStore((s) => s.getAllAnswers);
  const clearAnswers = useAnswerStore((s) => s.clearAnswers);

  useEffect(() => {
    // StatusBar configuration should be done properly
  }, []);

  // Function to request microphone permission
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      console.log('Requesting microphone permission...');
      const permission = await Audio.requestPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert(
          'Microphone Permission Required',
          'This app needs microphone access to provide voice chat functionality. Please grant permission in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => console.log('Open Settings') }
          ]
        );
        return false;
      }
      
      console.log('Microphone permission granted');
      return true;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  };

  // Function to check and optionally request app usage permission
  const requestAppUsagePermission = async (): Promise<boolean> => {
    try {
      if (!UsageModule) {
        console.log('Usage module not available');
        return true; // Don't block if module is not available
      }

      console.log('Checking app usage permission...');
      const hasPermission = await UsageModule.hasUsageStatsPermission();
      
      if (!hasPermission) {
        Alert.alert(
          'Optional: App Usage Insights',
          'For personalized digital wellness insights, we can analyze your app usage patterns. This permission is optional and can be granted later.\n\nNote: You\'ll need to manually enable this in Android Settings.',
          [
            { 
              text: 'Skip for Now', 
              style: 'cancel',
              onPress: () => console.log('User skipped usage permission')
            },
            { 
              text: 'Enable Now', 
              onPress: () => {
                console.log('Opening usage settings...');
                UsageModule.openUsageSettings();
                Alert.alert(
                  'Settings Opened',
                  'Please find "WittyMate" or your app name in the list and toggle it ON. Then press back to return to the app.',
                  [{ text: 'OK' }]
                );
              }
            }
          ]
        );
        return true; // Don't block onboarding if user skips
      }
      
      console.log('App usage permission already granted');
      return true;
    } catch (error) {
      console.error('Error requesting app usage permission:', error);
      return true; // Don't block if there's an error
    }
  };

  // Function to request all required permissions
  const requestAllPermissions = async (): Promise<boolean> => {
    try {
      console.log('Starting permission requests...');
      
      // Request microphone permission first
      const micGranted = await requestMicrophonePermission();
      
      // Request app usage permission
      const usageGranted = await requestAppUsagePermission();
      
      // Both permissions should be granted for full functionality
      // But we won't block the user if usage permission is not granted
      const allGranted = micGranted && usageGranted;
      
      console.log(`Permissions status - Mic: ${micGranted}, Usage: ${usageGranted}, All: ${allGranted}`);
      
      return micGranted; // Only require microphone permission as mandatory
    } catch (error) {
      console.error('Error during permission requests:', error);
      return false;
    }
  };

  const handleOnboardingComplete = async () => {
    if (!user) {
      Alert.alert('Error', 'User data not found. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      // First, request all required permissions
      console.log('Requesting permissions before completing onboarding...');
      const permissionsOk = await requestAllPermissions();
      
      if (!permissionsOk) {
        Alert.alert(
          'Permissions Required',
          'Some permissions are required for the app to work properly. You can grant them later in app settings if needed.',
          [
            { text: 'Continue Anyway', onPress: () => proceedWithOnboarding() },
            { text: 'Try Again', onPress: handleOnboardingComplete }
          ]
        );
        return;
      }

      // Proceed with onboarding after permissions are granted
      await proceedWithOnboarding();
      
    } catch (error) {
      console.error('Error during onboarding completion:', error);
      Alert.alert(
        'Error', 
        'Failed to complete setup. Please try again.',
        [
          { text: 'Retry', onPress: handleOnboardingComplete },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const proceedWithOnboarding = async () => {
    try {
      if (!user) {
        throw new Error('User data not available');
      }

      // Get all answers from the store
      const answers = getAllAnswers();
      
      // Prepare user data for Firestore using the name from answers
      const userData = {
        nickname: answers.userName || user.name || 'User',
        email: user.email,
        userType: 'user' as const,
        isActive: true,
      };

      let firestoreId: string;
      
      // Check if user already has a Firestore ID (update) or create new
      if (user.firestoreId) {
        await updateUserAnswers(user.firestoreId, answers);
        firestoreId = user.firestoreId;
      } else {
        // Save new user with answers to Firestore
        firestoreId = await saveUserWithAnswers(userData, answers);
        // Update the user store with the Firestore ID
        setUserFirestoreId(firestoreId);
      }

      console.log('User data and answers saved successfully:', firestoreId);
      
      // Store the Firestore ID as persistent u_id that won't be deleted unless app is uninstalled
      setUserId(firestoreId);
      console.log('Stored persistent user ID (u_id):', firestoreId);
      
      // Clear the answers from the store
      clearAnswers();
      
      // Mark permissions as granted (for future checks if needed)
      setPermissionsGranted(true);
      
      // Complete onboarding
      setOnboardingStage('none');
      setAuthenticated(true);
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error; // Re-throw to be handled by caller
    }
  };

  return (
    <LinearGradient colors={['#e0faf1ff','#c6fae6ff', '#dbe7f7ff']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar hidden={true} />
        <QuestionHeader />
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.contentWrapper}>
            <View style={styles.headerSection}>
              <LinearGradient colors={['#34D399', '#60A5FA']} style={styles.iconContainer}>
                <MaterialCommunityIcons name="check-circle-outline" size={40} color="white" />
              </LinearGradient>
              <Text style={styles.title}>Thanks for sharing!</Text>
              <Text style={styles.subtitle}>We'll use this to personalize your Witty Mate experience and provide you with the best possible support.</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your personalized journey includes:</Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• AI companion tailored to your preferences</Text>
                <Text style={styles.listItem}>• Voice chat functionality (microphone access)</Text>
                <Text style={styles.listItem}>• Personalized app usage insights</Text>
                <Text style={styles.listItem}>• Mood tracking and wellness recommendations</Text>
                <Text style={styles.listItem}>• Access to licensed therapists</Text>
                <Text style={styles.listItem}>• Crisis support when needed</Text>
              </View>
            </View>

            <View style={[styles.card, { marginTop: 12 }]}>
              <Text style={styles.cardTitle}>Permissions:</Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• <Text style={{ fontWeight: 'bold' }}>Microphone</Text> (Required) - For voice chat with your AI companion</Text>
                <Text style={styles.listItem}>• <Text style={{ fontWeight: 'bold' }}>App Usage Access</Text> (Optional) - For personalized digital wellness insights</Text>
              </View>
              <Text style={[styles.listItem, { marginTop: 8, fontSize: 11, fontStyle: 'italic' }]}>
                Required permissions will show a system dialog. Optional permissions require manual setup in Android Settings.
              </Text>
            </View>

            <Pressable 
              style={[styles.buttonWrapper, isLoading && styles.buttonDisabled]} 
              onPress={handleOnboardingComplete}
              disabled={isLoading}
            >
              {({ pressed }) => (
                <LinearGradient colors={['#34D399', '#60A5FA']} style={[styles.primaryButton, (pressed || isLoading) && styles.primaryButtonPressed]}>
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'Setting up...' : 'Grant Permissions & Continue'}
                  </Text>
                </LinearGradient>
              )}
            </Pressable>
          </View>
        </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16 },
  contentWrapper: { maxWidth: 340, width: '100%', alignSelf: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 16 },
  iconContainer: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 20, color: '#1F2937', textAlign: 'center', marginBottom: 6, fontWeight: '700' },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
  card: { marginTop: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.8)', padding: 16 },
  cardTitle: { color: '#1F2937', fontSize: 14, marginBottom: 8 },
  list: { gap: 6 },
  listItem: { color: '#374151', fontSize: 12 },
  buttonWrapper: { width: '100%', marginTop: 16 },
  buttonDisabled: { opacity: 0.6 },
  primaryButton: { borderRadius: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButtonPressed: { opacity: 0.85 },
  primaryButtonText: { color: 'white', fontWeight: '600', fontSize: 14 },
});


