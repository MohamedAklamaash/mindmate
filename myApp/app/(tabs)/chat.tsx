import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUserStore } from '@/store/userStore';

export default function ChatScreen() {
  const userType = useUserStore((state) => state.userType);

  // Add debugging to track when component renders and what userType value is
  useEffect(() => {
    console.log('HomeScreen rendered with userType:', userType);
  }, [userType]);

  // Force a more visible welcome message
  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>
        {userType === 'user' ? 'Welcome To the Chat Screen!' : userType === 'therapist' ? 'Welcome Therapist!' : 'Please select a user type'}
      </Text>
      
      {/* Add this to confirm the current userType value */}
      <Text style={styles.debugText}>Current user type: {userType || 'not set'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5', // Light background to make text more visible
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#007AFF',
    marginBottom: 20,
  },
  debugText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
});