// ChatScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from "react-native";

export default function ChatScreen() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={[styles.message, item.role === "user" ? styles.user : styles.bot]}>
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
  messageText: { fontSize: 16 },
  inputContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#ccc",
    padding: 5,
    backgroundColor: "#f9f9f9",
  },
  input: { flex: 1, padding: 10, fontSize: 16 },
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
