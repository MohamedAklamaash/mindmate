import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
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
