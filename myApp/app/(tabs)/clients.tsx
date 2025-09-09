import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getTherapistBookedSessions, getUserData } from '@/services/firebaseService';
import { useUserStore } from '@/store/userStore';

interface BookedSession {
  id: string;
  fieldType: string;
  date: string;
  startTime: string;
  duration: number;
  price: number;
  userId: string;
  booked: boolean;
  bookedAt: any;
  clientName?: string;
}

export default function ClientsScreen() {
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const user = useUserStore((state) => state.user);

  const fetchBookedSessions = async () => {
    if (!user?.firestoreId) return;
    
    try {
      const sessions = await getTherapistBookedSessions(user.firestoreId);
      
      // Fetch client names for each session
      const sessionsWithClientNames = await Promise.all(
        sessions.map(async (session: any) => {
          try {
            if (session.userId) {
              const userData = await getUserData(session.userId);
              return {
                ...session,
                clientName: userData.nickname || 'Unknown Client'
              };
            }
            return {
              ...session,
              clientName: 'Unknown Client'
            };
          } catch (error) {
            console.error('Error fetching client name:', error);
            return {
              ...session,
              clientName: 'Unknown Client'
            };
          }
        })
      );
      
      setBookedSessions(sessionsWithClientNames);
    } catch (error) {
      console.error('Error fetching booked sessions:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookedSessions();
  };

  useEffect(() => {
    fetchBookedSessions();
  }, [user?.firestoreId]);

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

  const calculateEndTime = (startTime: string, duration: number) => {
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = new Date(startDate.getTime() + duration * 60000);
      return endDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid time';
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#EBF4FF', '#F3E8FF', '#FDF2F8']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading upcoming sessions...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#EBF4FF', '#F3E8FF', '#FDF2F8']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Clients</Text>
          <Text style={styles.subtitle}>Upcoming sessions with your clients</Text>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {bookedSessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No upcoming sessions</Text>
              <Text style={styles.emptySubtext}>Booked sessions will appear here</Text>
            </View>
          ) : (
            bookedSessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.clientInfo}>
                    <MaterialCommunityIcons name="account" size={24} color="#4F46E5" />
                    <Text style={styles.clientName}>{session.clientName}</Text>
                  </View>
                  <Text style={styles.price}>${session.price}</Text>
                </View>
                
                <View style={styles.sessionDetails}>
                  <Text style={styles.fieldType}>{session.fieldType}</Text>
                  
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {new Date(session.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="clock" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {formatTime(session.startTime)} - {calculateEndTime(session.startTime, session.duration)} ({formatDuration(session.duration)})
                    </Text>
                  </View>
                  
                  {session.bookedAt && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="calendar-check" size={16} color="#059669" />
                      <Text style={styles.bookedText}>
                        Booked on {new Date(session.bookedAt.toDate()).toLocaleDateString()}
                      </Text>
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
    paddingTop: Platform.OS === 'android' ? 25 : 0, // Add spacing from status bar on Android
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
  sessionCard: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  sessionDetails: {
    gap: 8,
  },
  fieldType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  bookedText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
});
