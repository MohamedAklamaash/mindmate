import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../../store/userStore';
import { useAnswerStore } from './AnswerManager';
import { QuestionHeader } from './QuestionHeader';
import { StatusBar } from 'expo-status-bar';
type Goal = { id: string; label: string };

const GOALS: Goal[] = [
  { id: 'stress-relief', label: 'Stress relief & relaxation' },
  { id: 'focus', label: 'Better focus for studies/work' },
  { id: 'relationships', label: 'Healthy relationships & communication' },
  { id: 'confidence', label: 'Boost confidence & self-esteem' },
  { id: 'cope', label: 'Cope with anxiety or low mood' },
  { id: 'talk', label: 'Just need someone to talk to' },
];

export default function QuestionEight() {
  const [selected, setSelected] = useState<string[]>([]);
  const disabled = useMemo(() => selected.length === 0, [selected]);
  const setOnboardingStage = useUserStore((s) => s.setOnboardingStage);
  const setQuestionEightAnswer = useAnswerStore((s) => s.setQuestionEightAnswer);
  
  const handleContinue = () => {
    if (selected.length > 0) {
      // Save the answer to the store
      setQuestionEightAnswer(selected);
      // Navigate to next question
      setOnboardingStage('questionNine');
    }
  };

  useEffect(() => {
<StatusBar hidden={true} />
  }, []);

  const toggleGoal = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  return (
    <LinearGradient  colors={['#daf5ebff','#c3f4e2ff', '#d3e7feff']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar hidden={true} />
        <QuestionHeader />
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.contentWrapper}>
            <View style={styles.headerSection}>
              <LinearGradient colors={['#34D399', '#60A5FA']} style={styles.iconContainer}>
                <MaterialCommunityIcons name="target" size={40} color="white" />
              </LinearGradient>
              <Text style={styles.title}>What do you hope to gain?</Text>
              <Text style={styles.subtitle}>Select all that you hope to achieve using this app.</Text>
            </View>

            <View style={styles.optionsSection}>
              {GOALS.map((g) => {
                const isActive = selected.includes(g.id);
                return (
                  <Pressable key={g.id} style={styles.optionWrapper} onPress={() => toggleGoal(g.id)}>
                    {({ pressed }) => (
                      <LinearGradient
                        colors={isActive ? ['#34D399', '#60A5FA'] : ['#ffffff', '#ffffff']}
                        style={[styles.option, isActive ? styles.optionActive : styles.optionInactive, pressed && styles.optionPressed]}
                      >
                        <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>{g.label}</Text>
                      </LinearGradient>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Pressable disabled={disabled} style={styles.buttonWrapper} onPress={handleContinue}>
              {({ pressed }) => (
                <LinearGradient colors={['#34D399', '#60A5FA']} style={[styles.primaryButton, (pressed || disabled) && styles.primaryButtonPressed]}>
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


