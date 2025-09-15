import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { spotifyService } from '@/services/spotifyService';
import { appInitializationService } from '@/services/appInitialization';

interface DebugInfo {
  appInitialized: boolean;
  backgroundFetchStatus: any;
  tokenManager: {
    isRegistered: boolean;
    backgroundFetchStatus: any;
    lastRefresh: string | null;
    tokenExpiration: string | null;
    hasStoredToken: boolean;
  };
  error?: string;
}

export default function SpotifyDebugScreen() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      const info = await appInitializationService.getDebugInfo();
      setDebugInfo(info as DebugInfo);
    } catch (error) {
      console.error('Failed to fetch debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceRefreshToken = async () => {
    setLoading(true);
    try {
      await spotifyService.forceRefreshToken();
      console.log('Token refresh forced');
      // Refresh debug info
      await fetchDebugInfo();
    } catch (error) {
      console.error('Failed to force refresh token:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: boolean) => {
    return status ? '#10B981' : '#EF4444';
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Spotify Token Debug</Text>
      
      <View style={styles.buttonContainer}>
        <Pressable style={styles.button} onPress={fetchDebugInfo} disabled={loading}>
          <Text style={styles.buttonText}>Refresh Info</Text>
        </Pressable>
        
        <Pressable style={styles.button} onPress={forceRefreshToken} disabled={loading}>
          <Text style={styles.buttonText}>Force Token Refresh</Text>
        </Pressable>
      </View>

      {loading && <Text style={styles.loading}>Loading...</Text>}

      {debugInfo && (
        <View style={styles.infoContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Status</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Initialized:</Text>
              <Text style={[styles.value, { color: getStatusColor(debugInfo.appInitialized) }]}>
                {debugInfo.appInitialized ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Background Fetch:</Text>
              <Text style={styles.value}>{String(debugInfo.backgroundFetchStatus)}</Text>
            </View>
          </View>

          {debugInfo.tokenManager && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Token Manager</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Task Registered:</Text>
                <Text style={[styles.value, { color: getStatusColor(debugInfo.tokenManager.isRegistered) }]}>
                  {debugInfo.tokenManager.isRegistered ? 'Yes' : 'No'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Has Token:</Text>
                <Text style={[styles.value, { color: getStatusColor(debugInfo.tokenManager.hasStoredToken) }]}>
                  {debugInfo.tokenManager.hasStoredToken ? 'Yes' : 'No'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Last Refresh:</Text>
                <Text style={styles.value}>{formatDate(debugInfo.tokenManager.lastRefresh)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Token Expires:</Text>
                <Text style={styles.value}>{formatDate(debugInfo.tokenManager.tokenExpiration)}</Text>
              </View>
            </View>
          )}

          {debugInfo.error && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Error</Text>
              <Text style={styles.error}>{debugInfo.error}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  loading: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 20,
  },
  infoContainer: {
    gap: 20,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  error: {
    fontSize: 14,
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 4,
  },
});