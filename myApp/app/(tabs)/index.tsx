import React, { useEffect, useState, memo } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useUserStore } from '@/store/userStore';
import { useThemeStore, Theme, getThemeColors } from '@/store/themeStore';
import { updateTherapistDescription, getTherapistData, getUserTherapistSessions, TherapistSession } from '@/services/firebaseService';

type SidebarProps = {
  isOpen: boolean;
  sidebarAnimation: Animated.Value;
  closeSidebar: () => void;
  user: any;
  selectedTheme: Theme;
  setSelectedTheme: (theme: Theme) => void;
  isThemeDropdownOpen: boolean;
  setIsThemeDropdownOpen: (open: boolean) => void;
  sidebarWidth: number;
};

const Sidebar = memo(function Sidebar({
  isOpen,
  sidebarAnimation,
  closeSidebar,
  user,
  selectedTheme,
  setSelectedTheme,
  isThemeDropdownOpen,
  setIsThemeDropdownOpen,
  sidebarWidth,
}: SidebarProps) {
  const themes: Theme[] = ['system', 'light', 'dark', 'forest', 'retro', 'ocean', 'blossom'];

  return (
    <Modal
      transparent={true}
      visible={isOpen}
      animationType="none"
      onRequestClose={closeSidebar}
      hardwareAccelerated={true}
      statusBarTranslucent={true}
    >
      <View style={styles.sidebarOverlay} pointerEvents="box-none">
        <Pressable style={styles.sidebarBackdrop} onPress={closeSidebar} />
        <Animated.View 
          style={[
            styles.sidebarContainer,
            {
              width: sidebarWidth,
              transform: [{ translateX: sidebarAnimation }]
            }
          ]}
        >
          <ScrollView 
            style={styles.sidebarContent} 
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
          >
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.profileImageContainer}>
                <LinearGradient colors={['#60A5FA', '#A78BFA']} style={styles.profileImage}>
                  <MaterialCommunityIcons name="account" size={32} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              <Text style={styles.memberSince}>Member since Aug 2024</Text>
            </View>

            {/* Settings Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionHeader}>Settings</Text>
              
              {/* Theme Setting */}
              <View style={styles.themeSettingContainer}>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Theme</Text>
                  <Pressable 
                    style={styles.settingValue}
                    onPress={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                  >
                    <Text style={styles.settingValueText}>
                    {selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)}
                  </Text>
                    <MaterialCommunityIcons 
                      name={isThemeDropdownOpen ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color="#6B7280" 
                    />
                  </Pressable>
                </View>

                {/* Theme Options - Absolute positioned overlay */}
                {isThemeDropdownOpen && (
                  <View style={styles.themeOptionsContainer}>
                    {themes.map((theme, index) => (
                      <Pressable 
                        key={theme} 
                        style={[
                          styles.themeOptionInline,
                          index === themes.length - 1 && { borderBottomWidth: 0 }
                        ]}
                        onPress={() => {
                          setSelectedTheme(theme);
                          setIsThemeDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.themeOptionTextInline}>
                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </Text>
                        {selectedTheme === theme && (
                          <MaterialCommunityIcons name="check" size={16} color="#4F46E5" />
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Location Services */}
              <View style={styles.settingItem}>
                <View style={styles.settingWithIcon}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#6B7280" />
                  <Text style={styles.settingLabel}>Location Services</Text>
                </View>
                <View style={styles.toggleContainer}>
                  <View style={styles.toggleSwitch}>
                    <View style={styles.toggleThumb} />
                  </View>
                </View>
              </View>

              {/* Sleep Schedule */}
              <View style={styles.settingItem}>
                <View style={styles.settingWithIcon}>
                  <MaterialCommunityIcons name="sleep" size={16} color="#6B7280" />
                  <Text style={styles.settingLabel}>Sleep Schedule</Text>
                </View>
              </View>

              {/* Sleep Time Settings */}
              <View style={styles.sleepTimeContainer}>
                <View style={styles.sleepTimeItem}>
                  <Text style={styles.sleepTimeLabel}>Bedtime</Text>
                  <Text style={styles.sleepTimeValue}>10:30 PM</Text>
                </View>
                <View style={styles.sleepTimeItem}>
                  <Text style={styles.sleepTimeLabel}>Wake Time</Text>
                  <Text style={styles.sleepTimeValue}>07:00 AM</Text>
                </View>
              </View>
            </View>

            {/* Profile Details Section */}
            <View style={styles.profileDetailsSection}>
              <Text style={styles.sectionHeader}>Profile Details</Text>
              
              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputValue}>{user?.name || 'v'}</Text>
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputPlaceholder}>Enter email</Text>
                </View>
              </View>

              <Text style={styles.memberSinceDetail}>Member since Aug 2024</Text>
            </View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
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
});

// Helper functions for formatting
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDuration = (duration: number) => {
  if (duration < 60) {
    return `${duration} min`;
  }
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

export default function HomeScreen() {
  const user = useUserStore((state) => state.user);
  const userType = useUserStore((state) => state.userType);
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // User session state
  const [upcomingSession, setUpcomingSession] = useState<TherapistSession | null>(null);
  const [allUpcomingSessions, setAllUpcomingSessions] = useState<TherapistSession[]>([]);
  const [completedSessions, setCompletedSessions] = useState<TherapistSession[]>([]);
  const [loadingSession, setLoadingSession] = useState(false);
  
  // Session tab state
  const [selectedSessionTab, setSelectedSessionTab] = useState<'upcoming' | 'completed'>('upcoming');
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Calculate responsive sidebar width (half of screen width)
  const screenWidth = Dimensions.get('window').width;
  const sidebarWidth = screenWidth * 0.5;
  
  const sidebarAnimation = useState(new Animated.Value(-sidebarWidth))[0]; // Start off-screen to the left

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
  const fetchUpcomingSession = async () => {
    if (userType === 'user' && user?.firestoreId) {
      setLoadingSession(true);
      try {
        console.log('Fetching sessions for user:', user.firestoreId);
        const bookedSessions = await getUserTherapistSessions(user.firestoreId);
        console.log('Retrieved sessions:', bookedSessions);
        
        if (bookedSessions.length > 0) {
          const now = new Date();
          
          // Filter future sessions and sort by date and time
          const futuresSessions = bookedSessions.filter((session: TherapistSession) => {
            const sessionDateTime = new Date(`${session.date}T${session.startTime}`);
            return sessionDateTime > now && session.status === 'booked';
          }).sort((a: TherapistSession, b: TherapistSession) => {
            const dateA = new Date(`${a.date}T${a.startTime}`);
            const dateB = new Date(`${b.date}T${b.startTime}`);
            return dateA.getTime() - dateB.getTime();
          });

          // Filter past sessions and sort by date and time (most recent first)
          const pastSessions = bookedSessions.filter((session: TherapistSession) => {
            const sessionDateTime = new Date(`${session.date}T${session.startTime}`);
            return sessionDateTime <= now;
          }).sort((a: TherapistSession, b: TherapistSession) => {
            const dateA = new Date(`${a.date}T${a.startTime}`);
            const dateB = new Date(`${b.date}T${b.startTime}`);
            return dateB.getTime() - dateA.getTime(); // Descending order for completed sessions
          });

          console.log('Filtered future sessions:', futuresSessions);
          console.log('Filtered completed sessions:', pastSessions);
          
          setAllUpcomingSessions(futuresSessions);
          setCompletedSessions(pastSessions);

          if (futuresSessions.length > 0) {
            const nextSession = futuresSessions[0];
            setUpcomingSession(nextSession);
            console.log('Next session set:', nextSession);
          } else {
            setUpcomingSession(null);
            console.log('No future sessions found');
          }
        } else {
          setUpcomingSession(null);
          setAllUpcomingSessions([]);
          setCompletedSessions([]);
          console.log('No sessions found for user');
        }
      } catch (error) {
        console.error('Error fetching upcoming sessions:', error);
        setUpcomingSession(null);
        setAllUpcomingSessions([]);
        setCompletedSessions([]);
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
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'Good Evening';
    } else {
      return 'Good Evening';
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

  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const selectedTheme = useThemeStore((state) => state.selectedTheme);
  const setSelectedTheme = useThemeStore((state) => state.setSelectedTheme);
  const themes: Theme[] = ['system', 'light', 'dark', 'forest', 'retro', 'ocean', 'blossom'];
  
  // Get theme colors for styling
  const themeColors = getThemeColors(selectedTheme);

  // Dynamic gradient based on theme
  const getBackgroundGradient = (): [string, string, string] => {
    switch (selectedTheme) {
      case 'forest':
        return ['#F0FDF4', '#ECFDF5', '#D1FAE5']; // Green gradient
      case 'ocean':
        return ['#EBF8FF', '#DBEAFE', '#BFDBFE']; // Blue gradient
      case 'retro':
        return ['#FEF3C7', '#FDE68A', '#F59E0B']; // Orange gradient
      case 'blossom':
        return ['#FDF2F8', '#FCE7F3', '#F9A8D4']; // Pink gradient
      case 'dark':
        return ['#1F2937', '#374151', '#4B5563']; // Dark gradient
      case 'light':
        return ['#F9FAFB', '#F3F4F6', '#E5E7EB']; // Light gradient
      default:
        return ['#EBF4FF', '#F3E8FF', '#FDF2F8']; // Default gradient
    }
  };

  // Dynamic icon colors based on theme
  const getIconGradient = (): [string, string] => {
    switch (selectedTheme) {
      case 'forest':
        return ['#059669', '#10B981']; // Emerald to green
      case 'ocean':
        return ['#0891B2', '#3B82F6']; // Cyan to blue
      case 'retro':
        return ['#EA580C', '#F59E0B']; // Orange to amber
      case 'blossom':
        return ['#DB2777', '#F43F5E']; // Pink to rose
      case 'dark':
        return ['#3B82F6', '#8B5CF6']; // Blue to purple
      case 'light':
        return ['#60A5FA', '#A78BFA']; // Light blue to purple
      default:
        return ['#60A5FA', '#A78BFA']; // Default
    }
  };

  // Dynamic level icon gradient
  const getLevelIconGradient = (): [string, string] => {
    switch (selectedTheme) {
      case 'forest':
        return ['#16A34A', '#059669']; // Green to emerald
      case 'ocean':
        return ['#0891B2', '#0E7490']; // Cyan variations
      case 'retro':
        return ['#F59E0B', '#D97706']; // Amber variations
      case 'blossom':
        return ['#A855F7', '#EC4899']; // Purple to pink
      case 'dark':
        return ['#A855F7', '#EC4899']; // Purple to pink
      case 'light':
        return ['#A855F7', '#EC4899']; // Purple to pink
      default:
        return ['#A855F7', '#EC4899']; // Default
    }
  };

  // Dynamic badge gradients based on theme
  const getBadgeGradients = (): { early: [string, string]; mood: [string, string]; sleep: [string, string] } => {
    switch (selectedTheme) {
      case 'forest':
        return {
          early: ['#059669', '#10B981'], // Emerald to green
          mood: ['#16A34A', '#15803D'], // Green variations
          sleep: ['#84CC16', '#65A30D'], // Lime variations
        };
      case 'ocean':
        return {
          early: ['#0891B2', '#06B6D4'], // Cyan variations
          mood: ['#3B82F6', '#2563EB'], // Blue variations
          sleep: ['#0D9488', '#14B8A6'], // Teal variations
        };
      case 'retro':
        return {
          early: ['#F59E0B', '#D97706'], // Amber variations
          mood: ['#EA580C', '#DC2626'], // Orange to red
          sleep: ['#FACC15', '#EAB308'], // Yellow variations
        };
      case 'blossom':
        return {
          early: ['#F43F5E', '#E11D48'], // Rose variations
          mood: ['#DB2777', '#BE185D'], // Pink variations
          sleep: ['#A855F7', '#9333EA'], // Purple variations
        };
      default:
        return {
          early: ['#FCD34D', '#F59E0B'], // Default yellow
          mood: ['#F472B6', '#EF4444'], // Default pink to red
          sleep: ['#34D399', '#3B82F6'], // Default green to blue
        };
    }
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
      toValue: -sidebarWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsSidebarOpen(false);
    });
  };

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
    const gradientColors = getBackgroundGradient();
    const iconGradientColors = getIconGradient();
    
    return (
      <LinearGradient colors={gradientColors} style={styles.container}>
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
                <Pressable 
                  style={[styles.sidebarToggle, { backgroundColor: themeColors.surface }]}
                  onPress={openSidebar}
                >
                  <MaterialCommunityIcons name="menu" size={24} color={themeColors.primary} />
                </Pressable>
                <LinearGradient colors={iconGradientColors} style={styles.iconContainer}>
                  <MaterialCommunityIcons name="account-tie" size={40} color="white" />
                </LinearGradient>
                <Text style={[styles.welcomeText, { color: themeColors.text }]}>
                  {getTimeBasedGreeting()} {user?.name || 'Therapist'}!
                </Text>
                <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Professional Dashboard</Text>
              </View>

              <View style={[styles.descriptionSection, { backgroundColor: themeColors.surface }]}>
                <View style={styles.descriptionHeader}>
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Professional Description</Text>
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
        <Sidebar 
          isOpen={isSidebarOpen}
          sidebarAnimation={sidebarAnimation}
          closeSidebar={closeSidebar}
          user={user}
          selectedTheme={selectedTheme}
          setSelectedTheme={setSelectedTheme}
          isThemeDropdownOpen={isThemeDropdownOpen}
          setIsThemeDropdownOpen={setIsThemeDropdownOpen}
          sidebarWidth={sidebarWidth}
        />
      </LinearGradient>
    );
  }

  // Render user home screen (existing design)
  const gradientColors = getBackgroundGradient();
  const iconGradientColors = getIconGradient();
  const levelIconGradientColors = getLevelIconGradient();
  
  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.headerSection}>
            <Pressable 
              style={[styles.sidebarToggle, { backgroundColor: themeColors.surface }]}
              onPress={openSidebar}
            >
              <MaterialCommunityIcons name="menu" size={24} color={themeColors.primary} />
            </Pressable>
            <LinearGradient colors={iconGradientColors} style={styles.iconContainer}>
              <MaterialCommunityIcons name="account-heart" size={40} color="white" />
            </LinearGradient>
            <Text style={[styles.welcomeText, { color: themeColors.text }]}>
              {getTimeBasedGreeting()} {user?.name || 'User'}!
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Your Mental Health Journey</Text>
          </View>

          {/* Gamification Section - moved to top */}
          <View style={styles.gamificationSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Your Progress</Text>
            <View style={[styles.gamificationCard, { backgroundColor: themeColors.surface }]}>
              <View style={styles.levelSection}>
                <LinearGradient colors={levelIconGradientColors} style={styles.levelIcon}>
                  <MaterialCommunityIcons name="trophy" size={24} color="white" />
                </LinearGradient>
                <View style={styles.levelInfo}>
                  <Text style={[styles.levelTitle, { color: themeColors.text }]}>Level {getCurrentLevel().level}: {getCurrentLevel().name}</Text>
                  <Text style={[styles.totalPoints, { color: themeColors.textSecondary }]}>1250 total points</Text>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                  <Text style={[styles.progressLabel, { color: themeColors.textSecondary }]}>Level {getCurrentLevel().level}</Text>
                  <Text style={[styles.progressLabel, { color: themeColors.textSecondary }]}>Level {getCurrentLevel().level + 1}</Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: themeColors.border }]}>
                  <View style={[styles.progressFill, { width: `${getProgressToNextLevel()}%`, backgroundColor: themeColors.accent }]} />
                </View>
                <Text style={[styles.pointsToNext, { color: themeColors.textSecondary }]}>
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

            {/* Achievements - moved here */}
            <View style={[styles.achievementsCard, { backgroundColor: themeColors.surface }]}>
              <Text style={[styles.achievementsTitle, { color: themeColors.text }]}>Recent Badges</Text>
              <View style={styles.badgesGrid}>
                <View style={styles.badgeItem}>
                  <LinearGradient colors={getBadgeGradients().early} style={styles.badgeIcon}>
                    <MaterialCommunityIcons name="white-balance-sunny" size={20} color="white" />
                  </LinearGradient>
                  <Text style={[styles.badgeText, { color: themeColors.textSecondary }]}>Early Bird</Text>
                </View>
                <View style={styles.badgeItem}>
                  <LinearGradient colors={getBadgeGradients().mood} style={styles.badgeIcon}>
                    <MaterialCommunityIcons name="heart" size={20} color="white" />
                  </LinearGradient>
                  <Text style={[styles.badgeText, { color: themeColors.textSecondary }]}>Mood Tracker</Text>
                </View>
                <View style={styles.badgeItem}>
                  <LinearGradient colors={getBadgeGradients().sleep} style={styles.badgeIcon}>
                    <MaterialCommunityIcons name="moon-waning-crescent" size={20} color="white" />
                  </LinearGradient>
                  <Text style={[styles.badgeText, { color: themeColors.textSecondary }]}>Sleep Champion</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Sessions Section with Tabs */}
          <View style={styles.sessionSection}>
            {/* Tab Headers */}
            <View style={styles.sessionTabContainer}>
              <Pressable 
                style={[
                  styles.sessionTab, 
                  selectedSessionTab === 'upcoming' && [styles.activeSessionTab, { borderBottomColor: themeColors.primary }]
                ]}
                onPress={() => setSelectedSessionTab('upcoming')}
              >
                <Text style={[
                  styles.sessionTabText, 
                  { color: selectedSessionTab === 'upcoming' ? themeColors.primary : themeColors.textSecondary }
                ]}>
                  Upcoming Sessions
                </Text>
                {allUpcomingSessions.length > 0 && (
                  <View style={[styles.sessionTabBadge, { backgroundColor: themeColors.primary }]}>
                    <Text style={styles.sessionTabBadgeText}>{allUpcomingSessions.length}</Text>
                  </View>
                )}
              </Pressable>

              <Pressable 
                style={[
                  styles.sessionTab, 
                  selectedSessionTab === 'completed' && [styles.activeSessionTab, { borderBottomColor: themeColors.success }]
                ]}
                onPress={() => setSelectedSessionTab('completed')}
              >
                <Text style={[
                  styles.sessionTabText, 
                  { color: selectedSessionTab === 'completed' ? themeColors.success : themeColors.textSecondary }
                ]}>
                  Completed Sessions
                </Text>
                {completedSessions.length > 0 && (
                  <View style={[styles.sessionTabBadge, { backgroundColor: themeColors.success }]}>
                    <Text style={styles.sessionTabBadgeText}>{completedSessions.length}</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Content Area */}
            <View style={styles.sessionContentArea}>
              {loadingSession ? (
                <View style={[styles.sessionCard, { backgroundColor: themeColors.surface }]}>
                  <ActivityIndicator size="small" color={themeColors.primary} />
                  <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Loading sessions...</Text>
                </View>
              ) : selectedSessionTab === 'upcoming' ? (
                // Upcoming Sessions Content
                upcomingSession ? (
                  <View style={[styles.sessionCard, { backgroundColor: themeColors.surface }]}>
                    <View style={styles.sessionHeader}>
                      <View style={[styles.sessionIconContainer, { backgroundColor: themeColors.background }]}>
                        <MaterialCommunityIcons name="calendar-check" size={24} color={themeColors.primary} />
                      </View>
                      <View style={styles.sessionInfo}>
                        <Text style={[styles.therapistName, { color: themeColors.text }]}>{upcomingSession.therapistName}</Text>
                        <Text style={[styles.sessionType, { color: themeColors.textSecondary }]}>{upcomingSession.fieldType}</Text>
                      </View>
                      <View style={styles.sessionStatus}>
                        <Text style={[styles.sessionStatusText, { color: themeColors.accent }]}>
                          {upcomingSession.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.sessionDetails}>
                      <View style={styles.sessionDetailRow}>
                        <MaterialCommunityIcons name="calendar" size={16} color={themeColors.textSecondary} />
                        <Text style={[styles.sessionDetailText, { color: themeColors.textSecondary }]}>{formatDate(upcomingSession.date)}</Text>
                      </View>
                      <View style={styles.sessionDetailRow}>
                        <MaterialCommunityIcons name="clock" size={16} color={themeColors.textSecondary} />
                        <Text style={[styles.sessionDetailText, { color: themeColors.textSecondary }]}>
                          {formatTime(upcomingSession.startTime)} • {formatDuration(upcomingSession.duration)}
                        </Text>
                      </View>
                      <View style={styles.sessionDetailRow}>
                        <MaterialCommunityIcons name="currency-usd" size={16} color={themeColors.textSecondary} />
                        <Text style={[styles.sessionDetailText, { color: themeColors.textSecondary }]}>${upcomingSession.price}</Text>
                      </View>
                    </View>

                    <View style={styles.sessionActions}>
                      <Pressable style={[styles.sessionButton, { backgroundColor: themeColors.primary }]}>
                        <MaterialCommunityIcons name="video" size={16} color="white" />
                        <Text style={styles.sessionButtonText}>Join Session</Text>
                      </Pressable>
                      
                      {allUpcomingSessions.length > 1 && (
                        <Pressable style={[styles.viewAllButton, { borderColor: themeColors.border }]}>
                          <Text style={[styles.viewAllButtonText, { color: themeColors.textSecondary }]}>
                            View All ({allUpcomingSessions.length})
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={[styles.noSessionCard, { backgroundColor: themeColors.surface }]}>
                    <MaterialCommunityIcons name="calendar-plus" size={48} color={themeColors.textMuted} />
                    <Text style={[styles.noSessionTitle, { color: themeColors.text }]}>No Upcoming Sessions</Text>
                    <Text style={[styles.noSessionSubtitle, { color: themeColors.textSecondary }]}>
                      Visit the Therapist tab to book a session with one of our qualified therapists.
                    </Text>
                  </View>
                )
              ) : (
                // Completed Sessions Content
                completedSessions.length > 0 ? (
                  <View style={styles.completedSessionsList}>
                    {completedSessions.slice(0, 3).map((session, index) => (
                      <View key={`${session.therapistId}-${session.date}-${session.startTime}`} style={[styles.completedSessionCard, { backgroundColor: themeColors.surface }]}>
                        <View style={styles.sessionHeader}>
                          <View style={[styles.sessionIconContainer, { backgroundColor: themeColors.background }]}>
                            <MaterialCommunityIcons name="check-circle" size={24} color={themeColors.success} />
                          </View>
                          <View style={styles.sessionInfo}>
                            <Text style={[styles.therapistName, { color: themeColors.text }]}>{session.therapistName}</Text>
                            <Text style={[styles.sessionType, { color: themeColors.textSecondary }]}>{session.fieldType}</Text>
                          </View>
                          <View style={styles.sessionStatus}>
                            <Text style={[styles.completedStatusText, { color: themeColors.success }]}>
                              COMPLETED
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.sessionDetails}>
                          <View style={styles.sessionDetailRow}>
                            <MaterialCommunityIcons name="calendar" size={16} color={themeColors.textSecondary} />
                            <Text style={[styles.sessionDetailText, { color: themeColors.textSecondary }]}>{formatDate(session.date)}</Text>
                          </View>
                          <View style={styles.sessionDetailRow}>
                            <MaterialCommunityIcons name="clock" size={16} color={themeColors.textSecondary} />
                            <Text style={[styles.sessionDetailText, { color: themeColors.textSecondary }]}>
                              {formatTime(session.startTime)} • {formatDuration(session.duration)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.completedSessionActions}>
                          <Pressable style={[styles.reviewButton, { borderColor: themeColors.border }]}>
                            <MaterialCommunityIcons name="star-outline" size={16} color={themeColors.textSecondary} />
                            <Text style={[styles.reviewButtonText, { color: themeColors.textSecondary }]}>Leave Review</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                    
                    {completedSessions.length > 3 && (
                      <Pressable style={[styles.viewAllCompletedButton, { borderColor: themeColors.border }]}>
                        <Text style={[styles.viewAllButtonText, { color: themeColors.textSecondary }]}>
                          View All {completedSessions.length} Completed Sessions
                        </Text>
                      </Pressable>
                    )}
                  </View>
                ) : (
                  <View style={[styles.noSessionCard, { backgroundColor: themeColors.surface }]}>
                    <MaterialCommunityIcons name="history" size={48} color={themeColors.textMuted} />
                    <Text style={[styles.noSessionTitle, { color: themeColors.text }]}>No Completed Sessions</Text>
                    <Text style={[styles.noSessionSubtitle, { color: themeColors.textSecondary }]}>
                      Your completed therapy sessions will appear here after you've attended them.
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>
        </ScrollView>
        <Sidebar 
          isOpen={isSidebarOpen}
          sidebarAnimation={sidebarAnimation}
          closeSidebar={closeSidebar}
          user={user}
          selectedTheme={selectedTheme}
          setSelectedTheme={setSelectedTheme}
          isThemeDropdownOpen={isThemeDropdownOpen}
          setIsThemeDropdownOpen={setIsThemeDropdownOpen}
          sidebarWidth={sidebarWidth}
        />
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
  sessionSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  
  // Session Tab Styles
  sessionTabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(183, 51, 51, 0.1)',
  },
  sessionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  activeSessionTab: {
    borderBottomWidth: 2,
  },
  sessionTabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionTabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  sessionTabBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionContentArea: {
    minHeight: 200,
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#f4f4f4ff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 15,
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
  sessionStatus: {
    alignItems: 'flex-end',
  },
  sessionStatusText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
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
    flex: 1,
  },
  sessionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Completed Sessions Styles
  completedSessionsList: {
    gap: 12,
  },
  completedSessionCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  completedStatusText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  completedSessionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  reviewButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewAllCompletedButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  
  // No Session Card Styles
  noSessionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#cdc8c8ff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 15,
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
  
  // Quick Actions Styles (now Gamification Section)
  gamificationSection: {
    marginBottom: 20,
  },
  
  // Update existing gamificationCard to work in main section
  gamificationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#b9b8b8ff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 15,
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
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalPoints: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  progressSection: {
    marginBottom: 16,
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
  pointsToNext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  rewardsSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
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
    borderRadius: 16,
    padding: 20,
    shadowColor: '#d1d1d1ff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 15,
  },
  achievementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  badgeItem: {
    alignItems: 'center',
    flex: 1,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
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
  
  // Settings Section Styles
  settingsSection: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValueText: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Theme Setting Container - Relative positioned for absolute dropdown
  themeSettingContainer: {
    position: 'relative',
  },
  
  // Theme Options Container - Absolute positioned overlay
  themeOptionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    overflow: 'hidden',
  },
  themeOptionInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  themeOptionTextInline: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  settingWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleContainer: {
    alignItems: 'flex-end',
  },
  toggleSwitch: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginLeft: 16,
  },
  sleepTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginLeft: 24,
  },
  sleepTimeItem: {
    alignItems: 'center',
  },
  sleepTimeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  sleepTimeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  
  // Profile Details Section
  profileDetailsSection: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  inputPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  memberSinceDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
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