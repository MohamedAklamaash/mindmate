import { backgroundTokenManager } from './backgroundTokenManager';
import * as BackgroundFetch from 'expo-background-fetch';

class AppInitializationService {
  private static instance: AppInitializationService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): AppInitializationService {
    if (!AppInitializationService.instance) {
      AppInitializationService.instance = new AppInitializationService();
    }
    return AppInitializationService.instance;
  }

  /**
   * Initialize all background services
   */
  public async initializeApp(): Promise<void> {
    if (this.isInitialized) {
      console.log('App already initialized');
      return;
    }

    try {
      console.log('Initializing app services...');

      // Check if background fetch is available
      const backgroundFetchStatus = await BackgroundFetch.getStatusAsync();
      console.log('Background fetch status:', backgroundFetchStatus);

      if (backgroundFetchStatus === BackgroundFetch.BackgroundFetchStatus.Available) {
        // Initialize background token refresh
        await backgroundTokenManager.initialize();
        console.log('Background token refresh initialized successfully');
      } else {
        console.warn('Background fetch not available:', backgroundFetchStatus);
        // Still initialize token manager for foreground use
        await backgroundTokenManager.initialize();
      }

      this.isInitialized = true;
      console.log('App initialization completed successfully');

    } catch (error) {
      console.error('Failed to initialize app services:', error);
      // Don't throw error to prevent app crash
    }
  }

  /**
   * Get initialization status
   */
  public getInitializationStatus(): {
    isInitialized: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
    };
  }

  /**
   * Get comprehensive debug information
   */
  public async getDebugInfo() {
    try {
      const tokenManagerDebug = await backgroundTokenManager.getDebugInfo();
      const backgroundFetchStatus = await BackgroundFetch.getStatusAsync();

      return {
        appInitialized: this.isInitialized,
        backgroundFetchStatus,
        tokenManager: tokenManagerDebug,
      };
    } catch (error: any) {
      console.error('Failed to get debug info:', error);
      return {
        appInitialized: this.isInitialized,
        error: error?.message || 'Unknown error',
      };
    }
  }
}

export const appInitializationService = AppInitializationService.getInstance();