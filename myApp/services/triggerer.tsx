import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { AppState, AppStateStatus } from "react-native";

// App exit handler service
export const AppExitHandler = {
  // Function to call the app exit endpoint
  triggerAppExit: async () => {
    try {
      const serverUrl = "https://mind-mate-delta.vercel.app"; 
      console.log('App exit processed: Triggering endpoint call.');

      const response = await fetch(`${serverUrl}/app-exit`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('App exit processed successfully:', result);
      } else {
        console.error('Failed to process app exit:', response.status);
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
      const serverUrl = "http://192.168.0.92:8000";

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
  return null; // This component doesn't render anything
};
