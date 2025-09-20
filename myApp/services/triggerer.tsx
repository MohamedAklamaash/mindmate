import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { AppState, AppStateStatus, DeviceEventEmitter } from "react-native";
import { useUserStore } from '../store/userStore';

// Server base URLs
const DEFAULT_SERVER = "https://mind-mate-two-tau.vercel.app";
const LOCAL_SERVER = "http://192.168.0.92:8000";

// App exit handler service
export const AppExitHandler = {
  // Function to call the app exit endpoint
  triggerAppExit: async () => {
    try {
      const serverUrl = DEFAULT_SERVER;
      console.log('App exit processed: Triggering endpoint call.');
      // Read persistent user id from the store (if available)
      const u_id = useUserStore.getState().u_id || 'anonymous';

      // POST user_id as JSON to match server's /app-exit signature
      const response = await fetch(`${serverUrl}/app-exit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: u_id }),
      });

      const text = await response.text().catch(() => null);
      let parsed = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch (e) {
        parsed = text;
      }

      if (response.ok) {
        console.log('App exit processed successfully:', parsed);
        // Save emotion_sentiment to userStore if available
        if (parsed && parsed.emotion_sentiment) {
          try {
            useUserStore.getState().setCurrentEmotion(parsed.emotion_sentiment);
            console.log('Saved emotion to store:', parsed.emotion_sentiment);
            // Emit an appOpened event with the emotion so front-end can refresh quotes
            try {
              DeviceEventEmitter.emit('appOpened', { emotion_sentiment: parsed.emotion_sentiment });
              console.log('Emitted appOpened event with emotion_sentiment from app-exit.');
            } catch (emitErr) {
              console.warn('Failed to emit appOpened event after app-exit:', emitErr);
            }
          } catch (e) {
            console.warn('Failed to save emotion to store:', e);
          }
        }
      } else {
        console.error('Failed to process app exit:', response.status, parsed);
      }
    } catch (error) {
      console.error('Error calling app exit endpoint:', error);
    }
  }
};

// Hard reset handler service
export const HardResetHandler = {
  // Function to call the hard reset endpoint
  triggerHardReset: async (user_id?: string) => {
    try {
      const serverUrl = LOCAL_SERVER;

      const response = await fetch(`${serverUrl}/hard-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user_id || 'anonymous' }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Hard reset processed successfully:', result);
        return { success: true, data: result };
      } else {
        console.error('Failed to process hard reset:', response.status);
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.error('Error calling hard reset endpoint:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

// Hook to handle app state changes and trigger app exit
export const useAppExitHandler = () => {
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App is being backgrounded or becoming inactive
        AppExitHandler.triggerAppExit();
      }
    };

    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup function
    return () => {
      subscription?.remove();
    };
  }, []);
};

// Component to be used in your main app layout
export const AppExitTrigger = () => {
  useAppExitHandler();
  // On mount, trigger app-open behavior and fetch initial message for the user
  useEffect(() => {
    const runOnOpen = async () => {
      try {
        // Read u_id from the Zustand store
        const u_id = useUserStore.getState().u_id || 'anonymous';
        console.log('Running app-open and fetching initial message for user_id:', u_id);

        const initial = await AppOpenHandler.triggerAppOpen(u_id);
        if (initial) {
          console.log('Initial message response:', initial);
        }
      } catch (err) {
        console.error('Error during app open handling:', err);
      }
    };

    runOnOpen();
  }, []);

  return null; // This component doesn't render anything
};

// App open handler service
export const AppOpenHandler = {
  // Function to fetch the initial message when the app opens
  triggerAppOpen: async (user_id?: string) => {
    try {
      const serverUrl = DEFAULT_SERVER;
      const id = user_id || useUserStore.getState().u_id || 'anonymous';

      const res = await fetch(`${serverUrl}/get-initial-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: id }),
      });

      if (!res.ok) {
        console.error('Failed to fetch initial message:', res.status);
        return null;
      }

      const data = await res.json();
      // Log the response as requested
      console.log('Initial message response:', data);
      // Emit an appOpened event so front-end listeners can refresh content
      try {
        DeviceEventEmitter.emit('appOpened', data);
        console.log('Emitted appOpened event with initial message payload.');
      } catch (emitErr) {
        console.warn('Failed to emit appOpened event:', emitErr);
      }
      return data;
    } catch (err) {
      console.error('Error fetching initial message:', err);
      return null;
    }
  }
};
