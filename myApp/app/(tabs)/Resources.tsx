import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore, getThemeColors } from '@/store/themeStore';
import { spotifyService, PodcastData } from '@/services/spotifyService';
import { appInitializationService } from '@/services/appInitialization';

interface Course {
  id: string;
  title: string;
  instructor: string;
  duration: string;
  type: 'video' | 'guide' | 'workbook';
  points: number;
  isCompleted: boolean;
  progress: number;
}

interface QuickTip {
  quote: {
    text: string;
    author: string;
  };
  article: {
    title: string;
    source: string;
    url: string;
  };
  podcast: {
    title: string;
    host: string;
    duration: string;
    spotifyUrl: string;
  };
}

export default function ResourcesScreen() {
  const [spotifyPodcasts, setSpotifyPodcasts] = useState<PodcastData[]>([]);
  const [podcastLoading, setPodcastLoading] = useState(false);
  
  // Theme support
  const selectedTheme = useThemeStore((state) => state.selectedTheme);
  const themeColors = getThemeColors(selectedTheme);
  
  // Dynamic gradient based on theme
  const getBackgroundGradient = (): [string, string, string] => {
    switch (selectedTheme) {
      case 'forest':
        return ['#F0FDF4', '#ECFDF5', '#D1FAE5']; // Green gradient
      case 'ocean':
        return ['#EBF8FF', '#DBEAFE', '#BFDBFE']; // Blue gradient
      case 'retro':
        return ['#FEF3C7', '#FDE68A', '#F59E0B']; // Orange gradient
      case 'blossom':
        return ['#FDF2F8', '#FCE7F3', '#F9A8D4']; // Pink gradient
      case 'dark':
        return ['#1F2937', '#374151', '#4B5563']; // Dark gradient
      case 'light':
        return ['#F9FAFB', '#F3F4F6', '#E5E7EB']; // Light gradient
      default:
        return ['#EBF4FF', '#F3E8FF', '#FDF2F8']; // Default gradient
    }
  };

  // Sample data - replace with actual data from your backend
  const availableCourses: Course[] = [
    {
      id: '1',
      title: 'Mindfulness Meditation Basics',
      instructor: 'Dr. Sarah Johnson',
      duration: '45 min',
      type: 'video',
      points: 50,
      isCompleted: false,
      progress: 65,
    },
    {
      id: '2',
      title: 'Managing Anxiety Workbook',
      instructor: 'Dr. Michael Chen',
      duration: '2 weeks',
      type: 'workbook',
      points: 100,
      isCompleted: true,
      progress: 100,
    },
    {
      id: '3',
      title: 'Sleep Hygiene Guide',
      instructor: 'Dr. Emily Davis',
      duration: '30 min',
      type: 'guide',
      points: 30,
      isCompleted: false,
      progress: 0,
    },
  ];

  // Static health-focused content
  const currentTip: QuickTip = {
    quote: {
      text: "The greatest revolution of our generation is the discovery that human beings, by changing the inner attitudes of their minds, can change the outer aspects of their lives.",
      author: "William James"
    },
    article: {
      title: "5 Simple Daily Habits for Better Mental Health",
      source: "Psychology Today",
      url: "https://www.psychologytoday.com/mental-health-habits"
    },
    podcast: {
      title: "The Science of Happiness",
      host: "Dr. Laurie Santos",
      duration: "25 min",
      spotifyUrl: "https://open.spotify.com/show/happiness"
    }
  };

  // Fetch health podcast data from Spotify
  const fetchHealthPodcastData = async () => {
    setPodcastLoading(true);
    try {
      const podcasts = await spotifyService.searchHealthPodcasts();
      setSpotifyPodcasts(podcasts);
    } catch (error) {
      console.error('Failed to fetch podcast data:', error);
      // Show user-friendly error message
      Alert.alert(
        'Podcast Loading Error',
        'Unable to load latest podcast recommendations. Showing default content.',
        [{ text: 'OK' }]
      );
      // Reset to empty array so fallback content is shown
      setSpotifyPodcasts([]);
    } finally {
      setPodcastLoading(false);
    }
  };

  // Initialize app and load health podcast data on component mount
  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        // Initialize background services first
        await appInitializationService.initializeApp();
        console.log('App services initialized, fetching podcasts...');
        
        // Then fetch podcast data
        await fetchHealthPodcastData();
      } catch (error) {
        console.error('Failed to initialize app or fetch podcasts:', error);
        // Still try to fetch podcasts even if initialization fails
        await fetchHealthPodcastData();
      }
    };

    initializeAndFetch();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return 'play-circle';
      case 'guide':
        return 'file-document';
      case 'workbook':
        return 'bookmark';
      default:
        return 'file-document';
    }
  };

  const getIconColor = (type: string, theme?: string) => {
    if (theme === 'forest') {
      switch (type) {
        case 'video':
          return '#059669'; // emerald-600
        case 'guide':
          return '#10B981'; // green-500
        case 'workbook':
          return '#16A34A'; // green-600
        default:
          return '#047857'; // green-700
      }
    } else if (theme === 'ocean') {
      switch (type) {
        case 'video':
          return '#0891B2'; // cyan-600
        case 'guide':
          return '#3B82F6'; // blue-500
        case 'workbook':
          return '#2DD4BF'; // teal-400
        default:
          return '#0E7490'; // cyan-700
      }
    } else if (theme === 'retro') {
      switch (type) {
        case 'video':
          return '#EA580C'; // orange-600
        case 'guide':
          return '#F59E0B'; // amber-500
        case 'workbook':
          return '#FACC15'; // yellow-400
        default:
          return '#D97706'; // amber-600
      }
    } else if (theme === 'blossom') {
      switch (type) {
        case 'video':
          return '#DB2777'; // pink-600
        case 'guide':
          return '#F43F5E'; // rose-500
        case 'workbook':
          return '#C084FC'; // purple-400
        default:
          return '#BE185D'; // pink-700
      }
    }
    
    // Default colors for other themes
    switch (type) {
      case 'video':
        return '#8B5CF6';
      case 'guide':
        return '#3B82F6';
      case 'workbook':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  const callCrisisLine = () => {
    Linking.openURL('tel:91-9152987821').catch(() => {
      Alert.alert('Error', 'Could not make call');
    });
  };

  return (
    <LinearGradient colors={getBackgroundGradient()} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>Learning Resources</Text>
          </View>

          {/* Quick Tips Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Health & Wellness Tips</Text>
            </View>

            {/* Daily Inspiration */}
            <View style={[styles.card, { backgroundColor: themeColors.surface}]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: selectedTheme === 'forest' ? '#D1FAE5' : '#EEF2FF' }]}>
                  <MaterialCommunityIcons 
                    name="lightbulb" 
                    size={20} 
                    color={selectedTheme === 'forest' ? themeColors.primary : "#4F46E5"} 
                  />
                </View>
                <Text style={[styles.cardTitle, { color: themeColors.text }]}>Daily Inspiration</Text>
              </View>
              <Text style={[styles.quote, { color: themeColors.textSecondary }]}>"{currentTip.quote.text}"</Text>
              <Text style={[styles.author, { color: themeColors.textMuted }]}>— {currentTip.quote.author}</Text>
            </View>

            {/* Recommended Reading */}
            <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: selectedTheme === 'forest' ? '#DCFCE7' : '#DBEAFE' }]}>
                  <MaterialCommunityIcons 
                    name="file-document" 
                    size={20} 
                    color={selectedTheme === 'forest' ? themeColors.secondary : "#3B82F6"} 
                  />
                </View>
                <Text style={[styles.cardTitle, { color: themeColors.text }]}>Recommended Reading</Text>
              </View>
              <Text style={[styles.cardContent, { color: themeColors.textSecondary }]}>{currentTip.article.title}</Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.sourceText, { color: themeColors.textMuted }]}>{currentTip.article.source}</Text>
                <Pressable 
                  style={[styles.linkButton, { backgroundColor: themeColors.primary }]} 
                  onPress={() => openLink(currentTip.article.url)}
                >
                  <Text style={[styles.linkButtonText, { color: themeColors.primaryText }]}>Read Article</Text>
                </Pressable>
              </View>
            </View>

            {/* Podcast Recommendations Carousel */}
            <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: selectedTheme === 'forest' ? '#DCFCE7' : '#D1FAE5' }]}>
                  {podcastLoading ? (
                    <MaterialCommunityIcons 
                      name="loading" 
                      size={20} 
                      color={selectedTheme === 'forest' ? themeColors.secondary : "#10B981"} 
                    />
                  ) : (
                    <MaterialCommunityIcons 
                      name="volume-high" 
                      size={20} 
                      color={selectedTheme === 'forest' ? themeColors.secondary : "#10B981"} 
                    />
                  )}
                </View>
                <Text style={[styles.cardTitle, { color: themeColors.text }]}>Listen & Learn</Text>
              </View>
              
              {podcastLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.cardContent, { color: themeColors.textMuted }]}>Loading podcast recommendations...</Text>
                </View>
              ) : spotifyPodcasts.length > 0 ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.podcastCarouselContainer}
                >
                  {spotifyPodcasts.map((podcast, index) => (
                    <View key={index} style={[styles.podcastCarouselItem, { borderColor: themeColors.border }]}>
                      <Text style={[styles.podcastTitle, { color: themeColors.textSecondary }]} numberOfLines={2}>
                        {podcast.name}
                      </Text>
                      {podcast.description && (
                        <Text 
                          style={[styles.podcastDescription, { color: themeColors.textMuted }]} 
                          numberOfLines={3}
                        >
                          {podcast.description}
                        </Text>
                      )}
                      <View style={styles.podcastFooter}>
                        <Text style={[styles.podcastPublisher, { color: themeColors.textMuted }]} numberOfLines={1}>
                          by {podcast.publisher}
                        </Text>
                        <Pressable 
                          style={[styles.podcastButton, { backgroundColor: themeColors.secondary }]} 
                          onPress={() => openLink(podcast.spotifyUrl)}
                        >
                          <MaterialCommunityIcons name="spotify" size={10} color={themeColors.secondaryText} />
                          <Text style={[styles.podcastButtonText, { color: themeColors.secondaryText }]}>Listen</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <>
                  <Text style={[styles.cardContent, { color: themeColors.textSecondary }]}>{currentTip.podcast.title}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={[styles.sourceText, { color: themeColors.textMuted }]}>by {currentTip.podcast.host} • {currentTip.podcast.duration}</Text>
                    <Pressable 
                      style={[styles.linkButton, { backgroundColor: themeColors.secondary }]} 
                      onPress={() => openLink(currentTip.podcast.spotifyUrl)}
                    >
                      <MaterialCommunityIcons name="volume-high" size={12} color={themeColors.secondaryText} />
                      <Text style={[styles.linkButtonText, { color: themeColors.secondaryText }]}>Listen</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Available Courses */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Available Courses</Text>
            {availableCourses.map((course) => (
              <View key={course.id} style={[styles.courseCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <View style={styles.courseHeader}>
                  <View style={[styles.courseIconContainer, { backgroundColor: themeColors.backgroundSecondary }]}>
                    <MaterialCommunityIcons 
                      name={getIcon(course.type) as any} 
                      size={24} 
                      color={getIconColor(course.type, selectedTheme)} 
                    />
                  </View>
                  <View style={styles.courseInfo}>
                    <Text style={[styles.courseTitle, { color: themeColors.text }]}>{course.title}</Text>
                    <Text style={[styles.courseInstructor, { color: themeColors.textSecondary }]}>by {course.instructor}</Text>
                    <Text style={[styles.courseDuration, { color: themeColors.textMuted }]}>{course.duration}</Text>
                  </View>
                  <View style={styles.courseActions}>
                    <View style={[styles.pointsBadge, { backgroundColor: themeColors.accent }]}>
                      <Text style={[styles.pointsText, { color: themeColors.accentText }]}>+{course.points} pts</Text>
                    </View>
                    {course.isCompleted && (
                      <View style={styles.completedContainer}>
                        <MaterialCommunityIcons name="check-circle" size={12} color="#10B981" />
                        <Text style={styles.completedText}>Completed</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                {!course.isCompleted && course.progress > 0 && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressPercentage}>{course.progress}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Crisis Support */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Crisis Support</Text>
            <View style={styles.crisisCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialCommunityIcons name="phone" size={20} color="#EF4444" />
                </View>
                <View style={styles.crisisInfo}>
                  <Text style={styles.crisisTitle}>24/7 Crisis Helpline</Text>
                  <Text style={styles.crisisSubtitle}>Immediate support available</Text>
                  <Pressable onPress={callCrisisLine}>
                    <Text style={styles.crisisNumber}>91-9152987821</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0, // Add spacing from status bar on Android
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#dddbdbff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 50,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  quote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  author: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cardContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  podcastDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
    marginBottom: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  podcastCarouselContainer: {
    paddingHorizontal: 0,
    gap: 12,
  },
  podcastCarouselItem: {
    width: 280,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  podcastTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    lineHeight: 18,
  },
  podcastFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  podcastPublisher: {
    fontSize: 11,
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  podcastButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  podcastButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  linkButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#dddbdbff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 10,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  courseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
    marginTop: 5,
  },
  courseInstructor: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  courseDuration: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  courseActions: {
    alignItems: 'flex-end',
  },
  pointsBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
    marginTop: 5,
    marginEnd: 5,
 },
  pointsText: {
    fontSize: 10,
    color: '#065F46',
    fontWeight: '600',
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  completedText: {
    fontSize: 10,
    color: '#10B981',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressPercentage: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
  },
  crisisCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  crisisInfo: {
    flex: 1,
  },
  crisisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  crisisSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  crisisNumber: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: 'bold',
  },
});
