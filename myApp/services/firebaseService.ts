import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, getDoc, deleteDoc } from 'firebase/firestore';
import { QuestionAnswers } from '../components/ui/questions/AnswerManager';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4u9wYxej-LbKAl7NIbEJTlrt5Y5a5Xvc",
  authDomain: "mindmate-52779.firebaseapp.com",
  projectId: "mindmate-52779",
  storageBucket: "mindmate-52779.firebasestorage.app",
  messagingSenderId: "772843818203",
  appId: "1:772843818203:android:95a264b8688342602bd0fe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// User data interface for Firestore
export interface UserData {
  id?: string;
  nickname: string;
  email: string | null;
  userType: 'user' | 'therapist';
  createdAt: any;
  updatedAt: any;
  isActive: boolean;
  onboardingAnswers?: QuestionAnswers;
}

// Therapist session interface
export interface TherapistSession {
  id?: string;
  userId: string;
  therapistId: string;
  therapistName: string;
  scheduleId: string;
  fieldType: string;
  date: string;
  startTime: string;
  duration: number;
  price: number;
  status: 'booked' | 'completed' | 'cancelled';
  bookedAt: any;
  createdAt: any;
}

// Save user data with onboarding answers to Firestore
export const saveUserWithAnswers = async (userData: Omit<UserData, 'id' | 'createdAt' | 'updatedAt'>, answers: QuestionAnswers): Promise<string> => {
  try {
    const userDocData: UserData = {
      ...userData,
      onboardingAnswers: answers,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'users'), userDocData);
    console.log('User document written with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding user document: ', error);
    throw error;
  }
};

// Update existing user with onboarding answers
export const updateUserAnswers = async (userId: string, answers: QuestionAnswers): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      onboardingAnswers: answers,
      updatedAt: serverTimestamp(),
    });
    console.log('User answers updated successfully');
  } catch (error) {
    console.error('Error updating user answers: ', error);
    throw error;
  }
};

// Therapist data interface for Firestore
export interface TherapistData {
  id?: string;
  name: string;
  password?: string; // In a real app, this should be a securely hashed password
  createdAt: any;
}

// Save therapist data to Firestore
export const saveTherapistData = async (therapistData: Omit<TherapistData, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const therapistDocData = {
      ...therapistData,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'therapists'), therapistDocData);
    console.log('Therapist document written with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding therapist document: ', error);
    throw error;
  }
};

// Schedule data interface
export interface ScheduleData {
  fieldType: string;
  date: string;
  startTime: string;
  duration: number; // Duration in minutes
  price: number;
  userId: string | null; // User ID who booked the session, null if not booked
  booked: boolean; // Whether the session is booked or not
  createdAt: any;
}

// Save therapist schedule to Firestore
export const saveTherapistSchedule = async (therapistId: string, scheduleData: Omit<ScheduleData, 'createdAt' | 'userId' | 'booked'>): Promise<void> => {
  try {
    const scheduleDocData = {
      ...scheduleData,
      userId: null, // Default to null (not booked)
      booked: false, // Default to false (not booked)
      createdAt: serverTimestamp(),
    };

    // Add schedule to a subcollection under the therapist document
    await addDoc(collection(db, 'therapists', therapistId, 'schedules'), scheduleDocData);
    console.log('Schedule saved successfully for therapist:', therapistId);
  } catch (error) {
    console.error('Error saving therapist schedule: ', error);
    throw error;
  }
};

// Update therapist description
export const updateTherapistDescription = async (therapistId: string, description: string): Promise<void> => {
  try {
    const therapistRef = doc(db, 'therapists', therapistId);
    await updateDoc(therapistRef, {
      description: description,
      updatedAt: serverTimestamp(),
    });
    console.log('Therapist description updated successfully');
  } catch (error) {
    console.error('Error updating therapist description: ', error);
    throw error;
  }
};

// Get all therapists with their schedules
export const getAllTherapists = async (): Promise<any[]> => {
  try {
    const therapistsSnapshot = await getDocs(collection(db, 'therapists'));
    const therapists = [];

    for (const therapistDoc of therapistsSnapshot.docs) {
      const therapistData = therapistDoc.data();
      
      // Get schedules for this therapist
      const schedulesSnapshot = await getDocs(collection(db, 'therapists', therapistDoc.id, 'schedules'));
      const schedules = schedulesSnapshot.docs.map(scheduleDoc => scheduleDoc.data());

      therapists.push({
        id: therapistDoc.id,
        name: therapistData.name,
        description: therapistData.description,
        schedules: schedules,
      });
    }

    return therapists;
  } catch (error) {
    console.error('Error fetching therapists: ', error);
    throw error;
  }
};

// Get a specific therapist's data
export const getTherapistData = async (therapistId: string): Promise<any> => {
  try {
    const therapistRef = doc(db, 'therapists', therapistId);
    const therapistDoc = await getDoc(therapistRef);
    
    if (therapistDoc.exists()) {
      return therapistDoc.data();
    } else {
      throw new Error('Therapist not found');
    }
  } catch (error) {
    console.error('Error fetching therapist data: ', error);
    throw error;
  }
};

// Get therapist's schedules
export const getTherapistSchedules = async (therapistId: string): Promise<any[]> => {
  try {
    const schedulesSnapshot = await getDocs(collection(db, 'therapists', therapistId, 'schedules'));
    const schedules = schedulesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return schedules;
  } catch (error) {
    console.error('Error fetching therapist schedules: ', error);
    throw error;
  }
};

// Book a therapist session
export const bookTherapistSession = async (therapistId: string, scheduleId: string, userId: string): Promise<void> => {
  try {
    // Get the schedule details first
    const scheduleRef = doc(db, 'therapists', therapistId, 'schedules', scheduleId);
    const scheduleDoc = await getDoc(scheduleRef);
    
    if (!scheduleDoc.exists()) {
      throw new Error('Schedule not found');
    }
    
    const scheduleData = scheduleDoc.data();
    
    // Get therapist details
    const therapistRef = doc(db, 'therapists', therapistId);
    const therapistDoc = await getDoc(therapistRef);
    
    if (!therapistDoc.exists()) {
      throw new Error('Therapist not found');
    }
    
    const therapistData = therapistDoc.data();
    
    // Update the schedule to mark it as booked and assign the user
    await updateDoc(scheduleRef, {
      userId: userId,
      booked: true,
      bookedAt: serverTimestamp()
    });

    // Store the session in the user's therapist_sessions subcollection
    const sessionData = {
      userId: userId,
      therapistId: therapistId,
      therapistName: therapistData.name || 'Unknown Therapist',
      scheduleId: scheduleId,
      fieldType: scheduleData.fieldType,
      date: scheduleData.date,
      startTime: scheduleData.startTime,
      duration: scheduleData.duration,
      price: scheduleData.price,
      status: 'booked',
      bookedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    // Add session to user's therapist_sessions subcollection
    await addDoc(collection(db, 'users', userId, 'therapist_sessions'), sessionData);
    
  } catch (error) {
    console.error('Error booking session: ', error);
    throw error;
  }
};

// Get available schedules (not booked) for all therapists
export const getAllAvailableTherapists = async (): Promise<any[]> => {
  try {
    const therapistsSnapshot = await getDocs(collection(db, 'therapists'));
    const therapists: any[] = [];

    for (const therapistDoc of therapistsSnapshot.docs) {
      const therapistData = therapistDoc.data();
      const schedulesSnapshot = await getDocs(collection(db, 'therapists', therapistDoc.id, 'schedules'));
      
      if (schedulesSnapshot.docs.length > 0) {
        // Filter out booked schedules, only include available ones
        const availableSchedules = schedulesSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter((schedule: any) => !schedule.booked); // Only include non-booked schedules

        // Only include therapist if they have available schedules
        if (availableSchedules.length > 0) {
          therapists.push({
            id: therapistDoc.id,
            ...therapistData,
            schedules: availableSchedules
          });
        }
      }
    }

    return therapists;
  } catch (error) {
    console.error('Error fetching available therapists: ', error);
    throw error;
  }
};

// Get booked sessions for a specific user
export const getUserBookedSessions = async (userId: string): Promise<any[]> => {
  try {
    const therapistsSnapshot = await getDocs(collection(db, 'therapists'));
    const bookedSessions: any[] = [];

    for (const therapistDoc of therapistsSnapshot.docs) {
      const therapistData = therapistDoc.data();
      const schedulesSnapshot = await getDocs(collection(db, 'therapists', therapistDoc.id, 'schedules'));
      
      const userSessions = schedulesSnapshot.docs
        .map(doc => ({
          id: doc.id,
          therapistId: therapistDoc.id,
          therapistName: therapistData.name,
          ...doc.data()
        }))
        .filter((schedule: any) => schedule.booked && schedule.userId === userId);

      bookedSessions.push(...userSessions);
    }

    return bookedSessions;
  } catch (error) {
    console.error('Error fetching user booked sessions: ', error);
    throw error;
  }
};

// Get booked sessions for a specific therapist
export const getTherapistBookedSessions = async (therapistId: string): Promise<any[]> => {
  try {
    const schedulesSnapshot = await getDocs(collection(db, 'therapists', therapistId, 'schedules'));
    
    const bookedSessions = schedulesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((schedule: any) => schedule.booked === true);

    return bookedSessions;
  } catch (error) {
    console.error('Error fetching therapist booked sessions: ', error);
    throw error;
  }
};

// Get user data by ID
export const getUserData = async (userId: string): Promise<any> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error fetching user data: ', error);
    throw error;
  }
};

// Get therapist's schedules for a specific date
export const getTherapistSchedulesForDate = async (therapistId: string, date: string): Promise<any[]> => {
  try {
    const schedulesSnapshot = await getDocs(collection(db, 'therapists', therapistId, 'schedules'));
    
    const schedulesForDate = schedulesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((schedule: any) => schedule.date === date);

    return schedulesForDate;
  } catch (error) {
    console.error('Error fetching therapist schedules for date: ', error);
    throw error;
  }
};

// Get all booked sessions for a specific user from their therapist_sessions subcollection
export const getUserTherapistSessions = async (userId: string): Promise<TherapistSession[]> => {
  try {
    // Query the user's therapist_sessions subcollection
    const sessionsSnapshot = await getDocs(collection(db, 'users', userId, 'therapist_sessions'));
    
    const userSessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TherapistSession));

    // Sort by date and time (newest first)
    userSessions.sort((a: TherapistSession, b: TherapistSession) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });

    return userSessions;
  } catch (error) {
    console.error('Error fetching user therapist sessions: ', error);
    throw error;
  }
};

// Get user session statistics
export const getUserSessionStats = async (userId: string): Promise<{
  totalSessions: number;
  upcomingSessions: number;
  completedSessions: number;
}> => {
  try {
    const sessions = await getUserTherapistSessions(userId);
    const now = new Date();
    
    const upcomingSessions = sessions.filter(session => {
      const sessionDateTime = new Date(`${session.date}T${session.startTime}`);
      return sessionDateTime > now && session.status === 'booked';
    }).length;
    
    const completedSessions = sessions.filter(session => 
      session.status === 'completed'
    ).length;
    
    return {
      totalSessions: sessions.length,
      upcomingSessions,
      completedSessions
    };
  } catch (error) {
    console.error('Error fetching user session stats: ', error);
    return {
      totalSessions: 0,
      upcomingSessions: 0,
      completedSessions: 0
    };
  }
};
export const getUserAllBookedSessions = async (userId: string): Promise<any[]> => {
  try {
    const therapistsSnapshot = await getDocs(collection(db, 'therapists'));
    const userBookedSessions: any[] = [];

    for (const therapistDoc of therapistsSnapshot.docs) {
      const schedulesSnapshot = await getDocs(collection(db, 'therapists', therapistDoc.id, 'schedules'));
      
      const userSessions = schedulesSnapshot.docs
        .map(doc => ({
          id: doc.id,
          therapistId: therapistDoc.id,
          ...doc.data()
        }))
        .filter((schedule: any) => schedule.booked && schedule.userId === userId);

      userBookedSessions.push(...userSessions);
    }

    return userBookedSessions;
  } catch (error) {
    console.error('Error fetching user booked sessions: ', error);
    throw error;
  }
};

// Check if a user has a time conflict with an existing booking
export const checkUserTimeConflict = (
  userBookedSessions: TherapistSession[], 
  newSessionDate: string, 
  newSessionStartTime: string, 
  newSessionDuration: number
): boolean => {
  const newSessionEndTime = calculateEndTimeFromSchedule(newSessionStartTime, newSessionDuration);
  
  return userBookedSessions.some((bookedSession: TherapistSession) => {
    // Only check sessions on the same date
    if (bookedSession.date !== newSessionDate) return false;
    
    const bookedEndTime = calculateEndTimeFromSchedule(bookedSession.startTime, bookedSession.duration);
    
    // Check for overlap: new session starts before existing ends and new session ends after existing starts
    return (newSessionStartTime < bookedEndTime && newSessionEndTime > bookedSession.startTime);
  });
};

// Helper function to calculate end time from start time and duration
const calculateEndTimeFromSchedule = (startTime: string, durationMinutes: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
};

// Update therapist schedule
export const updateTherapistSchedule = async (therapistId: string, scheduleId: string, scheduleData: Omit<ScheduleData, 'createdAt' | 'userId' | 'booked'>): Promise<void> => {
  try {
    const scheduleRef = doc(db, 'therapists', therapistId, 'schedules', scheduleId);
    await updateDoc(scheduleRef, {
      ...scheduleData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating schedule: ', error);
    throw error;
  }
};

// Delete therapist schedule
export const deleteTherapistSchedule = async (therapistId: string, scheduleId: string): Promise<void> => {
  try {
    const scheduleRef = doc(db, 'therapists', therapistId, 'schedules', scheduleId);
    await deleteDoc(scheduleRef);
  } catch (error) {
    console.error('Error deleting schedule: ', error);
    throw error;
  }
};
