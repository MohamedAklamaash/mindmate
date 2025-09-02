import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";

export default function MicRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("Ready to record");
  const recordingRef = useRef<Audio.Recording | null>(null);

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
      setRecordingStatus("Recording...");
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setRecordingStatus("Failed to start recording");
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  // Stop Recording and Convert to Base64
  const stopRecording = async () => {
    console.log("Stopping recording...");
    if (!recordingRef.current) return;

    try {
      setRecordingStatus("Processing...");
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (uri) {
        console.log("Recording stopped. File stored at:", uri);
        
        // Convert to base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // For now, just store the base64 and print success message
        console.log("Audio converted to base64 successfully");
        console.log("Base64 length:", base64.length);
        
        // Save the base64 to a file for testing
        const documentsDir = FileSystem.documentDirectory;
        const base64FilePath = `${documentsDir}recorded_audio_base64.txt`;
        
        await FileSystem.writeAsStringAsync(base64FilePath, base64);
        
        setRecordingStatus("File saved successfully!");
        console.log("File saved to:", base64FilePath);
        
        Alert.alert('Success', 'Audio recorded and converted to base64. File saved!');
        
        // TODO: Send to Python server via WebSocket
        // For now, we're just storing the file
        
      } else {
        throw new Error("Recording URI is null");
      }
    } catch (err) {
      console.error("Error processing recording:", err);
      setRecordingStatus("Error processing recording");
      Alert.alert('Error', 'Failed to process recording');
    } finally {
      setIsRecording(false);
      recordingRef.current = null;
      
      // Reset status after a delay
      setTimeout(() => {
        setRecordingStatus("Ready to record");
      }, 3000);
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
      <View style={styles.header}>
        <Text style={styles.title}>Voice Recorder</Text>
        <Text style={styles.status}>{recordingStatus}</Text>
      </View>

      <View style={styles.micContainer}>
        <TouchableOpacity 
          style={[
            styles.micButton, 
            isRecording ? styles.micButtonRecording : styles.micButtonIdle
          ]} 
          onPress={handleMicPress}
        >
          <Ionicons 
            name={isRecording ? "stop" : "mic"} 
            size={60} 
            color={isRecording ? "#fff" : "#007AFF"} 
          />
        </TouchableOpacity>
        
        <Text style={styles.instruction}>
          {isRecording ? "Tap to stop recording" : "Tap to start recording"}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          • Audio will be recorded in high quality
        </Text>
        <Text style={styles.infoText}>
          • Recording will be converted to base64
        </Text>
        <Text style={styles.infoText}>
          • File will be saved locally for now
        </Text>
        <Text style={styles.infoText}>
          • WebSocket integration coming soon
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  micContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
    marginBottom: 20,
  },
  micButtonIdle: {
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  micButtonRecording: {
    backgroundColor: "#ff4444",
  },
  instruction: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    fontWeight: "500",
  },
  infoContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
});
