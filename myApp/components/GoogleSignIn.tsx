import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useUserStore } from '../store/userStore';

// Complete the auth session for proper cleanup
WebBrowser.maybeCompleteAuthSession();

export function GoogleSignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setUser, setAuthenticated } = useUserStore();

  // For Expo development, we'll use a temporary solution
  const handleWebSignIn = async () => {
    setLoading(true);
    try {
      // For now, let's create a mock user for testing purposes
      // You can replace this with actual Google authentication once properly configured
      Alert.alert(
        'Demo Mode',
        'For demonstration purposes, we\'ll create a test user. In production, this will use Google authentication.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setLoading(false),
          },
          {
            text: 'Continue',
            onPress: () => {
              // Create a demo user
              setUser({
                id: String(Date.now()),
                email: 'demo@mindmate.com',
                name: 'Demo User',
                photoURL: null,
              });
              setAuthenticated(true);
              router.replace('/(tabs)');
              setLoading(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Error', 'Failed to initiate sign in');
      setLoading(false);
    }
  };

  const openGoogleSetupInstructions = () => {
    Alert.alert(
      'Google OAuth Setup Required',
      'To enable Google Sign-In, you need to:\n\n1. Go to Google Cloud Console\n2. Create a Web Application OAuth client\n3. Add redirect URIs\n4. Update the client ID in the code\n\nFor now, you can use the demo mode to test the app.',
      [
        {
          text: 'Open Google Console',
          onPress: () => Linking.openURL('https://console.cloud.google.com/apis/credentials'),
        },
        {
          text: 'Use Demo Mode',
          onPress: handleWebSignIn,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🔐 Sign in to MindMate</Text>
        <Text style={styles.subtitle}>
          Please sign in with your Google account to continue and access your personalized mental wellness journey.
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.googleButton, loading && styles.googleButtonDisabled]}
            onPress={openGoogleSetupInstructions}
            disabled={loading}
          >
            <View style={styles.googleIcon}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.buttonText}>
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.demoButton}
            onPress={handleWebSignIn}
            disabled={loading}
          >
            <Text style={styles.demoButtonText}>
              Use Demo Mode (For Testing)
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.privacyText}>
          By signing in, you agree to our privacy policy and terms of service.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonDisabled: {
    backgroundColor: '#ccc',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  privacyText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
  debugButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    marginBottom: 15,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  demoButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  demoButtonText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
