import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../../store/userStore';
import { useAnswerStore } from './AnswerManager';
import { saveUserWithAnswers, updateUserAnswers } from '../../../services/firebaseService';
import { QuestionHeader } from './QuestionHeader';
import { StatusBar } from 'expo-status-bar';
export default function QuestionTen() {
  const [isLoading, setIsLoading] = useState(false);
  const setAuthenticated = useUserStore((s) => s.setAuthenticated);
  const setOnboardingStage = useUserStore((s) => s.setOnboardingStage);
  const setUserFirestoreId = useUserStore((s) => s.setUserFirestoreId);
  const user = useUserStore((s) => s.user);
  const getAllAnswers = useAnswerStore((s) => s.getAllAnswers);
  const clearAnswers = useAnswerStore((s) => s.clearAnswers);

  useEffect(() => {
<StatusBar hidden={true} />
  }, []);

  const handleOnboardingComplete = async () => {
    if (!user) {
      Alert.alert('Error', 'User data not found. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
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
      
      // Clear the answers from the store
      clearAnswers();
      
      // Complete onboarding
      setOnboardingStage('none');
      setAuthenticated(true);
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert(
        'Error', 
        'Failed to save your data. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: handleOnboardingComplete },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient  colors={['#EBF4FF', '#F3E8FF', '#FDF2F8']}style={styles.container}>
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
                <Text style={styles.listItem}>• Personalized wellness recommendations</Text>
                <Text style={styles.listItem}>• Mood tracking and insights</Text>
                <Text style={styles.listItem}>• Access to licensed therapists</Text>
                <Text style={styles.listItem}>• Crisis support when needed</Text>
              </View>
            </View>

            <Pressable 
              style={[styles.buttonWrapper, isLoading && styles.buttonDisabled]} 
              onPress={handleOnboardingComplete}
              disabled={isLoading}
            >
              {({ pressed }) => (
                <LinearGradient colors={['#34D399', '#60A5FA']} style={[styles.primaryButton, (pressed || isLoading) && styles.primaryButtonPressed]}>
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'Saving...' : 'Continue to Witty Mate'}
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


