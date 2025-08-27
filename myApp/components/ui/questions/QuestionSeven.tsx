import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../../store/userStore';
import { useAnswerStore } from './AnswerManager';
import { QuestionHeader } from './QuestionHeader';
import { StatusBar } from 'expo-status-bar';
const OPTIONS = [
  { id: 'thisweek', label: 'This week' },
  { id: 'lastmonth', label: 'Last month' },
  { id: 'cantremember', label: "Can't remember" },
];

export default function QuestionSeven() {
  const [value, setValue] = useState<string | null>(null);
  const disabled = useMemo(() => !value, [value]);
  const setOnboardingStage = useUserStore((s) => s.setOnboardingStage);
  const setQuestionSevenAnswer = useAnswerStore((s) => s.setQuestionSevenAnswer);
  
  const handleContinue = () => {
    if (value) {
      // Save the answer to the store
      setQuestionSevenAnswer(value);
      // Navigate to next question
      setOnboardingStage('questionEight');
    }
  };

  useEffect(() => {
<StatusBar hidden={true} />
  }, []);

  return (
    <LinearGradient colors={['#d0c7ebff','#c2b0faff', '#c9dff9ff']}  style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar hidden={true} />
        <QuestionHeader />
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.contentWrapper}>
            <View style={styles.headerSection}>
              <LinearGradient colors={['#A78BFA', '#60A5FA']} style={styles.iconContainer}>
                <MaterialCommunityIcons name="emoticon-happy-outline" size={40} color="white" />
              </LinearGradient>
              <Text style={styles.title}>When did you last feel truly relaxed?</Text>
              <Text style={styles.subtitle}>This helps us understand your current state of mind.</Text>
            </View>

            <View style={styles.optionsSection}>
              {OPTIONS.map((o) => {
                const isActive = value === o.id;
                return (
                  <Pressable key={o.id} style={styles.optionWrapper} onPress={() => setValue(o.id)}>
                    {({ pressed }) => (
                      <LinearGradient
                        colors={isActive ? ['#A78BFA', '#60A5FA'] : ['#ffffff', '#ffffff']}
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
                <LinearGradient colors={['#A78BFA', '#60A5FA']} style={[styles.primaryButton, (pressed || disabled) && styles.primaryButtonPressed]}>
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



