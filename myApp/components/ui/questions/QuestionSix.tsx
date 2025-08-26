import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../../store/userStore';
import { QuestionHeader } from './QuestionHeader';
import { StatusBar } from 'expo-status-bar';

const OPTIONS = [
  { id: 'always', label: 'Yes, always' },
  { id: 'sometimes', label: 'Sometimes, depends' },
  { id: 'rarely', label: 'Rarely / No' },
];

export default function QuestionSix() {
  const [value, setValue] = useState<string | null>(null);
  const disabled = useMemo(() => !value, [value]);
  const setOnboardingStage = useUserStore((s) => s.setOnboardingStage);

  useEffect(() => {
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
              <LinearGradient colors={['#60A5FA', '#14B8A6']} style={styles.iconContainer}>
                <MaterialCommunityIcons name="account-group" size={40} color="white" />
              </LinearGradient>
              <Text style={styles.title}>Do you have support?</Text>
              <Text style={styles.subtitle}>Do you have someone you trust to share your feelings with?</Text>
            </View>

            <View style={styles.optionsSection}>
              {OPTIONS.map((o) => {
                const isActive = value === o.id;
                return (
                  <Pressable key={o.id} style={styles.optionWrapper} onPress={() => setValue(o.id)}>
                    {({ pressed }) => (
                      <LinearGradient
                        colors={isActive ? ['#60A5FA', '#14B8A6'] : ['#ffffff', '#ffffff']}
                        style={[styles.option, isActive ? styles.optionActive : styles.optionInactive, pressed && styles.optionPressed]}
                      >
                        <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>{o.label}</Text>
                      </LinearGradient>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Pressable disabled={disabled} style={styles.buttonWrapper} onPress={() => setOnboardingStage('questionSeven')}>
              {({ pressed }) => (
                <LinearGradient colors={['#60A5FA', '#14B8A6']} style={[styles.primaryButton, (pressed || disabled) && styles.primaryButtonPressed]}>
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


