import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../../store/userStore';
import { QuestionHeader } from './QuestionHeader';
import { StatusBar } from 'expo-status-bar';
export default function QuestionTen() {
  const setAuthenticated = useUserStore((s) => s.setAuthenticated);
  const setOnboardingStage = useUserStore((s) => s.setOnboardingStage);

  useEffect(() => {
<StatusBar hidden={true} />
  }, []);

  const handleOnboardingComplete = () => {
    setOnboardingStage('none');
    setAuthenticated(true);
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
              <Text style={styles.subtitle}>We'll use this to personalize your MindMate experience and provide you with the best possible support.</Text>
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

            <Pressable style={styles.buttonWrapper} onPress={handleOnboardingComplete}>
              {({ pressed }) => (
                <LinearGradient colors={['#34D399', '#60A5FA']} style={[styles.primaryButton, pressed && styles.primaryButtonPressed]}>
                  <Text style={styles.primaryButtonText}>Continue to MindMate</Text>
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
  primaryButton: { borderRadius: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButtonPressed: { opacity: 0.85 },
  primaryButtonText: { color: 'white', fontWeight: '600', fontSize: 14 },
});


