import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  Linking,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const [isTopicsDropdownOpen, setIsTopicsDropdownOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState<ContextType>('general');

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

  const quickTipsByContext: Record<ContextType, QuickTip> = {
    general: {
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
    },
    stress: {
      quote: {
        text: "You have been assigned this mountain to show others it can be moved.",
        author: "Mel Robbins"
      },
      article: {
        title: "10 Effective Stress Management Techniques",
        source: "Harvard Health",
        url: "https://www.health.harvard.edu/stress-management"
      },
      podcast: {
        title: "Stress Less with Dr. Mark Hyman",
        host: "Dr. Mark Hyman",
        duration: "30 min",
        spotifyUrl: "https://open.spotify.com/show/stress-less"
      }
    },
    anxiety: {
      quote: {
        text: "Anxiety is the dizziness of freedom.",
        author: "Søren Kierkegaard"
      },
      article: {
        title: "Understanding and Managing Anxiety",
        source: "Mayo Clinic",
        url: "https://www.mayoclinic.org/anxiety"
      },
      podcast: {
        title: "The Anxiety Guy Podcast",
        host: "Dennis Simsek",
        duration: "35 min",
        spotifyUrl: "https://open.spotify.com/show/anxiety-guy"
      }
    },
    depression: {
      quote: {
        text: "Even the darkest night will end and the sun will rise.",
        author: "Victor Hugo"
      },
      article: {
        title: "Breaking Through Depression",
        source: "Mental Health America",
        url: "https://www.mhanational.org/depression"
      },
      podcast: {
        title: "Depression and Bipolar Support",
        host: "DBSA",
        duration: "40 min",
        spotifyUrl: "https://open.spotify.com/show/dbsa"
      }
    },
    motivation: {
      quote: {
        text: "The only impossible journey is the one you never begin.",
        author: "Tony Robbins"
      },
      article: {
        title: "Building Lasting Motivation",
        source: "Forbes",
        url: "https://www.forbes.com/motivation"
      },
      podcast: {
        title: "Motivation Daily",
        host: "Motivation Ark",
        duration: "20 min",
        spotifyUrl: "https://open.spotify.com/show/motivation-daily"
      }
    },
    sleep: {
      quote: {
        text: "Sleep is the best meditation.",
        author: "Dalai Lama"
      },
      article: {
        title: "The Science of Better Sleep",
        source: "Sleep Foundation",
        url: "https://www.sleepfoundation.org"
      },
      podcast: {
        title: "Sleep With Me",
        host: "Drew Ackerman",
        duration: "60 min",
        spotifyUrl: "https://open.spotify.com/show/sleep-with-me"
      }
    },
    confidence: {
      quote: {
        text: "Believe you can and you're halfway there.",
        author: "Theodore Roosevelt"
      },
      article: {
        title: "Building Self-Confidence",
        source: "Psychology Today",
        url: "https://www.psychologytoday.com/confidence"
      },
      podcast: {
        title: "The Confidence Code",
        host: "Kay & Claire",
        duration: "45 min",
        spotifyUrl: "https://open.spotify.com/show/confidence-code"
      }
    }
  };

  const topics = [
    { key: 'general' as ContextType, label: 'General Wellness', icon: '💚' },
    { key: 'stress' as ContextType, label: 'Stress Relief', icon: '🧘' },
    { key: 'anxiety' as ContextType, label: 'Anxiety Support', icon: '💙' },
    { key: 'depression' as ContextType, label: 'Mood Boost', icon: '🌟' },
    { key: 'motivation' as ContextType, label: 'Motivation', icon: '🚀' },
    { key: 'sleep' as ContextType, label: 'Better Sleep', icon: '😴' },
    { key: 'confidence' as ContextType, label: 'Self-Confidence', icon: '💪' }
  ];

  const currentTip = quickTipsByContext[currentContext];

  const updateQuickTips = (context: ContextType) => {
    setCurrentContext(context);
    setIsTopicsDropdownOpen(false);
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

  const getIconColor = (type: string) => {
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
    <LinearGradient colors={['#EBF4FF', '#F3E8FF', '#FDF2F8']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Learning Resources</Text>
          </View>

          {/* Quick Tips Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Tips</Text>
              <View style={styles.topicsContainer}>
                {currentContext !== 'general' && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {currentContext.charAt(0).toUpperCase() + currentContext.slice(1)} Support
                    </Text>
                  </View>
                )}
                <Pressable 
                  style={styles.dropdownButton}
                  onPress={() => setIsTopicsDropdownOpen(true)}
                >
                  <Text style={styles.dropdownButtonText}>Explore Topics</Text>
                  <MaterialCommunityIcons 
                    name="chevron-down"
                    size={16} 
                    color="#6B7280" 
                  />
                </Pressable>
              </View>
            </View>

            <Modal
              transparent={true}
              visible={isTopicsDropdownOpen}
              animationType="fade"
              onRequestClose={() => setIsTopicsDropdownOpen(false)}
            >
              <Pressable style={styles.modalOverlay} onPress={() => setIsTopicsDropdownOpen(false)}>
                <View style={styles.dropdown}>
                  {topics.map((topic) => (
                    <Pressable
                      key={topic.key}
                      style={[
                        styles.topicItem,
                        currentContext === topic.key && styles.topicItemActive
                      ]}
                      onPress={() => updateQuickTips(topic.key)}
                    >
                      <Text style={styles.topicIcon}>{topic.icon}</Text>
                      <Text style={[
                        styles.topicLabel,
                        currentContext === topic.key && styles.topicLabelActive
                      ]}>
                        {topic.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Pressable>
            </Modal>

            {/* Daily Inspiration */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="lightbulb" size={20} color="#4F46E5" />
                </View>
                <Text style={styles.cardTitle}>Daily Inspiration</Text>
              </View>
              <Text style={styles.quote}>"{currentTip.quote.text}"</Text>
              <Text style={styles.author}>— {currentTip.quote.author}</Text>
            </View>

            {/* Recommended Reading */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <MaterialCommunityIcons name="file-document" size={20} color="#3B82F6" />
                </View>
                <Text style={styles.cardTitle}>Recommended Reading</Text>
              </View>
              <Text style={styles.cardContent}>{currentTip.article.title}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.sourceText}>{currentTip.article.source}</Text>
                <Pressable style={styles.linkButton} onPress={() => openLink(currentTip.article.url)}>
                  <Text style={styles.linkButtonText}>Read Article</Text>
                </Pressable>
              </View>
            </View>

            {/* Podcast Recommendation */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
                  <MaterialCommunityIcons name="volume-high" size={20} color="#10B981" />
                </View>
                <Text style={styles.cardTitle}>Listen & Learn</Text>
              </View>
              <Text style={styles.cardContent}>{currentTip.podcast.title}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.sourceText}>by {currentTip.podcast.host} • {currentTip.podcast.duration}</Text>
                <Pressable 
                  style={[styles.linkButton, { backgroundColor: '#10B981' }]} 
                  onPress={() => openLink(currentTip.podcast.spotifyUrl)}
                >
                  <MaterialCommunityIcons name="volume-high" size={12} color="white" />
                  <Text style={[styles.linkButtonText, { color: 'white' }]}>Listen</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Available Courses */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Courses</Text>
            {availableCourses.map((course) => (
              <View key={course.id} style={styles.courseCard}>
                <View style={styles.courseHeader}>
                  <View style={[styles.courseIconContainer, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons 
                      name={getIcon(course.type) as any} 
                      size={24} 
                      color={getIconColor(course.type)} 
                    />
                  </View>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.courseInstructor}>by {course.instructor}</Text>
                    <Text style={styles.courseDuration}>{course.duration}</Text>
                  </View>
                  <View style={styles.courseActions}>
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsText}>+{course.points} pts</Text>
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
  topicsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    color: '#4F46E5',
    fontWeight: '500',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  dropdownButtonText: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dropdown: {
    position: 'absolute',
    top: 165, // Adjust this value to position the dropdown correctly below the button
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  topicItemActive: {
    backgroundColor: '#4F46E5',
  },
  topicIcon: {
    fontSize: 16,
  },
  topicLabel: {
    fontSize: 12,
    color: '#374151',
  },
  topicLabelActive: {
    color: 'white',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
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
  },
  pointsText: {
    fontSize: 10,
    color: '#065F46',
    fontWeight: '600',
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
