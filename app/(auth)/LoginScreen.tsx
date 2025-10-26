import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../firebaseConfig";

export default function SignUpScreen() {
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState(""); // 🆕 new state for username
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!username || !email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 🆕 Set username in Firebase profile
      await updateProfile(user, {
        displayName: username,
      });

      // 🆕 Store UID and username securely
      await SecureStore.setItemAsync("userUID", user.uid);
      await SecureStore.setItemAsync("username", username);

      Alert.alert("Account Created", `Welcome aboard, ${username}!`);
      router.replace("/marketplace");
    } catch (error: any) {
      Alert.alert("Sign Up Failed", error.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save UID and displayName if present
      await SecureStore.setItemAsync("userUID", user.uid);
      if (user.displayName) {
        await SecureStore.setItemAsync("username", user.displayName);
      }

      router.replace("/marketplace");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Create an account'}</Text>

      {/* Username only for sign up */}
      {!isLogin && (
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Choose a username"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            placeholderTextColor="#aaa"
          />
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholderTextColor="#aaa"
          secureTextEntry={hidePassword}
        />
        <TouchableOpacity
          onPress={() => setHidePassword(!hidePassword)}
          style={styles.icon}
        >
          <Ionicons
            name={hidePassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => Alert.alert("Recover Password")}>
        <Text style={styles.recoveryText}>Recovery Password</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading ? { opacity: 0.7 } : null]}
        onPress={isLogin ? handleLogin : handleSignUp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Continue'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginTop: 16, alignSelf: 'center' }}
        onPress={() => setIsLogin(!isLogin)}
      >
        <Text style={{ color: '#6C63FF' }}>
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 25,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 35,
    color: "#000",
  },
  inputContainer: {
    backgroundColor: "#f4f4f4",
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 50,
    color: "#000",
    fontSize: 16,
  },
  icon: {
    marginLeft: 8,
  },
  recoveryText: {
    alignSelf: "flex-end",
    color: "#6C63FF",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#6C63FF",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});