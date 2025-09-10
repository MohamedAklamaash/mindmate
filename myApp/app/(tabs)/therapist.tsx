import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl, Pressable, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAllAvailableTherapists, bookTherapistSession, getUserTherapistSessions, checkUserTimeConflict, TherapistSession } from '@/services/firebaseService';
import { useUserStore } from '@/store/userStore';
import { useThemeStore, getThemeColors } from '@/store/themeStore';

interface TherapistData {
  id: string;
  name: string;
  description?: string;
  schedules?: Array<{
    id: string;
    fieldType: string;
    startTime: string;
    duration: number;
    date: string;
    price: number;
    userId: string | null;
    booked: boolean;
  }>;
}

export default function TherapistScreen() {
  const [therapists, setTherapists] = useState<TherapistData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  const [userBookedSessions, setUserBookedSessions] = useState<TherapistSession[]>([]);
  
  const user = useUserStore((state) => state.user);

  // Theme support
  const selectedTheme = useThemeStore((state) => state.selectedTheme);
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

  // Dynamic accent color for buttons and icons
  const getAccentColor = (): string => {
    switch (selectedTheme) {
      case 'forest':
        return '#059669'; // Emerald
      case 'ocean':
        return '#0891B2'; // Cyan
      case 'retro':
        return '#EA580C'; // Orange
      case 'blossom':
        return '#DB2777'; // Pink
      case 'dark':
        return '#3B82F6'; // Blue
      case 'light':
        return '#4F46E5'; // Indigo
      default:
        return '#4F46E5'; // Default indigo
    }
  };

  const fetchTherapists = async () => {
    try {
      const therapistList = await getAllAvailableTherapists();
      setTherapists(therapistList);
    } catch (error) {
      console.error('Error fetching therapists:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserBookedSessions = async () => {
    if (!user?.firestoreId) return;
    
    try {
      const bookedSessions = await getUserTherapistSessions(user.firestoreId);
      setUserBookedSessions(bookedSessions);
    } catch (error) {
      console.error('Error fetching user booked sessions:', error);
    }
  };

  useEffect(() => {
    fetchTherapists();
    fetchUserBookedSessions();
  }, [user?.firestoreId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTherapists(), fetchUserBookedSessions()]);
    setRefreshing(false);
  };

  const handleBookSession = (therapistId: string, scheduleId: string, therapistName: string, schedule: any) => {
    // Check for time conflicts with user's existing bookings
    const hasConflict = checkUserTimeConflict(
      userBookedSessions,
      schedule.date,
      schedule.startTime,
      schedule.duration
    );

    if (hasConflict) {
      Alert.alert(
        'Booking Conflict',
        'You already have a session booked at this time. Please choose a different time slot.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Book Session',
      `Are you sure you want to book this session with ${therapistName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Book',
          onPress: () => confirmBooking(therapistId, scheduleId),
        },
      ]
    );
  };

  const confirmBooking = async (therapistId: string, scheduleId: string) => {
    if (!user?.firestoreId) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    setBookingLoading(scheduleId);
    try {
      await bookTherapistSession(therapistId, scheduleId, user.firestoreId);
      Alert.alert('Success', 'Session booked successfully!');
      // Refresh the list to remove the booked session and update user's bookings
      await Promise.all([fetchTherapists(), fetchUserBookedSessions()]);
    } catch (error) {
      console.error('Error booking session:', error);
      Alert.alert('Error', 'Failed to book session. Please try again.');
    } finally {
      setBookingLoading(null);
    }
  };

  const formatDuration = (duration: number) => {
    if (duration >= 60) {
      return `${duration / 60}hr${duration % 60 ? ` ${duration % 60}min` : ''}`;
    }
    return `${duration}min`;
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

  if (isLoading) {
    const gradientColors = getBackgroundGradient();
    
    return (
      <LinearGradient colors={gradientColors} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={getAccentColor()} />
            <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Loading therapists...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={getBackgroundGradient()} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>Available Therapists</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Find the right therapist for you</Text>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {therapists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-search" size={64} color={themeColors.textMuted} />
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>No therapists available</Text>
              <Text style={[styles.emptySubtext, { color: themeColors.textMuted }]}>Check back later for new therapists</Text>
            </View>
          ) : (
            therapists.map((therapist) => (
              <View key={therapist.id} style={[styles.therapistCard, { 
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                borderWidth: 1
              }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.avatarContainer, { 
                    backgroundColor: selectedTheme === 'dark' ? themeColors.background : themeColors.backgroundSecondary
                  }]}>
                    <MaterialCommunityIcons name="account-tie" size={32} color={getAccentColor()} />
                  </View>
                  <View style={styles.nameContainer}>
                    <Text style={[styles.therapistName, { color: themeColors.text }]}>{therapist.name || 'null'}</Text>
                    <Text style={[styles.therapistTitle, { color: themeColors.textSecondary }]}>Licensed Therapist</Text>
                  </View>
                </View>

                <View style={styles.descriptionSection}>
                  <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Description:</Text>
                  <Text style={[styles.descriptionText, { color: themeColors.textSecondary }]}>
                    {therapist.description || 'This is ' + therapist.name}
                  </Text>
                </View>

                <View style={[styles.scheduleSection, { borderTopColor: themeColors.border }]}>
                  <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Available Services:</Text>
                  {therapist.schedules && therapist.schedules.length > 0 ? (
                    therapist.schedules.map((schedule, index) => {
                      // Check if user has a conflict with this schedule
                      const hasConflict = checkUserTimeConflict(
                        userBookedSessions,
                        schedule.date,
                        schedule.startTime,
                        schedule.duration
                      );

                      return (
                        <View key={schedule.id || index} style={[styles.scheduleItem, { 
                          backgroundColor: selectedTheme === 'dark' ? themeColors.surface : themeColors.backgroundSecondary,
                          borderColor: themeColors.border,
                          borderWidth: 1
                        }]}>
                          <View style={styles.scheduleRow}>
                            <Text style={[styles.scheduleLabel, { color: themeColors.text }]}>Field Type:</Text>
                            <Text style={[styles.scheduleValue, { color: themeColors.textSecondary }]}>{schedule.fieldType || 'One'}</Text>
                          </View>
                          <View style={styles.scheduleRow}>
                            <Text style={[styles.scheduleLabel, { color: themeColors.text }]}>Date:</Text>
                            <Text style={[styles.scheduleValue, { color: themeColors.textSecondary }]}>
                              {schedule.date ? new Date(schedule.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              }) : 'Thu, Aug 28'}
                            </Text>
                          </View>
                          <View style={styles.scheduleRow}>
                            <Text style={[styles.scheduleLabel, { color: themeColors.text }]}>Start Time:</Text>
                            <Text style={[styles.scheduleValue, { color: themeColors.textSecondary }]}>{formatTime(schedule.startTime) || '9:00 AM'}</Text>
                          </View>
                          <View style={styles.scheduleRow}>
                            <Text style={[styles.scheduleLabel, { color: themeColors.text }]}>Duration:</Text>
                            <Text style={[styles.scheduleValue, { color: themeColors.textSecondary }]}>{formatDuration(schedule.duration) || '1hr'}</Text>
                          </View>
                          <View style={styles.scheduleRow}>
                            <Text style={[styles.scheduleLabel, { color: themeColors.text }]}>Price:</Text>
                            <Text style={[styles.priceText, { color: getAccentColor() }]}>${schedule.price || '23'}</Text>
                          </View>
                          
                          {hasConflict && (
                            <View style={[styles.conflictWarning, { backgroundColor: themeColors.error + '20' }]}>
                              <MaterialCommunityIcons name="alert-circle" size={16} color={themeColors.error} />
                              <Text style={[styles.conflictText, { color: themeColors.error }]}>
                                You have a booking conflict at this time
                              </Text>
                            </View>
                          )}
                          
                          <Pressable
                            style={({ pressed }) => [
                              styles.bookButton,
                              { backgroundColor: getAccentColor() },
                              pressed && [styles.bookButtonPressed, { backgroundColor: getAccentColor() + 'CC' }],
                              (bookingLoading === schedule.id || hasConflict) && [styles.bookButtonDisabled, { backgroundColor: themeColors.textMuted }]
                            ]}
                            onPress={() => handleBookSession(therapist.id, schedule.id, therapist.name, schedule)}
                            disabled={bookingLoading === schedule.id || hasConflict}
                          >
                            {bookingLoading === schedule.id ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : hasConflict ? (
                              <MaterialCommunityIcons name="calendar-remove" size={16} color="white" />
                            ) : (
                              <MaterialCommunityIcons name="calendar-check" size={16} color="white" />
                            )}
                            <Text style={styles.bookButtonText}>
                              {bookingLoading === schedule.id ? 'Booking...' : hasConflict ? 'Conflict' : 'Book'}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })
                  ) : (
                    <View style={[styles.scheduleItem, { 
                      backgroundColor: selectedTheme === 'dark' ? themeColors.surface : themeColors.backgroundSecondary,
                      borderColor: themeColors.border,
                      borderWidth: 1
                    }]}>
                      <Text style={[styles.noScheduleText, { color: themeColors.textMuted }]}>No schedules available</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
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
    paddingTop: Platform.OS === 'android' ? 25 : 10, // Add spacing from status bar on Android
  },
  header: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  therapistCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nameContainer: {
    flex: 1,
  },
  therapistName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  therapistTitle: {
    fontSize: 14,
    marginTop: 2,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  scheduleSection: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  scheduleItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  scheduleLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  scheduleValue: {
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
  },
  noScheduleText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'right',
  },
  conflictWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 8,
    gap: 6,
  },
  conflictText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  bookButtonPressed: {
    opacity: 0.8,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
