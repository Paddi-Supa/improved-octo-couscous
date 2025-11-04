import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function CreatePhotoPostScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coming Soon</Text>
      <Text style={styles.subtitle}>
        Photo posts are on the way — stay tuned!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#6501B5",
  },
  title: {
    fontSize: 44,
    fontWeight: "700",
    marginBottom: 8,
    color: "#FFF",
  },
  subtitle: {
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
  },
});