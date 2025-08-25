import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../store/userStore';

export function SplashScreen() {
  const setUserType = useUserStore((state) => state.setUserType);

  const handleLogin = (type: 'user' | 'therapist') => {
    setUserType(type);
  };

  return (
    <LinearGradient
      colors={['#EBF4FF', '#F3E8FF', '#FDF2F8']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
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
                Your confidential mental wellness companion
              </Text>
            </View>
            
            <View style={styles.optionsSection}>
              <Text style={styles.roleText}>Choose your role</Text>
              
              <View style={styles.buttonsContainer}>
                {/* User Button */}
                <TouchableOpacity 
                  style={styles.buttonWrapper}
                  onPress={() => handleLogin('user')}
                >
                  <LinearGradient
                    colors={['#60A5FA', '#A78BFA']}
                    style={styles.gradientButton}
                  >
                    <View style={styles.buttonContent}>
                      <MaterialCommunityIcons name="account" size={24} color="white" />
                      <View style={styles.buttonTextContainer}>
                        <Text style={styles.buttonTitle}>Continue as User</Text>
                        <Text style={styles.buttonDescription}>Access AI support & book therapist sessions</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
                
                {/* Therapist Button */}
                <TouchableOpacity 
                  style={styles.buttonWrapper}
                  onPress={() => handleLogin('therapist')}
                >
                  <LinearGradient
                    colors={['#A78BFA', '#F472B6']}
                    style={styles.gradientButton}
                  >
                    <View style={styles.buttonContent}>
                      <MaterialCommunityIcons name="stethoscope" size={24} color="white" />
                      <View style={styles.buttonTextContainer}>
                        <Text style={styles.buttonTitle}>Continue as Therapist</Text>
                        <Text style={styles.buttonDescription}>Manage clients & conduct therapy sessions</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
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
  roleText: {
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
  buttonTouchable: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  buttonTextContainer: {
    flex: 1,
        marginLeft: 10, 
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  buttonDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  privacySection: {
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});