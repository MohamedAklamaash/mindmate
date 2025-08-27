# MindMate Onboarding Answer Management Implementation

## Overview
This implementation adds comprehensive answer management to the MindMate onboarding flow. All user responses are collected throughout the questionnaire and saved to Firestore when the user completes QuestionTen.

## Components Modified

### 1. AnswerManager.tsx (New File)
- **Purpose**: Central store for managing all user answers during onboarding
- **Features**:
  - Zustand-based state management
  - Type-safe interfaces for all question answers
  - Individual setters for each question's answers
  - Clear answers functionality
  - Get all answers functionality

### 2. Firebase Service (New File)
- **Location**: `services/firebaseService.ts`
- **Purpose**: Handle Firestore operations for user data
- **Features**:
  - Save new user with onboarding answers
  - Update existing user with answers
  - Proper error handling
  - Type-safe interfaces

### 3. User Store Updates
- **File**: `store/userStore.ts`
- **Changes**:
  - Added `firestoreId` field to User type
  - Added `setUserFirestoreId` method
  - Enhanced user data structure

### 4. Question Components Updated
All question components (QuestionOne through QuestionNine) have been updated to:
- Import and use the AnswerManager
- Save answers to the central store when Continue is clicked
- Navigate to the next question after saving answers

#### Question Types and Data Stored:
- **NamePage**: User's chosen nickname
- **QuestionOne**: Multiple stress factors + optional "other" text
- **QuestionTwo**: Sleep routine (single choice)
- **QuestionThree**: Energy level (single choice) 
- **QuestionFour**: Exercise frequency (single choice)
- **QuestionFive**: Substance coping (single choice)
- **QuestionSix**: Support system (single choice)
- **QuestionSeven**: Last relaxed time (single choice)
- **QuestionEight**: Goals (multiple choice)
- **QuestionNine**: AI communication style (single choice)

### 5. NamePage Updates
- **Enhanced Functionality**:
  - No longer saves directly to Firestore
  - Saves user's nickname to AnswerManager using `setUserName()`
  - Removed Firebase imports and configuration
  - Simplified save logic - just stores name and proceeds to questions

### 6. QuestionTen (Final Step)
- **Enhanced Functionality**:
  - Collects all answers + user name from AnswerManager
  - Uses the nickname from AnswerManager for Firestore user document
  - Saves complete user data + answers to Firestore
  - Handles loading states and error scenarios
  - Provides user feedback during save process
  - Clears answer store after successful save

## Data Flow

1. **Name Collection**: NamePage saves the user's chosen nickname to AnswerManager (no longer saves directly to Firestore)
2. **Answer Collection**: Each question component saves its answer to the AnswerManager when Continue is clicked
3. **Data Aggregation**: QuestionTen retrieves all collected answers + user name using `getAllAnswers()`
4. **Firestore Storage**: Complete user profile (using name from AnswerManager) and all answers are saved to the "users" collection
5. **Cleanup**: Answer store is cleared and user is authenticated

## Firestore Document Structure

```typescript
{
  id: "firestore-document-id",
  nickname: "user-chosen-nickname", // Now comes from AnswerManager
  email: "user@example.com",
  userType: "user",
  isActive: true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  onboardingAnswers: {
    userName: "user-chosen-nickname", // Stored separately in answers too
    questionOne: { stressItems: ["studies", "career"], other: "" },
    questionTwo: { sleepRoutine: "irregular" },
    questionThree: { energyLevel: "tired" },
    questionFour: { exerciseFrequency: "rarely" },
    questionFive: { substanceCoping: "never" },
    questionSix: { supportSystem: "sometimes" },
    questionSeven: { selectedValue: "lastmonth" },
    questionEight: { goals: ["stress-relief", "focus"] },
    questionNine: { selectedValue: "supportive" }
  }
}
```

## Error Handling

- Network connectivity issues are handled gracefully
- User-friendly error messages with retry options
- Loading states prevent multiple submissions
- Proper validation ensures required data is present

## Benefits

1. **Complete Data Collection**: All user responses are preserved
2. **Personalization Ready**: Rich user data enables personalized AI interactions
3. **Analytics Capable**: Comprehensive data for insights and improvements
4. **Robust Error Handling**: Graceful handling of edge cases
5. **Type Safety**: Full TypeScript support prevents runtime errors
6. **Scalable Architecture**: Easy to add new questions or modify existing ones

## Usage

The system works automatically - users simply go through the onboarding flow as normal, and their answers are automatically collected and saved when they complete the final step. No additional user action is required.
