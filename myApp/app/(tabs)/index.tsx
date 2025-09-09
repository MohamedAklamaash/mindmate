import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useUserStore } from '@/store/userStore';
import { updateTherapistDescription, getTherapistData, getUserAllBookedSessions } from '@/services/firebaseService';

export default function HomeScreen() {
  const user = useUserStore((state) => state.user);
  const userType = useUserStore((state) => state.userType);
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // User upcoming session state
  const [upcomingSession, setUpcomingSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarAnimation = useState(new Animated.Value(-320))[0]; // Start off-screen to the left

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

  // Fetch user's upcoming sessions
  // Fetch user's upcoming sessions
  const fetchUpcomingSession = async () => {
    if (userType === 'user' && user?.firestoreId) {
      setLoadingSession(true);
      try {
        const bookedSessions = await getUserAllBookedSessions(user.firestoreId);
        
        if (bookedSessions.length > 0) {
          // Filter future sessions and sort by date and time
          const now = new Date();
          const futureeSessions = bookedSessions.filter(session => {
            const sessionDateTime = new Date(`${session.date}T${session.startTime}`);
            return sessionDateTime > now;
          }).sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.startTime}`);
            const dateB = new Date(`${b.date}T${b.startTime}`);
            return dateA.getTime() - dateB.getTime();
          });

          if (futureeSessions.length > 0) {
            // Get therapist data for the upcoming session
            const nextSession = futureeSessions[0];
            try {
              const therapistData = await getTherapistData(nextSession.therapistId);
              setUpcomingSession({
                ...nextSession,
                therapistName: therapistData.name || 'Unknown Therapist'
              });
            } catch (error) {
              console.error('Error fetching therapist data:', error);
              setUpcomingSession({
                ...nextSession,
                therapistName: 'Unknown Therapist'
              });
            }
          } else {
            setUpcomingSession(null);
          }
        } else {
          setUpcomingSession(null);
        }
      } catch (error) {
        console.error('Error fetching upcoming sessions:', error);
        setUpcomingSession(null);
      } finally {
        setLoadingSession(false);
      }
    }
  };

  useEffect(() => {
    fetchUpcomingSession();
  }, [userType, user?.firestoreId]);

  // Refresh upcoming session when screen is focused (after booking a session)
  useFocusEffect(
    React.useCallback(() => {
      if (userType === 'user') {
        fetchUpcomingSession();
      }
    }, [userType, user?.firestoreId])
  );

  // Add debugging to track when component renders and what userType value is
  useEffect(() => {
    console.log('HomeScreen rendered with userType:', userType);
    console.log('User object:', user);
  }, [userType, user]);

  // Helper functions for formatting
  const getTimeBasedGreeting = () => {
    const now = new Date();
    // Convert to IST (GST) - UTC + 5:30
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const hour = istTime.getUTCHours();
    
    if (hour >= 5 && hour < 12) {
      return 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'Good evening';
    } else {
      return 'Good night';
    }
  };

  // Gamification functions
  const getCurrentLevel = () => {
    const totalPoints = 1250; // This should come from user data
    if (totalPoints < 500) return { level: 1, name: 'Beginner', max: 500, color: 'from-green-400 to-blue-400' };
    if (totalPoints < 1000) return { level: 2, name: 'Explorer', max: 1000, color: 'from-blue-400 to-purple-400' };
    if (totalPoints < 2000) return { level: 3, name: 'Achiever', max: 2000, color: 'from-purple-400 to-pink-400' };
    if (totalPoints < 3500) return { level: 4, name: 'Expert', max: 3500, color: 'from-pink-400 to-red-400' };
    return { level: 5, name: 'Master', max: 5000, color: 'from-yellow-400 to-orange-400' };
  };

  const getProgressToNextLevel = () => {
    const totalPoints = 1250;
    const currentLevel = getCurrentLevel();
    const previousLevelMax = currentLevel.level === 1 ? 0 : 
      currentLevel.level === 2 ? 500 :
      currentLevel.level === 3 ? 1000 :
      currentLevel.level === 4 ? 2000 : 3500;
    
    return ((totalPoints - previousLevelMax) / (currentLevel.max - previousLevelMax)) * 100;
  };

  // Sidebar animation functions
  const openSidebar = () => {
    setIsSidebarOpen(true);
    Animated.timing(sidebarAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(sidebarAnimation, {
      toValue: -320,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsSidebarOpen(false);
    });
  };

  // Sidebar Component
  const Sidebar = () => (
    <Modal
      transparent={true}
      visible={isSidebarOpen}
      animationType="none"
      onRequestClose={closeSidebar}
    >
      <View style={styles.sidebarOverlay}>
        <Pressable style={styles.sidebarBackdrop} onPress={closeSidebar} />
        <Animated.View 
          style={[
            styles.sidebarContainer,
            {
              transform: [{ translateX: sidebarAnimation }]
            }
          ]}
        >
          <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.profileImageContainer}>
                <LinearGradient colors={['#60A5FA', '#A78BFA']} style={styles.profileImage}>
                  <MaterialCommunityIcons name="account" size={32} color="white" />
                </LinearGradient>
                <Pressable style={styles.addButton}>
                  <MaterialCommunityIcons name="plus" size={12} color="white" />
                </Pressable>
              </View>
              <Text style={styles.profileName}>{user?.name || 'Welcome!'}</Text>
              <Text style={styles.memberSince}>Member since Aug 2024</Text>
            </View>

            {/* Gamification Section */}
            <View style={styles.gamificationCard}>
              <View style={styles.levelSection}>
                <LinearGradient colors={['#A855F7', '#EC4899']} style={styles.levelIcon}>
                  <MaterialCommunityIcons name="trophy" size={24} color="white" />
                </LinearGradient>
                <Text style={styles.levelTitle}>Level {getCurrentLevel().level}: {getCurrentLevel().name}</Text>
                <Text style={styles.totalPoints}>1250 total points</Text>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabel}>Level {getCurrentLevel().level}</Text>
                  <Text style={styles.progressLabel}>Level {getCurrentLevel().level + 1}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${getProgressToNextLevel()}%` }]} />
                </View>
                <Text style={styles.pointsToNext}>
                  {getCurrentLevel().max - 1250} points to next level
                </Text>
              </View>

              {/* Rewards Section */}
              <View style={styles.rewardsSection}>
                <View style={styles.rewardsHeader}>
                  <Text style={styles.rewardsTitle}>Next Reward</Text>
                  <MaterialCommunityIcons name="gift" size={16} color="#A855F7" />
                </View>
                <View style={styles.rewardProgress}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(1250 % 100)}%` }]} />
                  </View>
                  <Text style={styles.pointsToReward}>
                    {100 - (1250 % 100)} points until free session voucher
                  </Text>
                </View>
              </View>
            </View>

            {/* Achievements */}
            <View style={styles.achievementsCard}>
              <Text style={styles.achievementsTitle}>Recent Badges</Text>
              <View style={styles.badgesGrid}>
                <View style={styles.badgeItem}>
                  <LinearGradient colors={['#FCD34D', '#F59E0B']} style={styles.badgeIcon}>
                    <MaterialCommunityIcons name="white-balance-sunny" size={20} color="white" />
                  </LinearGradient>
                  <Text style={styles.badgeText}>Early Bird</Text>
                </View>
                <View style={styles.badgeItem}>
                  <LinearGradient colors={['#F472B6', '#EF4444']} style={styles.badgeIcon}>
                    <MaterialCommunityIcons name="heart" size={20} color="white" />
                  </LinearGradient>
                  <Text style={styles.badgeText}>Mood Tracker</Text>
                </View>
                <View style={styles.badgeItem}>
                  <LinearGradient colors={['#34D399', '#3B82F6']} style={styles.badgeIcon}>
                    <MaterialCommunityIcons name="moon-waning-crescent" size={20} color="white" />
                  </LinearGradient>
                  <Text style={styles.badgeText}>Sleep Champion</Text>
                </View>
              </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
              <Pressable style={styles.menuItem} onPress={closeSidebar}>
                <MaterialCommunityIcons name="cog" size={20} color="#6B7280" />
                <Text style={styles.menuText}>Settings</Text>
              </Pressable>
              
              <Pressable style={styles.menuItem} onPress={closeSidebar}>
                <MaterialCommunityIcons name="book-open-variant" size={20} color="#6B7280" />
                <Text style={styles.menuText}>My Courses</Text>
              </Pressable>

              <Pressable style={[styles.menuItem, styles.signOutItem]} onPress={() => {
                closeSidebar();
                Alert.alert('Sign Out', 'Are you sure you want to sign out?');
              }}>
                <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
                <Text style={[styles.menuText, styles.signOutText]}>Sign Out</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (duration: number) => {
    if (duration >= 60) {
      return `${duration / 60}hr${duration % 60 ? ` ${duration % 60}min` : ''}`;
    }
    return `${duration}min`;
  };

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
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              bounces={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.headerSection}>
                <LinearGradient colors={['#60A5FA', '#A78BFA']} style={styles.iconContainer}>
                  <MaterialCommunityIcons name="account-tie" size={40} color="white" />
                </LinearGradient>
                <Text style={styles.welcomeText}>
                  {getTimeBasedGreeting()} {user?.name || 'Therapist'}!
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
    <LinearGradient colors={['#EBF4FF', '#F3E8FF', '#FDF2F8']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.headerSection}>
            <Pressable 
              style={styles.sidebarToggle}
              onPress={openSidebar}
            >
              <MaterialCommunityIcons name="menu" size={24} color="#4F46E5" />
            </Pressable>
            <LinearGradient colors={['#60A5FA', '#A78BFA']} style={styles.iconContainer}>
              <MaterialCommunityIcons name="account-heart" size={40} color="white" />
            </LinearGradient>
            <Text style={styles.welcomeText}>
              {getTimeBasedGreeting()} {user?.name || 'User'}!
            </Text>
            <Text style={styles.subtitle}>Your Mental Health Journey</Text>
          </View>

          {/* Upcoming Session Card */}
          <View style={styles.sessionSection}>
            <Text style={styles.sectionTitle}>Upcoming Session</Text>
            
            {loadingSession ? (
              <View style={styles.sessionCard}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading session...</Text>
              </View>
            ) : upcomingSession ? (
              <View style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionIconContainer}>
                    <MaterialCommunityIcons name="calendar-check" size={24} color="#4F46E5" />
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.therapistName}>{upcomingSession.therapistName}</Text>
                    <Text style={styles.sessionType}>{upcomingSession.fieldType}</Text>
                  </View>
                </View>
                
                <View style={styles.sessionDetails}>
                  <View style={styles.sessionDetailRow}>
                    <MaterialCommunityIcons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.sessionDetailText}>{formatDate(upcomingSession.date)}</Text>
                  </View>
                  <View style={styles.sessionDetailRow}>
                    <MaterialCommunityIcons name="clock" size={16} color="#6B7280" />
                    <Text style={styles.sessionDetailText}>
                      {formatTime(upcomingSession.startTime)} • {formatDuration(upcomingSession.duration)}
                    </Text>
                  </View>
                  <View style={styles.sessionDetailRow}>
                    <MaterialCommunityIcons name="currency-usd" size={16} color="#6B7280" />
                    <Text style={styles.sessionDetailText}>${upcomingSession.price}</Text>
                  </View>
                </View>

                <Pressable style={styles.sessionButton}>
                  <MaterialCommunityIcons name="video" size={16} color="white" />
                  <Text style={styles.sessionButtonText}>Join Session</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.noSessionCard}>
                <MaterialCommunityIcons name="calendar-plus" size={48} color="#9CA3AF" />
                <Text style={styles.noSessionTitle}>No Upcoming Sessions</Text>
                <Text style={styles.noSessionSubtitle}>
                  Book a session with one of our qualified therapists to get started.
                </Text>
                <Pressable style={styles.bookSessionButton}>
                  <MaterialCommunityIcons name="account-search" size={16} color="#4F46E5" />
                  <Text style={styles.bookSessionButtonText}>Find Therapists</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <Pressable style={styles.actionCard}>
                <MaterialCommunityIcons name="message-text" size={24} color="#4F46E5" />
                <Text style={styles.actionText}>Chat</Text>
              </Pressable>
              <Pressable style={styles.actionCard}>
                <MaterialCommunityIcons name="account-search" size={24} color="#4F46E5" />
                <Text style={styles.actionText}>Find Therapist</Text>
              </Pressable>
              <Pressable style={styles.actionCard}>
                <MaterialCommunityIcons name="calendar-multiple" size={24} color="#4F46E5" />
                <Text style={styles.actionText}>My Sessions</Text>
              </Pressable>
              <Pressable style={styles.actionCard}>
                <MaterialCommunityIcons name="book-open-variant" size={24} color="#4F46E5" />
                <Text style={styles.actionText}>Resources</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
        <Sidebar />
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
    paddingTop: Platform.OS === 'android' ? 25 : 0, // Add spacing from status bar on Android
  },
  scrollView: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100, // Add extra padding at bottom for better scrolling
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  sidebarToggle: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  
  // Session Section Styles
  sessionSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  sessionCard: {
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
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  therapistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sessionType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  sessionDetails: {
    marginBottom: 16,
  },
  sessionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDetailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  sessionButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  sessionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // No Session Card Styles
  noSessionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noSessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  noSessionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  bookSessionButton: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  bookSessionButtonText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Quick Actions Styles
  actionsSection: {
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '47%', // Use specific width instead of flex: 1
    aspectRatio: 1, // Make cards square
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Loading States
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Therapist Section Styles (existing)
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
  // Sidebar styles
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sidebarContainer: {
    width: 320,
    height: '100%',
    backgroundColor: 'white',
    position: 'absolute',
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  sidebarContent: {
    flex: 1,
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#6B7280',
  },
  gamificationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  levelSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  totalPoints: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  progressSection: {
    marginTop: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  streakCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  streakIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  streakLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  sidebarSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementBadge: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  achievementIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  achievementTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  menuSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  menuChevron: {
    marginLeft: 8,
  },
  pointsToNext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  rewardsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rewardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rewardsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  rewardProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsToReward: {
    fontSize: 12,
    color: '#6B7280',
  },
  achievementsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  achievementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 70,
  },
  badgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#374151',
    textAlign: 'center',
  },
  signOutItem: {
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginHorizontal: -4,
  },
  signOutText: {
    color: '#DC2626',
    fontWeight: '500',
  },
});