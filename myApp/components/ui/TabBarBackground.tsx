import React from "react";
import { StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";

export default function TabBarBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView
        intensity={90}
        tint="light" // force white-ish blur
        style={StyleSheet.absoluteFill}
      />
      {/* White translucent overlay to guarantee light effect */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(255, 255, 255, 0.3)" }, // tweak alpha
        ]}
      />
    </View>
  );
}
