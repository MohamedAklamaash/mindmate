import React, { useEffect, useMemo, useState } from 'react';
import {  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../../store/userStore';
import { useAnswerStore } from './AnswerManager';
import { QuestionHeader } from './QuestionHeader';
import { StatusBar } from 'expo-status-bar';
type StressItem = { id: string; label: string; icon: string };

const STRESS_ITEMS: StressItem[] = [
  { id: 'studies', label: 'Studies / Exams', icon: '🎓' },
  { id: 'family', label: 'Family / Parental expectations', icon: '👨‍👩‍👧' },
  { id: 'relationships', label: 'Relationships / Friendships', icon: '❤️' },
  { id: 'career', label: 'Career / Future', icon: '💼' },
  { id: 'finances', label: 'Finances / Money', icon: '💰' },
  { id: 'confidence', label: 'Self-confidence / Motivation', icon: '💭' },
  { id: 'anxiety', label: 'Anxiety / Overthinking', icon: '🧠' },
  { id: 'sadness', label: 'Feeling sad / low', icon: '😞' },
  { id: 'habits', label: 'Habits / Addictions', icon: '🚬' },
];

export function QuestionOne() {
  const [selected, setSelected] = useState<string[]>([]);
  const [other, setOther] = useState('');
  const setOnboardingStage = useUserStore((s) => s.setOnboardingStage);
  const setQuestionOneAnswer = useAnswerStore((s) => s.setQuestionOneAnswer);
  
  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const disabled = useMemo(() => selected.length === 0 && other.trim().length === 0, [selected, other]);
  
  const handleContinue = () => {
    // Save the answer to the store
    setQuestionOneAnswer(selected, other.trim());
    // Navigate to next question
    setOnboardingStage('questionTwo');
  };
  
 useEffect(() => {
    // Hide the status bar on mount
<StatusBar hidden={true} />
  }, []);
  return (
    <LinearGradient colors={['#EBF4FF', '#F3E8FF', '#FDF2F8']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar hidden={true} />
        <QuestionHeader />
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.contentWrapper}>
            <View style={styles.headerSection}>
              <LinearGradient colors={['#60A5FA', '#A78BFA']} style={styles.iconContainer}>
                <MaterialCommunityIcons name="heart-outline" size={40} color="white" />
              </LinearGradient>
              <Text style={styles.title}>What's stressing you most?</Text>
              <Text style={styles.subtitle}>Select all that apply. This helps us understand your current challenges.</Text>
            </View>

            <View style={styles.listSection}>
              {STRESS_ITEMS.map((s) => {
                const isActive = selected.includes(s.id);
                return (
                  <Pressable key={s.id} style={styles.optionWrapper} onPress={() => toggle(s.id)}>
                    {({ pressed }) => (
                      <LinearGradient
                        colors={isActive ? ['#60A5FA', '#A78BFA'] : ['#ffffff', '#ffffff']}
                        style={[styles.option, isActive ? styles.optionActive : styles.optionInactive, pressed && styles.optionPressed]}
                      >
                        <View style={styles.optionContent}>
                          <Text style={[styles.optionEmoji, isActive && styles.optionEmojiActive]}>{s.icon}</Text>
                          <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>{s.label}</Text>
                        </View>
                      </LinearGradient>
                    )}
                  </Pressable>
                );
              })}

              <View style={styles.otherWrapper}>
                <TextInput
                  value={other}
                  onChangeText={setOther}
                  placeholder="Other (please specify)"
                  style={styles.otherInput}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <Pressable disabled={disabled} style={styles.buttonWrapper} onPress={handleContinue}>
              {({ pressed }) => (
                <LinearGradient
                  colors={['#60A5FA', '#A78BFA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.primaryButton, (pressed || disabled) && styles.primaryButtonPressed]}
                >
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

export default QuestionOne;

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16 },
  contentWrapper: { maxWidth: 340, width: '100%', alignSelf: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 16 },
  iconContainer: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 20, color: '#1F2937', textAlign: 'center', marginBottom: 6, fontWeight: '700' },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
  listSection: { marginTop: 8, marginBottom: 16, gap: 10 },
  optionWrapper: { width: '100%' },
  option: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  optionInactive: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  optionActive: { borderColor: 'transparent' },
  optionPressed: { opacity: 0.9 },
  optionContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionEmoji: { fontSize: 18 },
  optionEmojiActive: { },
  optionLabel: { fontSize: 14, color: '#374151' },
  optionLabelActive: { color: 'white' },
  otherWrapper: { marginTop: 4 },
  otherInput: { borderRadius: 16, borderWidth: 2, borderColor: '#E5E7EB', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.9)' },
  buttonWrapper: { width: '100%', marginTop: 10 },
  primaryButton: { borderRadius: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', opacity: 1 },
  primaryButtonPressed: { opacity: 0.6 },
  primaryButtonText: { color: 'white', fontWeight: '600', fontSize: 14 },
});


