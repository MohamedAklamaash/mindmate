import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../../store/userStore';
import { useAnswerStore } from './AnswerManager';
import { QuestionHeader } from './QuestionHeader';
import { StatusBar } from 'expo-status-bar';

type StyleOption = { id: 'supportive' | 'practical'; label: string; description: string };

const OPTIONS: StyleOption[] = [
  { id: 'supportive', label: 'Supportive & empathetic', description: 'Like a friend who listens' },
  { id: 'practical', label: 'Practical & solution-oriented', description: 'Like a coach who guides' },
];

export default function QuestionNine() {
  const [value, setValue] = useState<StyleOption['id'] | null>(null);
  const disabled = useMemo(() => !value, [value]);
  const setOnboardingStage = useUserStore((s) => s.setOnboardingStage);
  const setQuestionNineAnswer = useAnswerStore((s) => s.setQuestionNineAnswer);
  
  const handleContinue = () => {
    if (value) {
      // Save the answer to the store
      setQuestionNineAnswer(value);
      // Navigate to next question
      setOnboardingStage('questionTen');
    }
  };

  useEffect(() => {
<StatusBar hidden={true} />
  }, []);

  return (
    <LinearGradient colors={['#EBF4FF', '#F3E8FF', '#FDF2F8']}  style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar hidden={true} />
        <QuestionHeader />
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.contentWrapper}>
            <View style={styles.headerSection}>
              <LinearGradient colors={['#F472B6', '#A78BFA']} style={styles.iconContainer}>
                <MaterialCommunityIcons name="brain" size={40} color="white" />
              </LinearGradient>
              <Text style={styles.title}>How should I be?</Text>
              <Text style={styles.subtitle}>Do you prefer the AI to be more...</Text>
            </View>

            <View style={styles.optionsSection}>
              {OPTIONS.map((o) => {
                const isActive = value === o.id;
                return (
                  <Pressable key={o.id} style={styles.optionWrapper} onPress={() => setValue(o.id)}>
                    {({ pressed }) => (
                      <LinearGradient
                        colors={isActive ? ['#F472B6', '#A78BFA'] : ['#ffffff', '#ffffff']}
                        style={[styles.option, isActive ? styles.optionActive : styles.optionInactive, pressed && styles.optionPressed]}
                      >
                        <View style={styles.optionContent}>
                          <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>{o.label}</Text>
                          <Text style={[styles.optionDesc, isActive && styles.optionDescActive]}>{o.description}</Text>
                        </View>
                      </LinearGradient>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Pressable disabled={disabled} style={styles.buttonWrapper} onPress={handleContinue}>
              {({ pressed }) => (
                <LinearGradient colors={['#F472B6', '#A78BFA']} style={[styles.primaryButton, (pressed || disabled) && styles.primaryButtonPressed]}>
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
  option: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  optionInactive: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  optionActive: { borderColor: 'transparent' },
  optionPressed: { opacity: 0.9 },
  optionContent: { alignItems: 'center' },
  optionLabel: { fontSize: 14, color: '#374151' },
  optionLabelActive: { color: 'white' },
  optionDesc: { marginTop: 4, fontSize: 12, color: '#6B7280' },
  optionDescActive: { color: 'white', opacity: 0.75 },
  buttonWrapper: { width: '100%', marginTop: 10 },
  primaryButton: { borderRadius: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButtonPressed: { opacity: 0.6 },
  primaryButtonText: { color: 'white', fontWeight: '600', fontSize: 14 },
});


