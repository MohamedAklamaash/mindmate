import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Background task name
const SPOTIFY_TOKEN_REFRESH_TASK = 'SPOTIFY_TOKEN_REFRESH_TASK';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'spotify_access_token',
  TOKEN_EXPIRATION: 'spotify_token_expiration',
  LAST_REFRESH: 'spotify_last_refresh',
};

// Spotify credentials
const SPOTIFY_CONFIG = {
  clientId: 'b50f87a3c9f8487f8f1c6b4b94571afd',
  clientSecret: 'b0f0ed2de7894871a6a08c4f256587c4',
  tokenUrl: 'https://accounts.spotify.com/api/token',
};

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Define the background task
TaskManager.defineTask(SPOTIFY_TOKEN_REFRESH_TASK, async () => {
  try {
    console.log('Background task: Refreshing Spotify token...');
    
    const response = await fetch(SPOTIFY_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&client_id=${SPOTIFY_CONFIG.clientId}&client_secret=${SPOTIFY_CONFIG.clientSecret}`,
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.status}`);
    }

    const data: SpotifyTokenResponse = await response.json();
    const now = Date.now();
    const expirationTime = now + (data.expires_in * 1000);

    // Store the new token and expiration time
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token),
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRATION, expirationTime.toString()),
      AsyncStorage.setItem(STORAGE_KEYS.LAST_REFRESH, now.toString()),
    ]);

    console.log('Background task: Spotify token refreshed successfully');
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task: Failed to refresh Spotify token:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

class BackgroundTokenManager {
  private static instance: BackgroundTokenManager;
  private isRegistered = false;

  private constructor() {}

  public static getInstance(): BackgroundTokenManager {
    if (!BackgroundTokenManager.instance) {
      BackgroundTokenManager.instance = new BackgroundTokenManager();
    }
    return BackgroundTokenManager.instance;
  }

  /**
   * Initialize and register the background task
   */
  public async initialize(): Promise<void> {
    try {
      // Check if task is already registered
      const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(SPOTIFY_TOKEN_REFRESH_TASK);
      
      if (!isTaskRegistered) {
        // Register the background fetch task
        await BackgroundFetch.registerTaskAsync(SPOTIFY_TOKEN_REFRESH_TASK, {
          minimumInterval: 50 * 60 * 1000, // 50 minutes in milliseconds
          stopOnTerminate: false, // Continue running when app is terminated
          startOnBoot: true, // Start when device boots up
        });
        
        console.log('Background token refresh task registered successfully');
      }

      this.isRegistered = true;
      
      // Perform initial token fetch if no token exists
      await this.ensureTokenExists();
      
    } catch (error) {
      console.error('Failed to initialize background token manager:', error);
    }
  }

  /**
   * Get the current stored token
   */
  public async getStoredToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const expiration = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRATION);
      
      if (!token || !expiration) {
        return null;
      }

      // Check if token is still valid (with 5 minute buffer)
      const now = Date.now();
      const expirationTime = parseInt(expiration);
      
      if (now >= expirationTime - 300000) { // 5 minutes buffer
        console.log('Stored token is expired or about to expire');
        return null;
      }

      return token;
    } catch (error) {
      console.error('Failed to get stored token:', error);
      return null;
    }
  }

  /**
   * Force refresh token immediately
   */
  public async refreshTokenNow(): Promise<string | null> {
    try {
      const response = await fetch(SPOTIFY_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=client_credentials&client_id=${SPOTIFY_CONFIG.clientId}&client_secret=${SPOTIFY_CONFIG.clientSecret}`,
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const data: SpotifyTokenResponse = await response.json();
      const now = Date.now();
      const expirationTime = now + (data.expires_in * 1000);

      // Store the new token and expiration time
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token),
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRATION, expirationTime.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_REFRESH, now.toString()),
      ]);

      console.log('Token refreshed successfully');
      return data.access_token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  /**
   * Ensure a valid token exists, refresh if needed
   */
  private async ensureTokenExists(): Promise<void> {
    const existingToken = await this.getStoredToken();
    
    if (!existingToken) {
      console.log('No valid token found, refreshing...');
      await this.refreshTokenNow();
    }
  }

  /**
   * Get background fetch status
   */
  public async getBackgroundFetchStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
    return await BackgroundFetch.getStatusAsync();
  }

  /**
   * Unregister the background task (for cleanup)
   */
  public async cleanup(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(SPOTIFY_TOKEN_REFRESH_TASK);
      this.isRegistered = false;
      console.log('Background token refresh task unregistered');
    } catch (error) {
      console.error('Failed to cleanup background task:', error);
    }
  }

  /**
   * Get debug information
   */
  public async getDebugInfo(): Promise<{
    isRegistered: boolean;
    backgroundFetchStatus: BackgroundFetch.BackgroundFetchStatus | null;
    lastRefresh: string | null;
    tokenExpiration: string | null;
    hasStoredToken: boolean;
  }> {
    const lastRefresh = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REFRESH);
    const tokenExpiration = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRATION);
    const hasStoredToken = !!(await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN));
    const backgroundFetchStatus = await this.getBackgroundFetchStatus();

    return {
      isRegistered: this.isRegistered,
      backgroundFetchStatus,
      lastRefresh: lastRefresh ? new Date(parseInt(lastRefresh)).toISOString() : null,
      tokenExpiration: tokenExpiration ? new Date(parseInt(tokenExpiration)).toISOString() : null,
      hasStoredToken,
    };
  }
}

export const backgroundTokenManager = BackgroundTokenManager.getInstance();
export { STORAGE_KEYS };