// ChatScreen.tsx
import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

export default function ChatScreen() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const router = useRouter();

  // Audio visualization animations
  const animatedValues = useRef(
    Array.from({ length: 10 }, () => new Animated.Value(0.1))
  ).current;

  // Start audio visualization animation
  const startAudioAnimation = () => {
    const animateBar = (animatedValue: Animated.Value) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: Math.random() * 0.8 + 0.2,
            duration: 200 + Math.random() * 300,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0.1 + Math.random() * 0.3,
            duration: 200 + Math.random() * 300,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    animatedValues.forEach(animateBar);
  };

  // Stop audio visualization animation
  const stopAudioAnimation = () => {
    animatedValues.forEach((animatedValue) => {
      animatedValue.stopAnimation();
      Animated.timing(animatedValue, {
        toValue: 0.1,
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
      const res = await fetch("http://192.168.0.90:8000/chat", {
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
      
      const res = await fetch("http://192.168.0.89:8000/chat", {
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

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={[
            styles.message, 
            item.role === "user" ? styles.user : 
            item.role === "system" ? styles.system : styles.bot
          ]}>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.messagesContainer}
      />

      {/* Audio Visualization Overlay */}
      {isRecording && (
        <View style={styles.audioOverlay}>
          <View style={styles.audioVisualizerContainer}>
            <Text style={styles.recordingText}>🎤 Recording...</Text>
            <View style={styles.audioVisualizer}>
              {animatedValues.map((animatedValue, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.audioBar,
                    {
                      height: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, 80],
                      }),
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.recordingSubText}>Tap stop button to finish</Text>
            
            {/* Mic Button in Overlay */}
            <TouchableOpacity 
              style={styles.overlayMicButton} 
              onPress={handleMicPress}
            >
              <Ionicons 
                name="stop" 
                size={32} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          editable={!isLoading}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity 
          style={[
            styles.micButton,
            isRecording ? styles.micButtonRecording : styles.micButtonIdle
          ]} 
          onPress={handleMicPress}
        >
          <Ionicons 
            name={isRecording ? "stop" : "mic"} 
            size={24} 
            color={isRecording ? "#fff" : "#007AFF"} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]} 
          onPress={sendMessage}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  messagesContainer: { padding: 10 },
  message: { padding: 10, marginVertical: 5, borderRadius: 8, maxWidth: "80%" },
  user: { alignSelf: "flex-end", backgroundColor: "#DCF8C6" },
  bot: { alignSelf: "flex-start", backgroundColor: "#E5E5EA" },
  system: { alignSelf: "center", backgroundColor: "#FFF3CD", borderColor: "#FFEAA7", borderWidth: 1 },
  messageText: { fontSize: 16 },
  inputContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#ccc",
    padding: 5,
    backgroundColor: "#f9f9f9",
  },
  input: { flex: 1, padding: 10, fontSize: 16 },
  micButton: {
    paddingHorizontal: 10,
    justifyContent: "center",
    marginLeft: 5,
    borderRadius: 20,
    borderWidth: 2,
  },
  micButtonIdle: {
    backgroundColor: "#fff",
    borderColor: "#007AFF",
  },
  micButtonRecording: {
    backgroundColor: "#ff4444",
    borderColor: "#ff4444",
  },
  sendButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    justifyContent: "center",
    borderRadius: 5,
    marginLeft: 5,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  sendText: { color: "#fff", fontWeight: "bold" },
  
  // Audio visualization overlay styles
  audioOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  audioVisualizerContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff4444",
    marginBottom: 20,
  },
  audioVisualizer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 80,
    marginBottom: 20,
  },
  audioBar: {
    width: 8,
    backgroundColor: "#007AFF",
    marginHorizontal: 2,
    borderRadius: 4,
  },
  recordingSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  overlayMicButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ff4444",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
