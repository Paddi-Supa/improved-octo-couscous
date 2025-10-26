import { useNavigation } from "@react-navigation/native";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../../../firebaseConfig";

export default function CreatePostScreen() {
  const [text, setText] = useState("");
  const navigation = useNavigation();

  const handlePost = async () => {
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount > 90) {
      return Alert.alert("Limit reached", "Maximum 90 words allowed.");
    }
    if (text.trim().length < 2) {
      return Alert.alert("Too short", "Write something meaningful.");
    }

    let payload: any = null;
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("CreatePost aborted: no authenticated user");
        return;
      }

      payload = {
        authorId: user.uid,
        text: text.trim(),
        timestamp: serverTimestamp()
      };

      console.log("Creating post; payload:", payload);

      await addDoc(collection(db, "posts"), payload);

      console.log("Post created successfully (client-side)");
      setText("");
      navigation.goBack();
    } catch (error: any) {
      // Log error details to help debug permission or payload issues
      console.log("Post Error:", error);
      if (error && error.code) console.log("Firestore error code:", error.code);
      console.log("Auth currentUser at error:", auth.currentUser);
      console.log("Payload at failure:", payload);
      Alert.alert("Error", `Something went wrong while posting. ${error?.message || ''}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Post</Text>

      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        placeholderTextColor="#999"
        multiline
        value={text}
        onChangeText={setText}
      />

      <Text style={styles.wordCount}>{text.trim().split(/\s+/).length}/90 words</Text>

      <TouchableOpacity style={styles.postBtn} onPress={handlePost}>
        <Text style={styles.postBtnText}>Post</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#fff", padding: 16
  },
  header: {
    fontSize: 20, fontWeight: "600", marginBottom: 16
  },
  input: {
    height: 200,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    textAlignVertical: "top",
  },
  wordCount: {
    textAlign: "right",
    marginTop: 6,
    color: "#444"
  },
  postBtn: {
    marginTop: 20,
    backgroundColor: "#00a86b",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center"
  },
  postBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16
  }
});