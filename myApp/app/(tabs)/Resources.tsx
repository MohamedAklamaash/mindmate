import React, { useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore, getThemeColors } from '@/store/themeStore';
import { useUserStore } from '@/store/userStore';
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

type ContextType = 'general' | 'stress' | 'anxiety' | 'depression' | 'motivation' | 'sleep' | 'confidence';

export default function ResourcesScreen() {
  const quotesFetchedRef = React.useRef(false);
  const [spotifyPodcasts, setSpotifyPodcasts] = useState<PodcastData[]>([]);
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [currentContext] = useState<ContextType>('general');
  // Quote states
  const [aiQuote, setAiQuote] = useState<{ text: string; author: 'Witty Mate' } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteOfTheDay, setQuoteOfTheDay] = useState<{ text: string; author: string } | null>(null);
  const [quoteOfTheDayLoading, setQuoteOfTheDayLoading] = useState(false);
  
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
  ];

  // Context-based content
  // Fallback static tip used only if Gemini fails
  const fallbackTip = {
    quote: {
      text: "You're not alone — feelings pass and kinder days are ahead.",
      author: 'Witty Mate',
    },
    podcast: {
      title: 'The Science of Happiness',
      host: 'Dr. Laurie Santos',
      duration: '25 min',
      spotifyUrl: 'https://open.spotify.com/show/happiness',
    },
  } as const;

  // Fetch health podcast data from Spotify
  const fetchHealthPodcastData = async () => {
    setPodcastLoading(true);
    try {
      const podcasts = await spotifyService.searchPodcasts();
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

        // Schedule a single combined quote fetch after the current tick so the
        // fetch function (declared later in this component) is defined.
        setTimeout(() => {
          try {
            fetchQuoteCombined();
          } catch (e) {
            console.error('Error scheduling initial quote fetch:', e);
          }
        }, 0);
      } catch (error) {
        console.error('Failed to initialize app or fetch podcasts:', error);
        // Still try to fetch podcasts even if initialization fails
        await fetchHealthPodcastData();
      }
    };

    initializeAndFetch();
  }, []);

  // Listen for the app-open event emitted by AppOpenHandler and refresh quotes once
  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('appOpened', (payload) => {
      // Log incoming payload and fetch fresh quotes when the app open/exit handler runs
      try {
        console.log('Received appOpened event payload:', payload);

        // If the payload includes an emotion_sentiment (from app-exit), pass it through
        // so the combined fetch uses the server-provided emotion. This also ensures
        // we call the fetch even when the server returns [null, null] by sanitizing
        // that to 'neutral'.
        const serverEmotion = payload && Object.prototype.hasOwnProperty.call(payload, 'emotion_sentiment')
          ? payload.emotion_sentiment
          : undefined;

        fetchQuoteCombined(serverEmotion);
      } catch (e) {
        console.error('Error refreshing quotes on appOpened event:', e);
      }
    });

    return () => listener.remove();
  }, []);

    // Listen for quotes fetched by the shared service so UI updates even when
    // the fetch was initiated elsewhere (e.g., AppExitHandler). Payload shape: { quote, author, thought }
    useEffect(() => {
      const qListener = DeviceEventEmitter.addListener('quotesFetched', (payload) => {
        try {
          console.log('Received quotesFetched payload:', payload);
          if (!payload) return;

          setQuoteOfTheDay({ text: payload.quote || fallbackTip.quote.text, author: payload.author || fallbackTip.quote.author });
          const thoughtText = payload.thought || payload.quote || fallbackTip.quote.text;
          // Respect design decision: Daily Inspiration author is 'Witty Mate'
          setAiQuote({ text: thoughtText, author: 'Witty Mate' });
        } catch (e) {
          console.error('Error applying quotesFetched payload:', e);
        }
      });

      return () => qListener.remove();
    }, []);

  // Combined fetch that calls the endpoint once and sets both Quote of the Day
  // and Daily Inspiration (thought). Uses a ref to avoid duplicate concurrent calls.
  const fetchQuoteCombined = async (emotionOverride?: string | string[]) => {
    // If an explicit emotion is provided, force a fetch (useful when app-exit reports emotion).
    if (quotesFetchedRef.current && emotionOverride === undefined) {
      console.log('Quotes already fetched in this session, skipping combined fetch.');
      return;
    }

    // Mark as fetched to avoid duplicate background fetches; explicit emotionOverride still triggers.
    quotesFetchedRef.current = true;

    // Determine emotion: override > store > neutral
    const rawFromStore = useUserStore.getState().currentEmotion ?? 'neutral';
    let currentEmotionRaw = emotionOverride ?? rawFromStore ?? 'neutral';

    // Sanitize emotion when server returns arrays like [null, null] or empty values.
    // If it's an array, pick the first non-empty string; otherwise coerce to string.
    const sanitizeEmotion = (val: any): string => {
      if (Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === 'string' && item.trim().length > 0) return item.trim();
        }
        return 'neutral';
      }
      if (typeof val === 'string') {
        return val.trim().length > 0 ? val.trim() : 'neutral';
      }
      // for null/undefined/other, fallback to neutral
      return 'neutral';
    };

    const currentEmotion = sanitizeEmotion(currentEmotionRaw);
    console.log('Sanitized emotion for get-quote-thought:', currentEmotion);
    setQuoteLoading(true);
    setQuoteOfTheDayLoading(true);

    try {
  const requestBody = { emotion: currentEmotion };
      console.log('get-quote-thought combined request body:', requestBody);

      const res = await fetch('https://mind-mate-two-tau.vercel.app/get-quote-thought', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('get-quote-thought combined response status:', res.status, 'ok:', res.ok);
      const rawText = await res.text();
      console.log('get-quote-thought combined raw body text:', rawText);

      let payload: any = {};
      try {
        payload = rawText ? JSON.parse(rawText) : {};
      } catch (parseErr) {
        console.error('Failed to parse get-quote-thought combined JSON:', parseErr);
        payload = {};
      }

      console.log('get-quote-thought combined parsed payload:', payload);

      if (!res.ok) {
        console.warn('get-quote-thought combined endpoint returned error', res.status, payload);
        setQuoteOfTheDay({ text: fallbackTip.quote.text, author: fallbackTip.quote.author });
        setAiQuote({ text: fallbackTip.quote.text, author: fallbackTip.quote.author });
      } else {
        // payload: { quote, author, thought }
        setQuoteOfTheDay({ text: payload.quote || fallbackTip.quote.text, author: payload.author || fallbackTip.quote.author });

  const thoughtText = payload.thought || payload.quote || fallbackTip.quote.text;
  // Force Daily Inspiration author to 'Witty Mate' per design decision
  const thoughtAuthor = 'Witty Mate';
  setAiQuote({ text: thoughtText, author: thoughtAuthor });
      }
    } catch (err) {
      console.error('Failed to fetch combined quote:', err);
      setQuoteOfTheDay({ text: fallbackTip.quote.text, author: fallbackTip.quote.author });
      setAiQuote({ text: fallbackTip.quote.text, author: fallbackTip.quote.author });
    } finally {
      setQuoteLoading(false);
      setQuoteOfTheDayLoading(false);
    }
  };



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

            {/* Quote of the Day */}
            <View style={[styles.card, { backgroundColor: themeColors.surface}]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: selectedTheme === 'forest' ? '#F0F9FF' : '#FEF3C7' }]}>
                  <MaterialCommunityIcons 
                    name="comment-quote-outline" 
                    size={20} 
                    color={selectedTheme === 'forest' ? "#0EA5E9" : "#F59E0B"} 
                  />
                </View>
                <Text style={[styles.cardTitle, { color: themeColors.text }]}>Quote of the Day</Text>
              </View>
              {quoteOfTheDayLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={themeColors.primary} />
                  <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>Loading quote...</Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.quote, { color: themeColors.textSecondary }]}>
                    "{(quoteOfTheDay && quoteOfTheDay.text) || fallbackTip.quote.text}"
                  </Text>
                  <Text style={[styles.author, { color: themeColors.textMuted }]}>— {(quoteOfTheDay && quoteOfTheDay.author) || fallbackTip.quote.author}</Text>
                </>
              )}
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
              {quoteLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={themeColors.primary} />
                  <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>Loading inspiration...</Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.quote, { color: themeColors.textSecondary }]}>
                    "{(aiQuote && aiQuote.text) || fallbackTip.quote.text}"
                  </Text>
                  <Text style={[styles.author, { color: themeColors.textMuted }]}>— {(aiQuote && aiQuote.author) || fallbackTip.quote.author}</Text>
                </>
              )}
            </View>

            {/* Recommended Reading section removed per request */}

            {/* Podcast was moved into Available Courses as the first tab */}
          </View>

          {/* Available Courses: Listen & Learn followed by Courses */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Available Courses</Text>

            {/* Podcast carousel shown first */}
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
                  <Text style={[styles.cardContent, { color: themeColors.textSecondary }]}>{fallbackTip.podcast.title}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={[styles.sourceText, { color: themeColors.textMuted }]}>by {fallbackTip.podcast.host} • {fallbackTip.podcast.duration}</Text>
                    <Pressable 
                      style={[styles.linkButton, { backgroundColor: themeColors.secondary }]} 
                      onPress={() => openLink(fallbackTip.podcast.spotifyUrl)}
                    >
                      <MaterialCommunityIcons name="volume-high" size={12} color={themeColors.secondaryText} />
                      <Text style={[styles.linkButtonText, { color: themeColors.secondaryText }]}>Listen</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>

            {/* Then show courses (each course has its own card) */}
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
    paddingVertical: 8,
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
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
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
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  topicOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  topicOptionActive: {
    backgroundColor: '#F3F4F6',
  },
  topicLabel: {
    fontSize: 16,
    flex: 1,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tabsHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  tabButtonTextActive: {
    color: '#4F46E5',
  },
});
