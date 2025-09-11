// ChatScreen.tsx
import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert, Animated, Platform, KeyboardAvoidingView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useThemeStore, getThemeColors } from '@/store/themeStore';
import { HardResetHandler } from '@/services/triggerer';

export default function ChatScreen() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const router = useRouter();

  // Theme support
  const selectedTheme = useThemeStore((state) => state.selectedTheme);
  const themeColors = getThemeColors(selectedTheme);

  // Dynamic gradient based on theme
  const getBackgroundColor = (): string => {
    switch (selectedTheme) {
      case 'forest':
        return '#F0FDF4'; // Light green
      case 'ocean':
        return '#EBF8FF'; // Light blue
      case 'retro':
        return '#FEF3C7'; // Light orange
      case 'blossom':
        return '#FDF2F8'; // Light pink
      case 'dark':
        return '#1F2937'; // Dark gray
      case 'light':
        return '#F9FAFB'; // Light gray
      default:
        return '#f8f9fa'; // Default
    }
  };

  // Dynamic accent color for buttons and icons
  const getAccentColor = (): string => {
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
        return '#007bff'; // Blue
      default:
        return '#007bff'; // Default blue
    }
  };

  // Audio visualization animations
  const animatedValues = useRef(
    Array.from({ length: 3 }, () => new Animated.Value(0.3))
  ).current;

  // Start audio visualization animation
  const startAudioAnimation = () => {
    const animateDot = (animatedValue: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    animatedValues.forEach((animatedValue, index) => {
      animateDot(animatedValue, index * 200);
    });
  };

  // Stop audio visualization animation
  const stopAudioAnimation = () => {
    animatedValues.forEach((animatedValue) => {
      animatedValue.stopAnimation();
      Animated.timing(animatedValue, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  };

  useEffect(() => {
    if (isRecording) {
      startAudioAnimation();
    } else {
      stopAudioAnimation();
    }
  }, [isRecording]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message to local state
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      console.log("Sending message to server:", userMsg);
      const res = await fetch("http://192.168.0.92:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      
      console.log("Response status:", res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Received response:", data);
      setMessages(prev => [...prev, { role: "bot", text: data.reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { 
        role: "bot", 
        text: "⚠️ Sorry, I'm having trouble connecting. Please check if the server is running." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Start Recording
  const startRecording = async () => {
    try {
      console.log("Requesting permissions...");
      const permission = await Audio.requestPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone permission to record audio');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Starting recording...");
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  // Stop Recording and send to API
  const stopRecording = async () => {
    console.log("Stopping recording...");
    if (!recordingRef.current) return;

    // Immediately hide the overlay by setting isRecording to false
    setIsRecording(false);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (uri) {
        console.log("Recording stopped. File stored at:", uri);
        
        // Create a new filename with MP3 extension
        const documentsDir = FileSystem.documentDirectory;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const mp3FileName = `recorded_audio_${timestamp}.mp3`;
        const mp3FilePath = `${documentsDir}${mp3FileName}`;
        
        // Copy/Move the recorded file to our desired location with MP3 extension
        await FileSystem.copyAsync({
          from: uri,
          to: mp3FilePath,
        });
        
        console.log("MP3 file saved to:", mp3FilePath);
        
        // Add a message to chat indicating processing
        setMessages(prev => [...prev, { 
          role: "system", 
          text: "🎤 Processing voice recording..." 
        }]);
        
        // Send MP3 file to API
        await sendAudioToAPI(mp3FilePath, mp3FileName);
        
      } else {
        throw new Error("Recording URI is null");
      }
    } catch (err) {
      console.error("Error processing recording:", err);
      Alert.alert('Error', 'Failed to process recording');
      setMessages(prev => [...prev, { 
        role: "system", 
        text: "❌ Voice recording failed" 
      }]);
    } finally {
      // Clean up the recording reference
      recordingRef.current = null;
    }
  };

  // Send audio file to API
  const sendAudioToAPI = async (filePath: string, fileName: string) => {
    try {
      const formData = new FormData();
      
      // The key must be 'audio_file' as per your API documentation
      formData.append('audio_file', {
        uri: filePath,
        type: 'audio/mp3',
        name: fileName,
      } as any);
      
      console.log("Sending audio to API...");
      
      const apiUrl = "https://b32a230878c8.ngrok-free.app/transcribe/";
      
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
        // Do NOT set Content-Type manually for FormData, React Native handles it.
        // Add the ngrok header.
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      console.log("API Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error! status: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log("API Response:", result);
      
      // Update chat with transcription result
      setMessages(prev => [...prev, { 
        role: "system", 
        text: `✅ Audio transcribed successfully!` 
      }]);
      
      // If the API returns transcribed text, add it as a user message and send to chatbot
      if (result.transcription || result.text || typeof result === 'string') {
        const transcribedText = result.transcription || result.text || result;
        
        // Add transcribed text as user message
        setMessages(prev => [...prev, { 
          role: "user", 
          text: transcribedText 
        }]);
        
        // Automatically send the transcribed text to your chatbot API
        await sendTranscribedMessageToChatbot(transcribedText);
      }
      
    } catch (error) {
      console.error("Error sending audio to API:", error);
      setMessages(prev => [...prev, { 
        role: "system", 
        text: "❌ Failed to transcribe audio. Please try again." 
      }]);
      Alert.alert('Error', 'Failed to send audio to transcription service');
    }
  };

  // Send transcribed message to chatbot
  const sendTranscribedMessageToChatbot = async (transcribedText: string) => {
    try {
      console.log("Sending transcribed message to chatbot:", transcribedText);
      
      const res = await fetch("http://192.168.0.92:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: transcribedText }),
      });
      
      console.log("Chatbot response status:", res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Received chatbot response:", data);
      
      // Add bot response to messages
      setMessages(prev => [...prev, { 
        role: "bot", 
        text: data.reply 
      }]);
      
    } catch (err) {
      console.error("Chatbot error:", err);
      setMessages(prev => [...prev, { 
        role: "bot", 
        text: "⚠️ Sorry, I'm having trouble connecting to the chatbot. Please try again." 
      }]);
    }
  };

  // Handle Mic Button Press
  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Handle Reset Button Press
  const handleReset = async () => {
    Alert.alert(
      "Confirm Hard Reset",
      "Are you sure you want to hard reset?",
      [
        {
          text: "No",
          onPress: () => console.log("Hard reset cancelled"),
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: async () => {
            try {
              console.log("Triggering hard reset...");
              
              // Clear local state immediately for better UX
              setMessages([]);
              setInput("");
              
              // Call the server to perform hard reset
              const result = await HardResetHandler.triggerHardReset();
              
              if (result.success) {
                console.log("Hard reset completed successfully");
                // Optionally show a success message
                setMessages([{ 
                  role: "system", 
                  text: "✅ Chat history has been reset and saved." 
                }]);
              } else {
                console.error("Hard reset failed:", result.error);
                // Show error message but keep the UI cleared
                setMessages([{ 
                  role: "system", 
                  text: "⚠️ Reset completed locally, but server sync failed. Please check your connection." 
                }]);
              }
            } catch (error) {
              console.error("Error during reset:", error);
              // Show error message but keep the UI cleared
              setMessages([{ 
                role: "system", 
                text: "⚠️ Reset completed locally, but server sync failed. Please check your connection." 
              }]);
            }
          }
        }
      ],
      { cancelable: false }
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      {/* Header with title and close button */}
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>WittyMate AI</Text>
          </View>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.push('/')} // Navigate to home tab
          >
            <Ionicons name="close" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat messages container */}
      <View style={[styles.messagesWrapper, { backgroundColor: getBackgroundColor() }]}>
        <FlatList
          data={messages}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={[
              styles.messageContainer,
              item.role === "user" ? styles.userMessageContainer : styles.botMessageContainer
            ]}>
              <View style={[
                styles.message, 
                item.role === "user" 
                  ? [styles.userMessage, { backgroundColor: getAccentColor() }]
                  : item.role === "system" 
                    ? [styles.systemMessage, { backgroundColor: themeColors.background, borderColor: themeColors.border }]
                    : [styles.botMessage, { backgroundColor: themeColors.surface }]
              ]}>
                <Text style={[
                  styles.messageText,
                  item.role === "user" 
                    ? styles.userMessageText 
                    : [styles.botMessageText, { color: themeColors.text }]
                ]}>{item.text}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Fixed input at bottom */}
      <View style={[styles.inputWrapper, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        <View style={styles.inputContainer}>
          <View style={[styles.inputBox, { backgroundColor: '#ffffff', borderColor: themeColors.border }]}>
            <TextInput
              style={[styles.input, { color: '#000000' }]}
              value={input}
              onChangeText={setInput}
              placeholder="Type a Message..."
              placeholderTextColor="#888888"
              editable={!isLoading}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              multiline={false}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                { backgroundColor: getAccentColor() },
                (!input.trim() || isLoading) && [styles.sendButtonDisabled, { backgroundColor: themeColors.textMuted }]
              ]} 
              onPress={sendMessage}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Voice and Reset buttons */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.voiceButton, { backgroundColor: getAccentColor(), borderColor: getAccentColor() }]} 
            onPress={handleMicPress}
          >
            <Ionicons 
              name={isRecording ? "stop" : "mic"} 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.resetButton, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Audio Visualization Overlay */}
      {isRecording && (
        <View style={styles.audioOverlay}>
          <View style={[styles.audioVisualizerContainer, { backgroundColor: themeColors.surface }]}>
            {/* Blue microphone icon */}
            <View style={[styles.micIconContainer, { backgroundColor: getAccentColor() }]}>
              <Ionicons name="mic" size={32} color="#fff" />
            </View>
            
            {/* Listening text */}
            <Text style={[styles.listeningText, { color: themeColors.text }]}>Listening...</Text>
            
            {/* Subtitle */}
            <Text style={[styles.listeningSubtext, { color: themeColors.textSecondary }]}>Speak now, I'm listening</Text>
            
            {/* Animated dots */}
            <View style={styles.dotsContainer}>
              {[0, 1, 2].map((index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    { backgroundColor: getAccentColor() },
                    {
                      opacity: animatedValues[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                      }),
                    },
                  ]}
                />
              ))}
            </View>
            
            {/* Cancel Button */}
            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: themeColors.background, borderColor: themeColors.border }]} 
              onPress={handleMicPress}
            >
              <Text style={[styles.cancelButtonText, { color: themeColors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    //paddingTop: Platform.OS === 'android' ? 25 : 0, // Add spacing from status bar on Android
  },
  
  // Header styles
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 20,
    },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 30,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: "500",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  
  // Messages styles
  messagesWrapper: {
    flex: 1,
  },
  messagesContainer: { 
    padding: 16,
    paddingBottom: 20, // Reduced padding since we have margin
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  botMessageContainer: {
    alignItems: "flex-start",
  },
  message: { 
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: { 
    borderBottomRightRadius: 6,
  },
  botMessage: { 
    borderBottomLeftRadius: 6,
  },
  systemMessage: { 
    borderWidth: 1,
    alignSelf: "center",
  },
  messageText: { 
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: "white",
  },
  botMessageText: {
    // Color now set dynamically
  },
  
  // Input styles
  inputWrapper: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    //marginBottom: Platform.OS === 'ios' ? 0 : 18, // Extra margin for Android
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  inputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: { 
    flex: 1, 
    fontSize: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    // Background color now set dynamically
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceButton: {
    // Colors now set dynamically
  },
  resetButton: {
    // Colors now set dynamically
  },
  
  // Audio overlay styles
  audioOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  audioVisualizerContainer: {
    alignItems: "center",
    padding: 40,
    borderRadius: 20,
    minWidth: 280,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  micIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  listeningText: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  listeningSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
