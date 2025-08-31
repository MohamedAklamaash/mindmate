import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../../store/userStore';
import { saveTherapistData } from '../../../services/firebaseService';

export default function TherapistQuestionScreen() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setOnboardingStage = useUserStore((s) => s.setOnboardingStage);
  const setUser = useUserStore((s) => s.setUser);
  const setAuthenticated = useUserStore((s) => s.setAuthenticated);

  const handleContinue = async () => {
    if (name.trim().length === 0 || password.trim().length < 6) {
      Alert.alert('Invalid Input', 'Please enter your name and a password of at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const therapistData = { name: name.trim(), password };
      const therapistId = await saveTherapistData(therapistData);
      
      setUser({
        id: therapistId,
        name: name.trim(),
        email: null,
        photoURL: null,
        firestoreId: therapistId,
      });

      setAuthenticated(true);
      setOnboardingStage('none');

      Alert.alert('Success', 'Your therapist profile has been created.');

    } catch (error) {
      console.error('Error saving therapist data: ', error);
      Alert.alert('Error', 'Failed to create your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#EBF4FF', '#F3E8FF', '#FDF2F8']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <View style={styles.contentWrapper}>
            <View style={styles.headerSection}>
              <LinearGradient colors={['#60A5FA', '#A78BFA']} style={styles.iconContainer}>
                <MaterialCommunityIcons name="account-tie" size={40} color="white" />
              </LinearGradient>
              <Text style={styles.title}>Therapist Profile</Text>
              <Text style={styles.subtitle}>Create your professional profile</Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create a secure password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>
            
            <Pressable 
              style={({ pressed }) => [styles.continueButton, (isLoading || name.trim().length === 0 || password.trim().length < 6) && styles.disabledButton, pressed && styles.pressedButton]} 
              onPress={handleContinue}
              disabled={isLoading || name.trim().length === 0 || password.trim().length < 6}
            >
              {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Continue</Text>}
            </Pressable>
          </View>
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
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 8,
  },
  formSection: {
    width: '100%',
    marginBottom: 30,
  },
  inputBlock: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  continueButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 50,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabledButton: {
    backgroundColor: '#A5B4FC',
  },
  pressedButton: {
    opacity: 0.8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
