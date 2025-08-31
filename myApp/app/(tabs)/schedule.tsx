import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView, SafeAreaView, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '@/store/userStore';
import { saveTherapistSchedule, getTherapistSchedules, getTherapistSchedulesForDate, updateTherapistSchedule, deleteTherapistSchedule } from '@/services/firebaseService';

// Generate date options for the next 30 days
const generateDateOptions = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const displayString = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    dates.push({ value: dateString, display: displayString });
  }
  return dates;
};

// Generate time options (9 AM to 6 PM, 30-minute intervals)
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayString = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      times.push({ value: timeString, display: displayString });
    }
  }
  return times;
};

// Calculate available time slots for a given date and existing schedules
const getAvailableTimeSlots = (existingSchedules: any[], selectedDuration: number) => {
  const allTimeSlots = generateTimeOptions();
  const availableSlots = [];

  for (const timeSlot of allTimeSlots) {
    const startTime = timeSlot.value;
    const endTime = calculateEndTimeFromString(startTime, selectedDuration);
    
    // Check if this time slot conflicts with any existing schedule
    const hasConflict = existingSchedules.some((schedule: any) => {
      const scheduleStart = schedule.startTime;
      const scheduleEnd = calculateEndTimeFromString(schedule.startTime, schedule.duration);
      
      // Check for overlap: new session starts before existing ends and new session ends after existing starts
      return (startTime < scheduleEnd && endTime > scheduleStart);
    });

    if (!hasConflict) {
      availableSlots.push(timeSlot);
    }
  }

  return availableSlots;
};

// Helper function to calculate end time from start time and duration
const calculateEndTimeFromString = (startTime: string, durationMinutes: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
};

// Duration options
const durationOptions = [
  { value: 30, display: '30mins' },
  { value: 45, display: '45mins' },
  { value: 60, display: '1hr' }
];

const dateOptions = generateDateOptions();
const timeOptions = generateTimeOptions();

export default function ScheduleScreen() {
  const [fieldType, setFieldType] = useState('');
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);
  const [startTime, setStartTime] = useState(timeOptions[0].value);
  const [duration, setDuration] = useState(60); // Default to 1 hour
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [existingSchedules, setExistingSchedules] = useState<any[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schedulesForSelectedDate, setSchedulesForSelectedDate] = useState<any[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState(timeOptions);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<string | null>(null);
  
  const user = useUserStore((state) => state.user);

  // Fetch existing schedules
  const fetchSchedules = async () => {
    if (!user?.firestoreId) return;
    
    try {
      const schedules = await getTherapistSchedules(user.firestoreId);
      // Filter out booked sessions - only show available schedules
      const availableSchedules = schedules.filter((schedule: any) => !schedule.booked);
      setExistingSchedules(availableSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  // Fetch schedules for the selected date
  const fetchSchedulesForDate = async (date: string) => {
    if (!user?.firestoreId) return;
    
    try {
      const schedules = await getTherapistSchedulesForDate(user.firestoreId, date);
      setSchedulesForSelectedDate(schedules);
      
      // Update available time slots based on existing schedules and selected duration
      const availableSlots = getAvailableTimeSlots(schedules, duration);
      setAvailableTimeSlots(availableSlots);
      
      // Reset start time if current selection is not available
      if (availableSlots.length > 0 && !availableSlots.find(slot => slot.value === startTime)) {
        setStartTime(availableSlots[0].value);
      }
    } catch (error) {
      console.error('Error fetching schedules for date:', error);
    }
  };

  // Update available time slots when duration changes
  const updateAvailableTimeSlots = () => {
    const availableSlots = getAvailableTimeSlots(schedulesForSelectedDate, duration);
    setAvailableTimeSlots(availableSlots);
    
    // Reset start time if current selection is not available
    if (availableSlots.length > 0 && !availableSlots.find(slot => slot.value === startTime)) {
      setStartTime(availableSlots[0].value);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedules();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSchedules();
  }, [user?.firestoreId]);

  // Fetch schedules for selected date when date changes
  useEffect(() => {
    if (user?.firestoreId && selectedDate) {
      fetchSchedulesForDate(selectedDate);
    }
  }, [selectedDate, user?.firestoreId]);

  // Update available time slots when duration changes
  useEffect(() => {
    updateAvailableTimeSlots();
  }, [duration]);

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTimeStr: string, durationMinutes: number) => {
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleScheduleSubmit = async () => {
    if (!fieldType.trim() || !selectedDate || !startTime || !duration || !price.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user?.firestoreId) {
      Alert.alert('Error', 'Therapist ID not found');
      return;
    }

    setIsLoading(true);
    try {
      await saveTherapistSchedule(user.firestoreId, {
        fieldType: fieldType.trim(),
        date: selectedDate,
        startTime: startTime,
        duration: duration, // Store duration in minutes
        price: parseFloat(price),
      });

      Alert.alert('Success', 'Schedule created successfully!');
      setFieldType('');
      setSelectedDate(dateOptions[0].value);
      setStartTime(timeOptions[0].value);
      setDuration(60);
      setPrice('');
      setShowForm(false);
      
      // Refresh the schedules list and available time slots
      await fetchSchedules();
      await fetchSchedulesForDate(selectedDate);
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'Failed to create schedule. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSchedule = (schedule: any) => {
    setEditingSchedule(schedule);
    setFieldType(schedule.fieldType);
    setSelectedDate(schedule.date);
    setStartTime(schedule.startTime);
    setDuration(schedule.duration);
    setPrice(schedule.price.toString());
    setShowForm(true);
  };

  const handleUpdateSchedule = async () => {
    if (!fieldType.trim() || !selectedDate || !startTime || !duration || !price.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user?.firestoreId || !editingSchedule) {
      Alert.alert('Error', 'Invalid data');
      return;
    }

    setIsLoading(true);
    try {
      await updateTherapistSchedule(user.firestoreId, editingSchedule.id, {
        fieldType: fieldType.trim(),
        date: selectedDate,
        startTime: startTime,
        duration: duration,
        price: parseFloat(price),
      });

      Alert.alert('Success', 'Schedule updated successfully!');
      setFieldType('');
      setSelectedDate(dateOptions[0].value);
      setStartTime(timeOptions[0].value);
      setDuration(60);
      setPrice('');
      setEditingSchedule(null);
      setShowForm(false);
      
      // Refresh the schedules list and available time slots
      await fetchSchedules();
      await fetchSchedulesForDate(selectedDate);
    } catch (error) {
      console.error('Error updating schedule:', error);
      Alert.alert('Error', 'Failed to update schedule. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSchedule = (scheduleId: string, scheduleInfo: string) => {
    Alert.alert(
      'Delete Schedule',
      `Are you sure you want to delete this schedule?\n\n${scheduleInfo}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteSchedule(scheduleId),
        },
      ]
    );
  };

  const confirmDeleteSchedule = async (scheduleId: string) => {
    if (!user?.firestoreId) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setDeletingSchedule(scheduleId);
    try {
      await deleteTherapistSchedule(user.firestoreId, scheduleId);
      Alert.alert('Success', 'Schedule deleted successfully!');
      
      // Refresh the schedules list
      await fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      Alert.alert('Error', 'Failed to delete schedule. Please try again.');
    } finally {
      setDeletingSchedule(null);
    }
  };

  const cancelEdit = () => {
    setEditingSchedule(null);
    setFieldType('');
    setSelectedDate(dateOptions[0].value);
    setStartTime(timeOptions[0].value);
    setDuration(60);
    setPrice('');
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <LinearGradient colors={['#EBF4FF', '#F3E8FF', '#FDF2F8']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.mainContent}>
              <Text style={styles.title}>Schedule</Text>
              <Text style={styles.subtitle}>Manage your therapy sessions</Text>
              
              {/* Existing Schedules */}
              {isLoadingSchedules ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={styles.loadingText}>Loading schedules...</Text>
                </View>
              ) : existingSchedules.length > 0 ? (
                <View style={styles.schedulesContainer}>
                  <Text style={styles.sectionTitle}>Available Sessions</Text>
                  {existingSchedules.map((schedule, index) => {
                    const endTime = calculateEndTime(schedule.startTime, schedule.duration);
                    const formattedDate = new Date(schedule.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    });
                    
                    return (
                      <View key={schedule.id || index} style={styles.scheduleCard}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.fieldType}>{schedule.fieldType}</Text>
                          <View style={styles.cardActions}>
                            <Text style={styles.price}>${schedule.price}</Text>
                            <View style={styles.actionButtons}>
                              <Pressable
                                style={({ pressed }) => [
                                  styles.actionButton,
                                  styles.editButton,
                                  pressed && styles.actionButtonPressed
                                ]}
                                onPress={() => handleEditSchedule(schedule)}
                              >
                                <MaterialCommunityIcons name="pencil" size={16} color="#2563EB" />
                              </Pressable>
                              <Pressable
                                style={({ pressed }) => [
                                  styles.actionButton,
                                  styles.deleteButton,
                                  pressed && styles.actionButtonPressed,
                                  deletingSchedule === schedule.id && styles.actionButtonDisabled
                                ]}
                                onPress={() => handleDeleteSchedule(
                                  schedule.id, 
                                  `${schedule.fieldType} - ${formattedDate} at ${schedule.startTime}`
                                )}
                                disabled={deletingSchedule === schedule.id}
                              >
                                {deletingSchedule === schedule.id ? (
                                  <ActivityIndicator size="small" color="#DC2626" />
                                ) : (
                                  <MaterialCommunityIcons name="delete" size={16} color="#DC2626" />
                                )}
                              </Pressable>
                            </View>
                          </View>
                        </View>
                        <View style={styles.cardDetails}>
                          <View style={styles.detailRow}>
                            <MaterialCommunityIcons name="calendar" size={16} color="#6B7280" />
                            <Text style={styles.detailText}>{formattedDate}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <MaterialCommunityIcons name="clock" size={16} color="#6B7280" />
                            <Text style={styles.detailText}>
                              {schedule.startTime} - {endTime} ({schedule.duration}min)
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="calendar-blank" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No schedules yet</Text>
                  <Text style={styles.emptySubtext}>Create your first therapy session</Text>
                </View>
              )}
              
              <Pressable 
                style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                onPress={() => setShowForm(true)}
              >
                <MaterialCommunityIcons name="plus" size={24} color="white" />
                <Text style={styles.addButtonText}>Add New Schedule</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#EBF4FF', '#F3E8FF', '#FDF2F8']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Pressable onPress={editingSchedule ? cancelEdit : () => setShowForm(false)} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#4F46E5" />
            </Pressable>
            <Text style={styles.headerTitle}>{editingSchedule ? 'Edit Schedule' : 'Create Schedule'}</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Field Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Anxiety, Depression, Couples Therapy"
                value={fieldType}
                onChangeText={setFieldType}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScrollView}>
                <View style={styles.optionsContainer}>
                  {dateOptions.map((date) => (
                    <Pressable
                      key={date.value}
                      style={[
                        styles.optionButton,
                        selectedDate === date.value && styles.selectedOption
                      ]}
                      onPress={() => setSelectedDate(date.value)}
                    >
                      <Text style={[
                        styles.optionText,
                        selectedDate === date.value && styles.selectedOptionText
                      ]}>
                        {date.display}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Show existing schedules for selected date */}
            {schedulesForSelectedDate.length > 0 && (
              <View style={styles.existingSchedulesInfo}>
                <Text style={styles.existingSchedulesLabel}>
                  Existing sessions on {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}:
                </Text>
                {schedulesForSelectedDate.map((schedule, index) => (
                  <Text key={index} style={styles.existingScheduleItem}>
                    • {schedule.startTime} - {calculateEndTimeFromString(schedule.startTime, schedule.duration)} 
                    ({schedule.duration}min) - {schedule.fieldType}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start Time</Text>
              {availableTimeSlots.length === 0 ? (
                <View style={styles.noTimeSlotsContainer}>
                  <Text style={styles.noTimeSlotsText}>No available time slots for this date and duration</Text>
                  <Text style={styles.noTimeSlotsSubtext}>Try selecting a different date or shorter duration</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScrollView}>
                  <View style={styles.optionsContainer}>
                    {availableTimeSlots.map((time) => (
                      <Pressable
                        key={`start-${time.value}`}
                        style={[
                          styles.optionButton,
                          startTime === time.value && styles.selectedOption
                        ]}
                        onPress={() => setStartTime(time.value)}
                      >
                        <Text style={[
                          styles.optionText,
                          startTime === time.value && styles.selectedOptionText
                        ]}>
                          {time.display}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Duration</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScrollView}>
                <View style={styles.optionsContainer}>
                  {durationOptions.map((durationOption) => (
                    <Pressable
                      key={`duration-${durationOption.value}`}
                      style={[
                        styles.optionButton,
                        duration === durationOption.value && styles.selectedOption
                      ]}
                      onPress={() => setDuration(durationOption.value)}
                    >
                      <Text style={[
                        styles.optionText,
                        duration === durationOption.value && styles.selectedOptionText
                      ]}>
                        {durationOption.display}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <Text style={styles.calculatedTime}>
                End time: {calculateEndTime(startTime, duration)}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter session price"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>

            <Pressable
              style={[
                styles.submitButton, 
                (isLoading || availableTimeSlots.length === 0) && styles.disabledButton
              ]}
              onPress={editingSchedule ? handleUpdateSchedule : handleScheduleSubmit}
              disabled={isLoading || availableTimeSlots.length === 0}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? (editingSchedule ? 'Updating...' : 'Creating...') : (editingSchedule ? 'Update Schedule' : 'Create Schedule')}
              </Text>
            </Pressable>
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
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 40,
  },
  addButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  optionsScrollView: {
    maxHeight: 50,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedOptionText: {
    color: 'white',
  },
  calculatedTime: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#A5B4FC',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 16,
  },
  schedulesContainer: {
    marginBottom: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  scheduleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  fieldType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  cardDetails: {
    gap: 8,
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
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginBottom: 20,
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
  noTimeSlotsContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  noTimeSlotsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
  },
  noTimeSlotsSubtext: {
    fontSize: 12,
    color: '#B45309',
    textAlign: 'center',
    marginTop: 4,
  },
  existingSchedulesInfo: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  existingSchedulesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4338CA',
    marginBottom: 8,
  },
  existingScheduleItem: {
    fontSize: 12,
    color: '#6366F1',
    marginBottom: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  editButton: {
    backgroundColor: '#DBEAFE',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
});
