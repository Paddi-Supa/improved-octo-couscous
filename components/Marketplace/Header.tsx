import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { app } from "../../firebaseConfig";

export default function Header() {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    const user = auth.currentUser;

    if (user?.photoURL) {
      setUserPhoto(user.photoURL);
    } else {
      SecureStore.getItemAsync("userPhoto").then((photo) => {
        if (photo) setUserPhoto(photo);
      });
    }

    SecureStore.getItemAsync("username").then((storedName) => {
      if (storedName) {
        setUsername(storedName);
      } else if (user?.displayName) {
        setUsername(user.displayName);
      } else if (user?.email) {
        setUsername(user.email.split("@")[0]);
      }
    });
  }, []);

  const goToProfile = () => {
    router.push("/profile"); // ✅ navigates to your profile screen route
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Left: Avatar + username */}
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={goToProfile} activeOpacity={0.8}>
          <Image
            source={
              userPhoto
                ? { uri: userPhoto }
                : require("../../assets/images/default.png")
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={goToProfile} activeOpacity={0.7}>
          <Text style={styles.usernameText}>
            {username ? username : "Guest"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#888" />
        <TextInput
          placeholder="Search items or services..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      {/* Right placeholder (keeps layout even) */}
      <View style={{ width: 42 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#6d045bff",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  profileImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#eee",
    marginRight: 8,
  },
  usernameText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#ffffffff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    color: "#333",
    fontSize: 15,
  },
});