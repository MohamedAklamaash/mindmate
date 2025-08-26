import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useUserStore } from '../store/userStore';
import { StatusBar } from 'expo-status-bar';
// Complete the auth session for proper cleanup
WebBrowser.maybeCompleteAuthSession();

export function GoogleSignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setUser, setAuthenticated, setUserType, setNeedsNickname } = useUserStore();
  const extra = (Constants.expoConfig?.extra || {}) as any;
  const ANDROID_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || extra.GOOGLE_ANDROID_CLIENT_ID;
  const IOS_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || extra.GOOGLE_IOS_CLIENT_ID;
  const WEB_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || extra.GOOGLE_WEB_CLIENT_ID;
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ANDROID_ID,
    iosClientId: IOS_ID,
    webClientId: WEB_ID,
    scopes: ['openid', 'profile', 'email'],
  });
   useEffect(() => {
      // Hide the status bar on mount
<StatusBar hidden={true} />
      GoogleSignin.configure({
        webClientId: WEB_ID || undefined,
        offlineAccess: false,
      });
    }, []);

  useEffect(() => {
    const completeLogin = async () => {
      if (response?.type === 'success') {
        try {
          const accessToken = response.authentication?.accessToken;
          if (!accessToken) return;
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const profile = await res.json();
          setUser({
            id: profile.sub ?? String(Date.now()),
            email: profile.email ?? null,
            name: profile.name ?? null,
            photoURL: profile.picture ?? null,
          });
          // Collect nickname next
          setAuthenticated(false);
          setNeedsNickname(true);
        } catch (e) {
          console.error('Failed to fetch user info', e);
          Alert.alert('Error', 'Could not complete Google Sign-In');
        } finally {
          setLoading(false);
        }
      } else if (response?.type === 'error') {
        setLoading(false);
        Alert.alert('Sign-In cancelled');
      }
    };
    completeLogin();
  }, [response]);

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
              // In demo mode, go straight to the welcome screen
              setAuthenticated(true);
              setNeedsNickname(false);
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

  const openGoogleSetupInstructions = async () => {
    if (!ANDROID_ID) {
      // Fallback to Google Play Services sign-in using google-services.json
      try {
        setLoading(true);
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const result = (await GoogleSignin.signIn()) as any;
        const profile = result?.user ?? result;
        setUser({
          id: profile.id || String(Date.now()),
          email: profile.email || null,
          name: profile.name || null,
          photoURL: (profile.photo as any) || null,
        });
        setAuthenticated(false);
        setNeedsNickname(true);
      } catch (e) {
        console.error('GoogleSignIn (native) failed', e);
        Alert.alert('Error', 'Failed to sign in with Google on device');
      } finally {
        setLoading(false);
      }
      return;
    }
    try {
      setLoading(true);
      await promptAsync();
    } catch (e) {
      console.error('Google prompt failed', e);
      Alert.alert('Error', 'Failed to open Google Sign-In');
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    // Reset user type to show SplashScreen
    setUserType(null as any);
  };

  return (
    <LinearGradient
      colors={['#EBF4FF', '#F3E8FF', '#FDF2F8']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar hidden={true} />
        {/* Back Button */}
        <View style={styles.headerContainer}>
          <Pressable 
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            onPress={handleBackPress}
          >
            <AntDesign name="close" size={24} color="#374151" />
          </Pressable>
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.headerSection}>
              {/* Heart Icon Container */}
              <LinearGradient
                colors={['#60A5FA', '#A78BFA']}
                style={styles.iconContainer}
              >
                <AntDesign name="hearto" size={40} color="white" />
              </LinearGradient>
              
              <Text style={styles.title}>Welcome to MindMate</Text>
              <Text style={styles.subtitle}>
                Let's get you started on your wellness journey
              </Text>
            </View>
            
            <View style={styles.optionsSection}>
              <Text style={styles.signupText}>How would you like to sign up?</Text>
              
              <View style={styles.buttonsContainer}>
                {/* Google Sign-in Button */}
                <Pressable 
                  style={styles.buttonWrapper}
                  onPress={openGoogleSetupInstructions}
                  disabled={loading}
                >
                  {({ pressed }) => (
                    <LinearGradient
                      colors={['#60A5FA', '#A78BFA']}
                      style={[styles.gradientButton, loading && styles.gradientButtonDisabled, pressed && styles.gradientButtonPressed]}
                    >
                      <View style={styles.buttonContent}>
                        <AntDesign name="google" size={24} color="white" />
                        <Text style={styles.buttonTitle}>
                          {loading ? 'Signing in...' : 'Continue with Google'}
                        </Text>
                      </View>
                    </LinearGradient>
                  )}
                </Pressable>
                
                {/* Demo Mode Button */}
                <Pressable 
                  style={styles.buttonWrapper}
                  onPress={handleWebSignIn}
                  disabled={loading}
                >
                  {({ pressed }) => (
                    <LinearGradient
                      colors={['#A78BFA', '#F472B6']}
                      style={[styles.gradientButton, loading && styles.gradientButtonDisabled, pressed && styles.gradientButtonPressed]}
                    >
                      <View style={styles.buttonContent}>
                        <AntDesign name="user" size={24} color="white" />
                        <Text style={styles.buttonTitle}>Use Demo Mode (For Testing)</Text>
                      </View>
                    </LinearGradient>
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.privacyText}>
                By continuing, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>
          </View>
        </ScrollView>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonPressed: {
    opacity: 0.85,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 0,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  optionsSection: {
    width: '100%',
    marginVertical: 20,
  },
  signupText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsContainer: {
    gap: 16,
  },
  buttonWrapper: {
    width: '100%',
  },
  gradientButton: {
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientButtonPressed: {
    opacity: 0.85,
  },
  gradientButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  privacySection: {
    alignItems: 'center',
    marginTop: 32,
  },
  privacyText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});
