import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAllAvailableTherapists, bookTherapistSession, getUserAllBookedSessions, checkUserTimeConflict } from '@/services/firebaseService';
import { useUserStore } from '@/store/userStore';

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
  const [userBookedSessions, setUserBookedSessions] = useState<any[]>([]);
  
  const user = useUserStore((state) => state.user);

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
      const bookedSessions = await getUserAllBookedSessions(user.firestoreId);
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
    return (
      <LinearGradient colors={['#EBF4FF', '#F3E8FF', '#FDF2F8']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading therapists...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#EBF4FF', '#F3E8FF', '#FDF2F8']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Available Therapists</Text>
          <Text style={styles.subtitle}>Find the right therapist for you</Text>
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
              <MaterialCommunityIcons name="account-search" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No therapists available</Text>
              <Text style={styles.emptySubtext}>Check back later for new therapists</Text>
            </View>
          ) : (
            therapists.map((therapist) => (
              <View key={therapist.id} style={styles.therapistCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarContainer}>
                    <MaterialCommunityIcons name="account-tie" size={32} color="#4F46E5" />
                  </View>
                  <View style={styles.nameContainer}>
                    <Text style={styles.therapistName}>{therapist.name || 'null'}</Text>
                    <Text style={styles.therapistTitle}>Licensed Therapist</Text>
                  </View>
                </View>

                <View style={styles.descriptionSection}>
                  <Text style={styles.sectionLabel}>Description:</Text>
                  <Text style={styles.descriptionText}>
                    {therapist.description || 'null'}
                  </Text>
                </View>

                <View style={styles.scheduleSection}>
                  <Text style={styles.sectionLabel}>Available Services:</Text>
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
                        <View key={schedule.id || index} style={styles.scheduleItem}>
                          <View style={styles.scheduleRow}>
                            <Text style={styles.scheduleLabel}>Field Type:</Text>
                            <Text style={styles.scheduleValue}>{schedule.fieldType || 'null'}</Text>
                          </View>
                          <View style={styles.scheduleRow}>
                            <Text style={styles.scheduleLabel}>Date:</Text>
                            <Text style={styles.scheduleValue}>
                              {schedule.date ? new Date(schedule.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              }) : 'null'}
                            </Text>
                          </View>
                          <View style={styles.scheduleRow}>
                            <Text style={styles.scheduleLabel}>Start Time:</Text>
                            <Text style={styles.scheduleValue}>{formatTime(schedule.startTime) || 'null'}</Text>
                          </View>
                          <View style={styles.scheduleRow}>
                            <Text style={styles.scheduleLabel}>Duration:</Text>
                            <Text style={styles.scheduleValue}>{formatDuration(schedule.duration) || 'null'}</Text>
                          </View>
                          <View style={styles.scheduleRow}>
                            <Text style={styles.scheduleLabel}>Price:</Text>
                            <Text style={styles.priceText}>${schedule.price || 'null'}</Text>
                          </View>
                          
                          {hasConflict && (
                            <View style={styles.conflictWarning}>
                              <MaterialCommunityIcons name="alert-circle" size={16} color="#DC2626" />
                              <Text style={styles.conflictText}>
                                You have a booking conflict at this time
                              </Text>
                            </View>
                          )}
                          
                          <Pressable
                            style={({ pressed }) => [
                              styles.bookButton,
                              pressed && styles.bookButtonPressed,
                              (bookingLoading === schedule.id || hasConflict) && styles.bookButtonDisabled
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
                    <View style={styles.scheduleItem}>
                      <Text style={styles.noScheduleText}>No schedules available</Text>
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
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
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
    color: '#6B7280',
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
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 4,
  },
  therapistCard: {
    backgroundColor: 'white',
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
    backgroundColor: '#EEF2FF',
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
    color: '#1F2937',
  },
  therapistTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  scheduleSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  scheduleItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scheduleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  scheduleValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 2,
    textAlign: 'right',
  },
  noScheduleText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  priceText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'right',
  },
  conflictWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 8,
    gap: 6,
  },
  conflictText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
    flex: 1,
  },
  bookButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  bookButtonPressed: {
    backgroundColor: '#3730A3',
  },
  bookButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
