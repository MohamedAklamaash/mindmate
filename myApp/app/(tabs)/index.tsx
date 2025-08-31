import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '@/store/userStore';
import { updateTherapistDescription, getTherapistData } from '@/services/firebaseService';

export default function HomeScreen() {
  const user = useUserStore((state) => state.user);
  const userType = useUserStore((state) => state.userType);
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fetch therapist's existing data when component mounts
  useEffect(() => {
    const fetchTherapistData = async () => {
      if (userType === 'therapist' && user?.firestoreId) {
        try {
          const therapistData = await getTherapistData(user.firestoreId);
          if (therapistData.description) {
            setDescription(therapistData.description);
          }
        } catch (error) {
          console.error('Error fetching therapist data:', error);
        } finally {
          setIsLoadingData(false);
        }
      } else {
        setIsLoadingData(false);
      }
    };

    fetchTherapistData();
  }, [userType, user?.firestoreId]);

  // Add debugging to track when component renders and what userType value is
  useEffect(() => {
    console.log('HomeScreen rendered with userType:', userType);
    console.log('User object:', user);
  }, [userType, user]);

  const handleSaveDescription = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!user?.firestoreId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    setIsLoading(true);
    try {
      await updateTherapistDescription(user.firestoreId, description.trim());
      Alert.alert('Success', 'Description saved successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving description:', error);
      Alert.alert('Error', 'Failed to save description. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Restore the original description when canceling
    setIsEditing(false);
    // Refetch the original description from Firebase
    if (user?.firestoreId) {
      getTherapistData(user.firestoreId)
        .then((therapistData) => {
          setDescription(therapistData.description || '');
        })
        .catch((error) => {
          console.error('Error fetching original description:', error);
        });
    }
  };

  // Render therapist home screen with description input
  if (userType === 'therapist') {
    return (
      <LinearGradient colors={['#EBF4FF', '#F3E8FF', '#FDF2F8']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <View style={styles.headerSection}>
                <LinearGradient colors={['#60A5FA', '#A78BFA']} style={styles.iconContainer}>
                  <MaterialCommunityIcons name="account-tie" size={40} color="white" />
                </LinearGradient>
                <Text style={styles.welcomeText}>
                  Welcome {user?.name || 'Therapist'}!
                </Text>
                <Text style={styles.subtitle}>Professional Dashboard</Text>
              </View>

              <View style={styles.descriptionSection}>
                <View style={styles.descriptionHeader}>
                  <Text style={styles.sectionTitle}>Professional Description</Text>
                  {!isEditing && (
                    <Pressable onPress={() => setIsEditing(true)} style={styles.editButton}>
                      <MaterialCommunityIcons name="pencil" size={20} color="#4F46E5" />
                    </Pressable>
                  )}
                </View>

                {isEditing ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.descriptionInput}
                      placeholder="Tell patients about your experience, specializations, and approach to therapy..."
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                    />
                    <View style={styles.buttonContainer}>
                      <Pressable 
                        style={[styles.button, styles.cancelButton]} 
                        onPress={handleCancelEdit}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </Pressable>
                      <Pressable 
                        style={[styles.button, styles.saveButton, isLoading && styles.disabledButton]} 
                        onPress={handleSaveDescription}
                        disabled={isLoading}
                      >
                        <Text style={styles.saveButtonText}>
                          {isLoading ? 'Saving...' : 'Save'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.descriptionDisplay}>
                    {isLoadingData ? (
                      <Text style={styles.loadingText}>Loading description...</Text>
                    ) : (
                      <Text style={styles.descriptionText}>
                        {description || 'Tap the edit button to add your professional description'}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Render user home screen (existing design)
  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>
        {user?.name ? `Welcome ${user.name}!` : 'Welcome User!'}
      </Text>
      
      {/* Add this to confirm the current userType value */}
      <Text style={styles.debugText}>Current user type: {userType || 'not set'}</Text>
      <Text style={styles.debugText}>Current user name: {user?.name || 'not set'}</Text>
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
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  descriptionSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  editContainer: {
    gap: 16,
  },
  descriptionInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
  },
  disabledButton: {
    backgroundColor: '#A5B4FC',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  descriptionDisplay: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    minHeight: 80,
  },
  descriptionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  debugText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
});