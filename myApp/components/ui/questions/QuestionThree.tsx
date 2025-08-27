import React, { useEffect, useMemo, useState } from 'react';
import {  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../../store/userStore';
import { useAnswerStore } from './AnswerManager';
import { QuestionHeader } from './QuestionHeader';
import { StatusBar } from 'expo-status-bar';
const OPTIONS = [
  { id: 'high', label: 'High and active' },
  { id: 'updown', label: 'Up and down' },
  { id: 'tired', label: 'Tired most of the time' },
];

export default function QuestionThree() {
  const [value, setValue] = useState<string | null>(null);
  const disabled = useMemo(() => !value, [value]);
  const setOnboardingStage = useUserStore((s) => s.setOnboardingStage);
  const setQuestionThreeAnswer = useAnswerStore((s) => s.setQuestionThreeAnswer);
  
  const handleContinue = () => {
    if (value) {
      // Save the answer to the store
      setQuestionThreeAnswer(value);
      // Navigate to next question
      setOnboardingStage('questionFour');
    }
  };
  
     useEffect(() => {
    // Hide the status bar on mount
<StatusBar hidden={true} />
  }, []);
  return (
    <LinearGradient colors={['#f3e7d2ff','#dfc088ff', '#f7eed0ff']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar hidden={true} />
        <QuestionHeader />
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.contentWrapper}>
            <View style={styles.headerSection}>
              <LinearGradient colors={['#F59E0B', '#FCD34D']} style={styles.iconContainer}>
                <MaterialCommunityIcons name="battery" size={40} color="white" />
              </LinearGradient>
              <Text style={styles.title}>How is your energy level lately?</Text>
              <Text style={styles.subtitle}>This will help us provide better guidance.</Text>
            </View>

            <View style={styles.optionsSection}>
              {OPTIONS.map((o) => {
                const isActive = value === o.id;
                return (
                  <Pressable key={o.id} style={styles.optionWrapper} onPress={() => setValue(o.id)}>
                    {({ pressed }) => (
                      <LinearGradient
                        colors={isActive ? ['#F59E0B', '#FCD34D'] : ['#ffffff', '#ffffff']}
                        style={[styles.option, isActive ? styles.optionActive : styles.optionInactive, pressed && styles.optionPressed]}
                      >
                        <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>{o.label}</Text>
                      </LinearGradient>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Pressable disabled={disabled} style={styles.buttonWrapper} onPress={handleContinue}>
              {({ pressed }) => (
                <LinearGradient colors={['#F59E0B', '#FCD34D']} style={[styles.primaryButton, (pressed || disabled) && styles.primaryButtonPressed]}>
                  <Text style={styles.primaryButtonText}>Continue</Text>
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
  optionsSection: { gap: 10, marginBottom: 16 },
  optionWrapper: { width: '100%' },
  option: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  optionInactive: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  optionActive: { borderColor: 'transparent' },
  optionPressed: { opacity: 0.9 },
  optionLabel: { fontSize: 14, color: '#374151', textAlign: 'center' },
  optionLabelActive: { color: 'white' },
  buttonWrapper: { width: '100%', marginTop: 10 },
  primaryButton: { borderRadius: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButtonPressed: { opacity: 0.6 },
  primaryButtonText: { color: 'white', fontWeight: '600', fontSize: 14 },
});


