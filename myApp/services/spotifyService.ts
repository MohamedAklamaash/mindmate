import { backgroundTokenManager } from './backgroundTokenManager';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyShow {
  id: string;
  name: string;
  publisher: string;
  description: string;
  external_urls: {
    spotify: string;
  };
  images?: Array<{
    url: string;
    height: number;
    width: number;
  }>;
}

interface SpotifySearchResponse {
  shows: {
    items: SpotifyShow[];
  };
}

interface PodcastData {
  name: string;
  publisher: string;
  description: string;
  spotifyUrl: string;
  imageUrl?: string;
}

class SpotifyService {
  private static instance: SpotifyService;
  private readonly clientId = 'b50f87a3c9f8487f8f1c6b4b94571afd';
  private readonly clientSecret = 'b0f0ed2de7894871a6a08c4f256587c4';

  private constructor() {
    // Initialize background token manager
    this.initializeBackgroundRefresh();
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  private async initializeBackgroundRefresh(): Promise<void> {
    try {
      await backgroundTokenManager.initialize();
      console.log('Background token refresh initialized');
    } catch (error) {
      console.error('Failed to initialize background token refresh:', error);
    }
  }

  private async getAccessToken(): Promise<string> {
    try {
      // First, try to get the token from background manager
      let token = await backgroundTokenManager.getStoredToken();
      
      if (token) {
        console.log('Using stored token from background manager');
        return token;
      }

      // If no valid stored token, refresh immediately
      console.log('No valid stored token, refreshing now...');
      token = await backgroundTokenManager.refreshTokenNow();
      
      if (!token) {
        throw new Error('Failed to get access token from background manager');
      }

      return token;
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      throw new Error('Failed to authenticate with Spotify. Please check your network connection.');
    }
  }

  public async searchHealthPodcasts(): Promise<PodcastData[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(
        'https://api.spotify.com/v1/search?q=health&type=show&limit=4&offset=0',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // If token expired, refresh and retry
        if (response.status === 401) {
          console.log('Token expired, refreshing and retrying...');
          const newToken = await backgroundTokenManager.refreshTokenNow();
          
          if (!newToken) {
            throw new Error('Failed to refresh expired token');
          }
          
          // Retry with new token
          const retryResponse = await fetch(
            'https://api.spotify.com/v1/search?q=health&type=show&limit=4&offset=0',
            {
              headers: {
                'Authorization': `Bearer ${newToken}`,
              },
            }
          );
          
          if (!retryResponse.ok) {
            throw new Error(`Failed to search podcasts: ${retryResponse.status}`);
          }
          
          const retryData: SpotifySearchResponse = await retryResponse.json();
          return this.formatMultiplePodcastData(retryData);
        }
        
        throw new Error(`Failed to search podcasts: ${response.status}`);
      }

      const data: SpotifySearchResponse = await response.json();
      return this.formatMultiplePodcastData(data);
    } catch (error) {
      console.error('Error searching health podcasts:', error);
      return [];
    }
  }



  private formatPodcastData(data: SpotifySearchResponse): PodcastData | null {
    if (!data.shows?.items?.length) {
      return null;
    }

    const show = data.shows.items[0];
    return {
      name: show.name,
      publisher: show.publisher,
      description: show.description,
      spotifyUrl: show.external_urls.spotify,
      imageUrl: show.images?.[0]?.url,
    };
  }

  private formatMultiplePodcastData(data: SpotifySearchResponse): PodcastData[] {
    if (!data.shows?.items?.length) {
      return [];
    }

    return data.shows.items.map(show => ({
      name: show.name,
      publisher: show.publisher,
      description: show.description,
      spotifyUrl: show.external_urls.spotify,
      imageUrl: show.images?.[0]?.url,
    }));
  }

  /**
   * Get debug information about token management
   */
  public async getDebugInfo() {
    return await backgroundTokenManager.getDebugInfo();
  }

  /**
   * Force refresh token immediately
   */
  public async forceRefreshToken(): Promise<string | null> {
    return await backgroundTokenManager.refreshTokenNow();
  }
}

export const spotifyService = SpotifyService.getInstance();
export type { PodcastData };