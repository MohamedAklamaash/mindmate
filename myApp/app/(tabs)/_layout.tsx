import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons,FontAwesome5  } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from "expo-blur";
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { useThemeStore, getThemeColors } from '@/store/themeStore';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const userType = useUserStore((state) => state.userType);
  
  // Get theme colors for dynamic tab bar styling
  const selectedTheme = useThemeStore((state) => state.selectedTheme);
  const themeColors = getThemeColors(selectedTheme);

  // Dynamic accent color for active tab based on theme
  const getTabBarActiveTintColor = (): string => {
    switch (selectedTheme) {
      case 'forest':
        return '#059669'; // Emerald
      case 'ocean':
        return '#0891B2'; // Cyan
      case 'retro':
        return '#EA580C'; // Orange
      case 'blossom':
        return '#DB2777'; // Pink
      case 'dark':
        return '#3B82F6'; // Blue
      case 'light':
        return '#4F46E5'; // Indigo
      default:
        return '#4F46E5'; // Default indigo
    }
  };

  return (
    <> 
      <StatusBar hidden />
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: getTabBarActiveTintColor(), // Dynamic color based on theme
        tabBarInactiveTintColor: '#0c0c0dff', // Gray color for inactive tabs
        headerShown: false, // Remove the top header/title bar
        //tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: 'transparent', // Very subtle background
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 85 : 75,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 6,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
//          left: 0,
  //        right: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
        <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) =>  <Ionicons name="chatbubble-outline" size={22} color={color} />,
          href: userType === 'user' ? '/chat' : null,
          tabBarStyle: { display: 'none' }, // Hide tab bar on chat screen
        }}
      />
      <Tabs.Screen
        name="Resources"
        options={{
          title: 'Resources',
          tabBarIcon: ({ color, size }) => (<Ionicons name="library" size={size} color={color} />), 
          href: userType === 'user' ? '/Resources' : null,
        }}
      />
      <Tabs.Screen
        name="therapist"
        options={{
          title: 'Therapist',
          tabBarIcon: ({ color }) =>  <FontAwesome5 name="stethoscope" size={22} color={color} />,
          href: userType === 'user' ? '/therapist' : null,
        }}
      />
  
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color, size }) => (<Ionicons name="people" size={size} color={color} />),  
          href: userType === 'therapist' ? '/clients' : null,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
           tabBarIcon: ({ color, size }) => (<Ionicons name="calendar" size={size} color={color} />),
           href: userType === 'therapist' ? '/schedule' : null,
        }}
      />
    </Tabs>
    </>
  );
}
