import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function SignUpScreen() {
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState(""); // 🆕 new state for username
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  // device-block UI removed — device id is stored only in SecureStore
  const router = useRouter();

  // Auto-close welcome modal after 5 seconds and navigate
  useEffect(() => {
    if (!showWelcome) return;
    const t = setTimeout(() => {
      setShowWelcome(false);
      router.replace('/marketplace');
    }, 5000);
    return () => clearTimeout(t);
  }, [showWelcome, router]);

  const handleSignUp = async () => {
    setErrorMsg(null);
    if (!username || !email || !password) {
      setErrorMsg("Please fill all fields.");
      return;
    }

    setLoading(true);
    try {
      // ensure a local device id exists (stored only in SecureStore)
      await getOrCreateDeviceId();
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
      // mark first signup in secure store
      await SecureStore.setItemAsync('firstSignup', 'true');

      // write profile document (deviceId is stored locally only)
      try {
        await setDoc(doc(db, 'profile', user.uid), {
          uid: user.uid,
          username,
          email: user.email || null,
          createdAt: serverTimestamp(),
        });
      } catch (e: any) {
        console.warn('Failed to write profile document', e);
      }

      // Show a styled welcome modal instead of a plain alert
      setShowWelcome(true);
    } catch (error: any) {
      const msg = error?.message || String(error);
      setErrorMsg(msg);
      Alert.alert("Sign Up Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ensure a local device id exists (stored only in SecureStore)
      await getOrCreateDeviceId();

      // Save UID and displayName if present
      await SecureStore.setItemAsync("userUID", user.uid);
      if (user.displayName) {
        await SecureStore.setItemAsync("username", user.displayName);
      }

      router.replace("/marketplace");
    } catch (error: any) {
      const msg = error?.message || String(error);
      setErrorMsg(msg);
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  // Helper: read or create a stable device id stored in SecureStore
  async function getOrCreateDeviceId() {
    try {
      // prefer native installation id when available (dynamic import so app still builds without the package)
      let nativeId: string | null = null
      try {
        // try to require expo-application at runtime without static import
        try {
          const req: any = eval('require')
          const Application: any = req('expo-application')
          if (Platform.OS === 'android') nativeId = Application?.androidId || null
          else if (Platform.OS === 'ios' && Application?.getIosIdForVendorAsync) nativeId = await Application.getIosIdForVendorAsync().catch(() => null)
        } catch (e) {
          // if eval('require') isn't allowed, we don't try to import and just continue
        }
      } catch (e) {
        // ignore if expo-application is not installed
        nativeId = null
      }
      if (nativeId) {
        // persist a copy for convenience
        await SecureStore.setItemAsync('deviceId', nativeId).catch(() => {})
        return nativeId
      }

      let did = await SecureStore.getItemAsync('deviceId');
      if (did) return did;
      // fallback: generate a simple unique id and persist it
      const newId = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
      await SecureStore.setItemAsync('deviceId', newId);
      return newId;
    } catch (e:any) {
      console.warn('Failed to read/create deviceId', e);
      // last resort: return a timestamp-based id (not persisted)
      return `dev-fallback-${Date.now()}`;
    }
  }

  // requestDeviceRelease removed — device release flow handled server-side/admin if needed

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.brand}>
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/images/android-icon-foreground.png')} style={styles.logo} />
        </View>
        <Text style={styles.title}>{isLogin ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={styles.subtitle}>{isLogin ? 'Sign in to continue' : 'Join us now — create a free account'}</Text>
      </View>

      <Modal
        visible={showWelcome}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWelcome(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Welcome to Paddi Supa</Text>
            <Text style={styles.modalMessage}>Hi {username || 'there'}, your account has been created successfully.</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowWelcome(false);
                router.replace('/marketplace');
              }}
            >
              <Text style={styles.modalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Device-block UI removed (device id stored locally only) */}

      <View style={styles.card}>
        {/* Username only for sign up */}
        {!isLogin && (
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Full name or username"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              placeholderTextColor="#A3A3A3"
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholderTextColor="#A3A3A3"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholderTextColor="#A3A3A3"
            secureTextEntry={hidePassword}
            textContentType={isLogin ? 'password' : 'newPassword'}
          />
          <TouchableOpacity
            onPress={() => setHidePassword(!hidePassword)}
            style={styles.icon}
            accessibilityLabel={hidePassword ? 'Show password' : 'Hide password'}
          >
            <Ionicons
              name={hidePassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <TouchableOpacity onPress={() => Alert.alert("Recover Password")}>
          <Text style={styles.recoveryText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading ? styles.buttonDisabled : null]}
          onPress={isLogin ? handleLogin : handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isLogin ? 'Sign in' : 'Create account'}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{isLogin ? "Don't have an account?" : 'Already have an account?'}</Text>
          <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setErrorMsg(null); }}>
            <Text style={styles.switchAction}>{isLogin ? 'Sign up' : 'Sign in'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F7F8FB",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  brand: {
    alignItems: "center",
    marginBottom: 18,
  },
  logoWrap: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(253, 253, 253, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    color: "#6B7280",
    marginTop: 6,
    fontSize: 13,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  inputContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    color: '#0F172A',
    fontSize: 15,
    paddingVertical: 0,
  },
  icon: { marginLeft: 8 },
  recoveryText: { alignSelf: 'flex-end', color: '#6C63FF', marginBottom: 12 },
  errorText: { color: '#BE123C', marginBottom: 8 },
  button: { backgroundColor: '#6C63FF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  switchText: { color: '#6B7280', marginRight: 6 },
  switchAction: { color: '#6C63FF', fontWeight: '700' },
  logo: { width: 200, height: 200, resizeMode: 'contain' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '86%', backgroundColor: '#fff', borderRadius: 12, padding: 18, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  modalMessage: { color: '#6B7280', textAlign: 'center', marginBottom: 14 },
  modalButton: { backgroundColor: '#6C63FF', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 10 },
  modalButtonText: { color: '#fff', fontWeight: '700' },
});