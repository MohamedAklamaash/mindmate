import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import UsageStats from 'react-native-usage-stats';

interface UsageStatsItem {
  packageName: string;
  usageTime: number;
  firstTimeStamp?: number;
  lastTimeStamp?: number;
  lastTimeUsed?: number;
}

// Type assertion to handle the mismatch between UsageStatsInfo and UsageStatsItem
type UsageStatsInfo = UsageStatsItem[];

export default function App() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null); // null = initial loading state
  const [usageData, setUsageData] = useState<UsageStatsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  // Handle splash screen and permission check on mount
  useEffect(() => {
    // Show splash screen for 2 seconds
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      setHasShownWelcome(true);
      // After splash, check permission and auto-request if needed
      checkPermissionStatus();
    }, 5000);

    return () => clearTimeout(splashTimer);
  }, []);

  const checkPermissionStatus = async () => {
    try {
      // Add a small delay to prevent flickering
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const result = await UsageStats.checkPermission();
      setHasPermission(result);
      
      if (result) {
        testDataAccess();
      } else {
        // Auto-request permission if not granted
        setTimeout(() => {
          requestPermission();
        }, 500);
      }
    } catch (error) {
      console.error('Error checking permission:', error);
      setHasPermission(false);
    } finally {
      setIsInitialized(true);
    }
  };

  const testDataAccess = async () => {
    try {
      const testStats = await UsageStats.getAppUsageInfo();
      // Silent test - no logging needed
    } catch (error) {
      console.error('Test data access failed:', error);
    }
  };

  // Format time in a readable way
  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const requestPermission = () => {
    try {
      // Show a brief message before opening settings
      if (!hasShownWelcome) {
        // This is the first time, show a more welcoming message
        console.log('First time setup: Opening permission settings...');
      }
      
      UsageStats.openUsageAccessSettings('com.anonymous.myApp');
    } catch (error) {
      console.error('Error opening settings:', error);
      try {
        UsageStats.openUsageAccessSettings('');
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
  };

const getUsageStats = async () => {
  setIsLoading(true);
  setError(null);

  try {
    const now = new Date();
    const endTime = now.getTime();

    // Start of today (12 AM)
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();

    // Fetch all usage stats and filter by time on our side
    let stats: UsageStatsItem[] = [];
    try {
      const rawStats = await UsageStats.getAppUsageInfo();
      if (rawStats) {
        stats = rawStats as unknown as UsageStatsItem[];
        
        // Filter stats to only include data from 12 AM today onwards
        console.log('Total apps found:', stats.length);
        console.log('Filtering from timestamp:', new Date(startTime).toLocaleString());
        
        const filteredStats = stats.filter(item => {
          if (item.lastTimeUsed) {
            const isAfterMidnight = item.lastTimeUsed >= startTime;
            if (isAfterMidnight) {
              console.log('✅ App used today:', item.packageName, 'at', new Date(item.lastTimeUsed).toLocaleString());
            }
            return isAfterMidnight;
          }
          return false;
        });
        
        console.log('Apps used since 12 AM today:', filteredStats.length);
        stats = filteredStats;
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      setError('Failed to fetch usage stats. Make sure permission is granted.');
      setUsageData([]);
      setIsLoading(false);
      return;
    }

    if (!stats || stats.length === 0) {
      setError('No usage data available since 12 AM today. Try using some apps and check again.');
      setUsageData([]);
      setIsLoading(false);
      return;
    }

    // Remove duplicate package entries by summing usageTime
    const usageMap: { [key: string]: UsageStatsItem } = {};
    stats.forEach(item => {
      if (!usageMap[item.packageName]) {
        usageMap[item.packageName] = { ...item };
      } else {
        usageMap[item.packageName].usageTime += item.usageTime;
        // Update lastTimeUsed if current item's lastTimeUsed is later
        if (item.lastTimeUsed && (!usageMap[item.packageName].lastTimeUsed || item.lastTimeUsed > usageMap[item.packageName].lastTimeUsed!)) {
          usageMap[item.packageName].lastTimeUsed = item.lastTimeUsed;
        }
      }
    });

    const processedStats = Object.values(usageMap);

    // Sort by usageTime descending and take top 5
    const sortedStats = processedStats
      .sort((a, b) => b.usageTime - a.usageTime)
      .slice(0, 5);

    console.log('Top 5 most used apps today:', sortedStats);
    setUsageData(sortedStats);
  } catch (err) {
    console.error('Error fetching usage stats: ', err);
    setError(err instanceof Error ? err.message : 'Unknown error occurred');
    setUsageData([]);
  } finally {
    setIsLoading(false);
  }
};


  // Show splash screen
  if (showSplash) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#007AFF',
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 40
      }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 30,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8
        }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: '#007AFF',
            marginBottom: 20,
            textAlign: 'center'
          }}>
            Welcome to App Usage Tracker! 📱
          </Text>
          
          <Text style={{ 
            fontSize: 16, 
            color: '#666',
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 25
          }}>
            Discover how you spend your time on your device and become more mindful of your digital habits.
          </Text>
          
          <View style={{
            backgroundColor: '#f0f8ff',
            padding: 15,
            borderRadius: 10,
            borderLeftWidth: 4,
            borderLeftColor: '#007AFF'
          }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600',
              color: '#007AFF',
              textAlign: 'center'
            }}>
              Loading your personalized experience...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Show welcome screen until initialization is complete
  if (!isInitialized) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#007AFF',
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 40
      }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 30,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8
        }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: '#007AFF',
            marginBottom: 20,
            textAlign: 'center'
          }}>
            Welcome to App Usage Tracker! 📱
          </Text>
          
          <Text style={{ 
            fontSize: 16, 
            color: '#666',
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 25
          }}>
            Discover how you spend your time on your device and become more mindful of your digital habits.
          </Text>
          
          <View style={{
            backgroundColor: '#f0f8ff',
            padding: 15,
            borderRadius: 10,
            borderLeftWidth: 4,
            borderLeftColor: '#007AFF'
          }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600',
              color: '#007AFF',
              textAlign: 'center'
            }}>
              Setting up your personalized experience...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {!hasPermission ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>
            Usage Access Permission Required
          </Text>
          
          <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', lineHeight: 20, color: '#666' }}>
            This app needs permission to access usage statistics to show you how much time you spend on different apps.
          </Text>
          
          <View style={{ backgroundColor: '#f0f8ff', padding: 15, borderRadius: 8, marginBottom: 20, width: '100%' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#0066cc' }}>
              How to Grant Permission:
            </Text>
            <Text style={{ fontSize: 12, lineHeight: 18, color: '#333' }}>
              1. Tap "Open Settings" below{'\n'}
              2. Find "myApp" in the list{'\n'}
              3. Toggle the switch to ON{'\n'}
              4. Return to this app{'\n'}
              5. The app will automatically detect the permission
            </Text>
          </View>
          
          <View style={{ alignItems: 'center', width: '100%' }}>
            <Button title="Open Settings" onPress={requestPermission} color="#007AFF" />
          </View>
          
          <View style={{ marginTop: 15, padding: 15, backgroundColor: '#fff3cd', borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#ffc107' }}>
            <Text style={{ fontSize: 12, color: '#856404', fontWeight: 'bold', marginBottom: 5 }}>
              Troubleshooting Tips:
            </Text>
            <Text style={{ fontSize: 11, color: '#856404', lineHeight: 16 }}>
              • Make sure you've used some apps recently{'\n'}
              • Try using apps for a few minutes then check again{'\n'}
              • Some devices may have additional restrictions{'\n'}
              • Check if battery optimization is disabled for this app
            </Text>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ marginBottom: 10 }}>
            <Button title="Get Usage Data" onPress={getUsageStats} />
          </View>
          
          {isLoading && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text>Loading usage data...</Text>
            </View>
          )}
          
          {error && (
            <View style={{ padding: 20, backgroundColor: '#ffebee', marginVertical: 10, borderRadius: 5 }}>
              <Text style={{ color: '#c62828' }}>Error: {error}</Text>
            </View>
          )}
          
          {!isLoading && !error && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#007AFF' }}>
                Top 5 Most Used Apps
              </Text>
              
              <Text style={{ fontSize: 14, marginBottom: 10, textAlign: 'center', color: '#666' }}>
                Showing your most frequently used apps since 12 AM today
              </Text>
              
              <Text style={{ fontSize: 14, marginBottom: 10, textAlign: 'center' }}>
                Apps found: {usageData.length}
              </Text>
              
              {usageData.length > 0 ? (
                <FlatList
                  data={usageData}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <View style={{ 
                      marginVertical: 8, 
                      padding: 15, 
                      backgroundColor: index === 0 ? '#fff3cd' : '#f5f5f5', 
                      borderRadius: 8,
                      borderLeftWidth: 4,
                      borderLeftColor: index === 0 ? '#ffc107' : index === 1 ? '#6c757d' : index === 2 ? '#cd7f32' : '#28a745'
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <View style={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: 12, 
                          backgroundColor: index === 0 ? '#ffc107' : index === 1 ? '#6c757d' : index === 2 ? '#cd7f32' : '#28a745',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 10
                        }}>
                          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                            {index + 1}
                          </Text>
                        </View>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, flex: 1 }}>
                          {item.packageName.split('.').pop() || item.packageName}
                        </Text>
                      </View>
                      
                      <Text style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
                        {item.packageName}
                      </Text>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: '#007AFF', fontWeight: '600', fontSize: 14 }}>
                          {formatTime(item.usageTime)}
                        </Text>
                        <Text style={{ color: '#666', fontSize: 12 }}>
                          {index === 0 ? '🥇 Most Used' : index === 1 ? '🥈 Second' : index === 3 ? '🥉 Third' : 'Used'}
                        </Text>
                      </View>
                    </View>
                  )}
                />
              ) : (
                <Text style={{ textAlign: 'center', color: '#666' }}>
                  No usage data available. Press "Get Usage Data" to fetch data.
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
