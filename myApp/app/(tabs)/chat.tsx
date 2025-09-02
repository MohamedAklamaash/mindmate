// ChatScreen.tsx
import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert } from "react-native";
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

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message to local state
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      console.log("Sending message to server:", userMsg);
      const res = await fetch("http://192.168.0.89:8000/chat", {
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

  // Stop Recording and Convert to Base64
  const stopRecording = async () => {
    console.log("Stopping recording...");
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (uri) {
        console.log("Recording stopped. File stored at:", uri);
        
        // Convert to base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log("Audio converted to base64 successfully");
        console.log("Base64 length:", base64.length);
        
        // Save the base64 to a file for testing
        const documentsDir = FileSystem.documentDirectory;
        const base64FilePath = `${documentsDir}recorded_audio_base64.txt`;
        
        await FileSystem.writeAsStringAsync(base64FilePath, base64);
        
        console.log("File saved to:", base64FilePath);
        
        // Add a message to chat indicating voice recording was saved
        setMessages(prev => [...prev, { 
          role: "system", 
          text: "🎤 Voice recording saved! (Base64 conversion complete)" 
        }]);
        
        // TODO: Send to Python server via WebSocket
        // For now, we're just storing the file
        
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
      setIsRecording(false);
      recordingRef.current = null;
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
});
