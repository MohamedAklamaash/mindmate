import { create } from 'zustand';

// Define types for all question answers
export interface QuestionAnswers {
  userName: string | null;
  questionOne: {
    stressItems: string[];
    other: string;
  } | null;
  questionTwo: {
    sleepRoutine: string;
  } | null;
  questionThree: {
    energyLevel: string;
  } | null;
  questionFour: {
    exerciseFrequency: string;
  } | null;
  questionFive: {
    substanceCoping: string;
  } | null;
  questionSix: {
    supportSystem: string;
  } | null;
  questionSeven: {
    selectedValue: string;
  } | null;
  questionEight: {
    goals: string[];
  } | null;
  questionNine: {
    selectedValue: string;
  } | null;
}

// Answer manager store type
type AnswerStore = {
  answers: QuestionAnswers;
  setUserName: (userName: string) => void;
  setQuestionOneAnswer: (stressItems: string[], other: string) => void;
  setQuestionTwoAnswer: (sleepRoutine: string) => void;
  setQuestionThreeAnswer: (energyLevel: string) => void;
  setQuestionFourAnswer: (exerciseFrequency: string) => void;
  setQuestionFiveAnswer: (substanceCoping: string) => void;
  setQuestionSixAnswer: (supportSystem: string) => void;
  setQuestionSevenAnswer: (selectedValue: string) => void;
  setQuestionEightAnswer: (goals: string[]) => void;
  setQuestionNineAnswer: (selectedValue: string) => void;
  clearAnswers: () => void;
  getAllAnswers: () => QuestionAnswers;
};

// Create the answer store
export const useAnswerStore = create<AnswerStore>((set, get) => ({
  answers: {
    userName: null,
    questionOne: null,
    questionTwo: null,
    questionThree: null,
    questionFour: null,
    questionFive: null,
    questionSix: null,
    questionSeven: null,
    questionEight: null,
    questionNine: null,
  },
  
  setUserName: (userName: string) =>
    set((state) => ({
      answers: {
        ...state.answers,
        userName
      }
    })),
  
  setQuestionOneAnswer: (stressItems: string[], other: string) =>
    set((state) => ({
      answers: {
        ...state.answers,
        questionOne: { stressItems, other }
      }
    })),
    
  setQuestionTwoAnswer: (sleepRoutine: string) =>
    set((state) => ({
      answers: {
        ...state.answers,
        questionTwo: { sleepRoutine }
      }
    })),
    
  setQuestionThreeAnswer: (energyLevel: string) =>
    set((state) => ({
      answers: {
        ...state.answers,
        questionThree: { energyLevel }
      }
    })),
    
  setQuestionFourAnswer: (exerciseFrequency: string) =>
    set((state) => ({
      answers: {
        ...state.answers,
        questionFour: { exerciseFrequency }
      }
    })),
    
  setQuestionFiveAnswer: (substanceCoping: string) =>
    set((state) => ({
      answers: {
        ...state.answers,
        questionFive: { substanceCoping }
      }
    })),
    
  setQuestionSixAnswer: (supportSystem: string) =>
    set((state) => ({
      answers: {
        ...state.answers,
        questionSix: { supportSystem }
      }
    })),
    
  setQuestionSevenAnswer: (selectedValue: string) =>
    set((state) => ({
      answers: {
        ...state.answers,
        questionSeven: { selectedValue }
      }
    })),
    
  setQuestionEightAnswer: (goals: string[]) =>
    set((state) => ({
      answers: {
        ...state.answers,
        questionEight: { goals }
      }
    })),
    
  setQuestionNineAnswer: (selectedValue: string) =>
    set((state) => ({
      answers: {
        ...state.answers,
        questionNine: { selectedValue }
      }
    })),
    
  clearAnswers: () =>
    set({
      answers: {
        userName: null,
        questionOne: null,
        questionTwo: null,
        questionThree: null,
        questionFour: null,
        questionFive: null,
        questionSix: null,
        questionSeven: null,
        questionEight: null,
        questionNine: null,
      }
    }),
    
  getAllAnswers: () => get().answers,
}));