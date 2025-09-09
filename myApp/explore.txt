import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Pressable,
  Linking,
} from 'react-native';
import { NativeModules } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { UsageModule } = NativeModules;

interface AppUsage {
  packageName: string;
  totalTimeForeground: number;
  lastTimeUsed: string;
}

interface UsageStats {
  appName: string;
  packageName: string;
  timeSpent: number;
  lastUsed: string;
  percentage: number;
  uniqueKey: string;
}

export default function ExploreScreen() {
  const [usageData, setUsageData] = useState<UsageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);

  const checkUsagePermission = async () => {
    console.log('🔍 Checking usage permission...');
    try {
      if (!UsageModule) {
        console.log('❌ UsageModule not found');
        setHasPermission(false);
        setPermissionChecked(true);
        return;
      }

      console.log('📱 UsageModule found, checking permission...');
      
      // Check if the module has a permission checking method
      if (UsageModule.hasUsageStatsPermission) {
        console.log('🔐 Using hasUsageStatsPermission method...');
        const permission = await UsageModule.hasUsageStatsPermission();
        console.log('🔐 Permission result:', permission);
        setHasPermission(permission);
      } else {
        console.log('⚠️ hasUsageStatsPermission method not available, testing with getUsageStats...');
        // Try to get usage stats to see if permission is granted
        try {
          const testUsage = await UsageModule.getUsageStats();
          console.log('📊 Test usage stats result:', testUsage ? testUsage.length : 'null');
          // If we get any result (even empty array), permission is likely granted
          const hasPermission = testUsage !== null && testUsage !== undefined;
          console.log('✅ Permission determined:', hasPermission);
          setHasPermission(hasPermission);
        } catch (error) {
          console.log('❌ Error getting test usage stats:', error);
          setHasPermission(false);
        }
      }
    } catch (error) {
      console.error('❌ Error checking usage permission:', error);
      setHasPermission(false);
    } finally {
      setPermissionChecked(true);
      console.log('✅ Permission check completed');
    }
  };

  const openUsageSettings = () => {
    console.log('⚙️ Opening usage settings...');
    Alert.alert(
      'Usage Access Required',
      'This app needs access to usage statistics to show your app usage data.\n\nSteps to enable:\n1. Tap "Open Settings"\n2. Find this app in the list\n3. Toggle "Permit usage access" ON\n4. Return to this app and pull down to refresh',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('❌ User cancelled opening settings'),
        },
        {
          text: 'Open Settings',
          onPress: () => {
            console.log('⚙️ User chose to open settings');
            try {
              if (UsageModule && UsageModule.openUsageSettings) {
                console.log('📱 Calling UsageModule.openUsageSettings()...');
                UsageModule.openUsageSettings();
              } else {
                console.log('⚠️ openUsageSettings not available, using Linking.openSettings()...');
                // Fallback to general settings
                Linking.openSettings();
              }
            } catch (error) {
              console.error('❌ Error opening settings:', error);
              console.log('🔄 Trying fallback Linking.openSettings()...');
              Linking.openSettings();
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getAppDisplayName = (packageName: string): string => {
    const appNames: { [key: string]: string } = {
      'com.whatsapp': 'WhatsApp',
      'com.instagram.android': 'Instagram',
      'com.youtube.android': 'YouTube',
      'com.facebook.katana': 'Facebook',
      'com.twitter.android': 'Twitter',
      'com.snapchat.android': 'Snapchat',
      'com.tiktok.android': 'TikTok',
      'com.spotify.music': 'Spotify',
      'com.netflix.mediaclient': 'Netflix',
      'com.google.android.youtube': 'YouTube',
      'com.android.chrome': 'Chrome',
      'com.microsoft.office.outlook': 'Outlook',
      'com.slack': 'Slack',
      'com.discord': 'Discord',
      'com.telegram.messenger': 'Telegram',
    };

    return appNames[packageName] || packageName.split('.').pop() || packageName;
  };

  const getAppIcon = (packageName: string): string => {
    const iconMap: { [key: string]: string } = {
      'com.whatsapp': 'whatsapp',
      'com.instagram.android': 'instagram',
      'com.youtube.android': 'youtube',
      'com.facebook.katana': 'facebook',
      'com.twitter.android': 'twitter',
      'com.snapchat.android': 'snapchat',
      'com.spotify.music': 'spotify',
      'com.netflix.mediaclient': 'netflix',
      'com.android.chrome': 'google-chrome',
      'com.microsoft.office.outlook': 'microsoft-outlook',
      'com.slack': 'slack',
      'com.discord': 'discord',
      'com.telegram.messenger': 'telegram',
    };

    return iconMap[packageName] || 'application';
  };

  const fetchUsageData = async () => {
    console.log('📊 Fetching usage data, hasPermission:', hasPermission);
    
    if (!hasPermission) {
      console.log('❌ No permission, skipping data fetch');
      return;
    }

    try {
      if (!UsageModule) {
        console.log('❌ UsageModule not available');
        Alert.alert('Error', 'Usage tracking is not available on this device');
        return;
      }

      // Log the time range we're requesting
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      console.log(`📅 Requesting usage data from ${startOfDay.toLocaleString()} to ${now.toLocaleString()}`);
      console.log(`🕐 Current timestamp: ${now.getTime()}, Start timestamp: ${startOfDay.getTime()}`);

      console.log('📱 Calling UsageModule.getUsageStats()...');
      const rawUsage: AppUsage[] = await UsageModule.getUsageStats();
      console.log('📊 Raw usage data received:', rawUsage ? rawUsage.length : 'null', 'items');
      console.log(`🕐 Data fetched at: ${new Date().toLocaleTimeString()}`);
      
      if (!rawUsage || rawUsage.length === 0) {
        console.log('📊 No usage data available');
        setUsageData([]);
        setTotalTime(0);
        return;
      }

      console.log('📱 Raw usage data items (comparing with system):');
      rawUsage.forEach((app, index) => {
        const hours = Math.floor(app.totalTimeForeground / 3600);
        const minutes = Math.floor((app.totalTimeForeground % 3600) / 60);
        console.log(`  ${index}: ${app.packageName} - ${app.totalTimeForeground}s (${hours}h ${minutes}m)`);
      });

      // Calculate total time first
      const total = rawUsage.reduce((sum, app) => sum + app.totalTimeForeground, 0);
      console.log('⏱️ Total usage time:', total, 'seconds');
      setTotalTime(total);

      // Since Android now returns aggregated data, we don't need complex deduplication
      // Just filter, sort and limit the results
      const sortedApps = rawUsage
        .filter(app => app.totalTimeForeground > 60) // Filter apps with more than 1 minute
        .sort((a, b) => b.totalTimeForeground - a.totalTimeForeground)
        .slice(0, 10) // Get top 10 apps
        .map((app, index) => ({
          appName: getAppDisplayName(app.packageName),
          packageName: app.packageName,
          timeSpent: app.totalTimeForeground,
          lastUsed: app.lastTimeUsed,
          percentage: total > 0 ? (app.totalTimeForeground / total) * 100 : 0,
          uniqueKey: `${app.packageName}_${index}`, // Add unique key
        }));

      console.log('📱 Processed apps:', sortedApps.length);
      console.log('📱 Final processed apps:');
      sortedApps.forEach((app, index) => {
        console.log(`  ${index}: ${app.packageName} (${app.appName}) - ${app.timeSpent}s - Key: ${app.uniqueKey}`);
      });
      setUsageData(sortedApps);
    } catch (error) {
      console.error('❌ Error fetching usage data:', error);
      // If we get an error, it might be a permission issue
      console.log('🔍 Error might indicate permission issue, rechecking permission...');
      setHasPermission(false);
      Alert.alert(
        'Permission Required',
        'Unable to fetch app usage data. This usually means usage access permission is not granted.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openUsageSettings }
        ]
      );
    }
  };

  const onRefresh = async () => {
    console.log('🔄 Refreshing data...');
    setRefreshing(true);
    await checkUsagePermission();
    if (hasPermission) {
      console.log('✅ Permission granted, fetching data...');
      await fetchUsageData();
    } else {
      console.log('❌ Permission not granted after refresh');
    }
    setRefreshing(false);
    console.log('🔄 Refresh completed');
  };

  useEffect(() => {
    console.log('🚀 Component mounted, checking permission...');
    checkUsagePermission();
  }, []);

  useEffect(() => {
    console.log('🔄 Permission state changed:', { permissionChecked, hasPermission });
    if (permissionChecked && hasPermission) {
      console.log('✅ Loading data...');
      const loadData = async () => {
        setLoading(true);
        await fetchUsageData();
        setLoading(false);
      };
      loadData();
    } else if (permissionChecked && !hasPermission) {
      console.log('❌ No permission, stopping loading...');
      setLoading(false);
    }
  }, [hasPermission, permissionChecked]);

  const renderUsageItem = (item: UsageStats, index: number) => (
    <View key={item.uniqueKey} style={styles.usageItem}>
      <View style={styles.appInfo}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={getAppIcon(item.packageName) as any}
            size={24}
            color="#6366F1"
          />
        </View>
        <View style={styles.appDetails}>
          <Text style={styles.appName}>{item.appName}</Text>
          <Text style={styles.lastUsed}>Last used: {item.lastUsed}</Text>
        </View>
      </View>
      <View style={styles.usageStats}>
        <Text style={styles.timeSpent}>{formatTime(item.timeSpent)}</Text>
        <Text style={styles.percentage}>{item.percentage.toFixed(1)}%</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
          <Text style={styles.headerTitle}>App Usage</Text>
          <Text style={styles.headerSubtitle}>Today (since 12:00 AM)</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>
            {!permissionChecked ? 'Checking permissions...' : 'Loading usage data...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
          <Text style={styles.headerTitle}>App Usage</Text>
          <Text style={styles.headerSubtitle}>Today (since 12:00 AM)</Text>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.permissionContainer}>
            <MaterialCommunityIcons name="shield-alert" size={80} color="#6366F1" />
            <Text style={styles.permissionTitle}>Usage Access Required</Text>
            <Text style={styles.permissionDescription}>
              To display your app usage statistics, this app needs access to usage data. 
              This information stays on your device and is used only to show your personal usage patterns.
            </Text>
            
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>How to enable:</Text>
              <Text style={styles.instructionStep}>1. Tap "Grant Permission" below</Text>
              <Text style={styles.instructionStep}>2. Find this app in the list</Text>
              <Text style={styles.instructionStep}>3. Toggle "Permit usage access" ON</Text>
              <Text style={styles.instructionStep}>4. Return to this app</Text>
            </View>

            <Pressable style={styles.permissionButton} onPress={openUsageSettings}>
              <MaterialCommunityIcons name="shield-check" size={24} color="#FFFFFF" />
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </Pressable>

            <Text style={styles.permissionNote}>
              Pull down to refresh after granting permission
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
        <Text style={styles.headerTitle}>App Usage</Text>
        <Text style={styles.headerSubtitle}>Today (since 12:00 AM)</Text>
        {totalTime > 0 && (
          <Text style={styles.totalTime}>Total: {formatTime(totalTime)}</Text>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {usageData.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="chart-bar" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Usage Data</Text>
            <Text style={styles.emptySubtitle}>
              No app usage data available. This usually means usage access permission is not granted or no apps have been used recently.
            </Text>
            <Pressable style={styles.checkPermissionButton} onPress={openUsageSettings}>
              <MaterialCommunityIcons name="cog" size={20} color="#6366F1" />
              <Text style={styles.checkPermissionText}>Check Permissions</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.usageList}>
            <Text style={styles.sectionTitle}>Most Used Apps</Text>
            {usageData.map((item, index) => renderUsageItem(item, index))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  totalTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 24,
    marginBottom: 16,
  },
  usageList: {
    paddingBottom: 20,
  },
  usageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  lastUsed: {
    fontSize: 12,
    color: '#6B7280',
  },
  usageStats: {
    alignItems: 'flex-end',
  },
  timeSpent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  percentage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  instructionsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  instructionStep: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    paddingLeft: 10,
  },
  permissionButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  permissionNote: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  checkPermissionButton: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  checkPermissionText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
