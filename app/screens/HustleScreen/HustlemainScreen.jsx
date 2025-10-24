import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { getAuth } from "firebase/auth";
import { doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Checkbox,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

// ⭐️ NEW IMPORT: Supabase client from your utils folder
import { supabase } from "../../../utils/supabaseClient";

export default function HustlemainScreen() {
  const navigation = useNavigation();
  const auth = getAuth();
  const db = getFirestore();

  // ⭐️ NEW CONSTANT: Use your bucket name
  const SUPABASE_BUCKET_NAME = "hustle-uploads";

  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    businessName: "",
    phoneNumber: "",
    idImage: null,
    profileImage: null,
    address: "",
    agree: false,
  });

  // ✅ UPDATED: Check SecureStore for 'true' OR 'pending' status
  useEffect(() => {
    (async () => {
      try {
        const status = await SecureStore.getItemAsync("isVerified");
        // If the user is already verified OR has a pending submission, navigate away.
        if (status === "true" || status === "pending") {
          setIsVerified(true);
        }
      } catch (e) {
        console.warn("SecureStore read error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ✅ NEW: Handle navigation as a side effect
  useEffect(() => {
    // If verified, don't render the form, just navigate away.
    if (isVerified) {
      navigation.replace("HustleDashboard");
    }
  }, [isVerified, navigation]);

  // ✅ Image picker helper (SLIGHTLY MODIFIED for clarity)
  const pickImage = async (field) => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ // Use official MediaTypeOptions API
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!res.canceled) {
        const uri = res.assets?.[0]?.uri;
        setFormData((prev) => ({ ...prev, [field]: uri }));
      }
    } catch (e) {
      console.warn("Image pick error:", e);
    }
  };

  // ⭐️ NEW FUNCTION: Upload image to Supabase Storage
  const uploadImageToSupabase = async (uri, fieldName) => {
    const user = auth.currentUser;
    if (!user) {
        Alert.alert("Error", "User not logged in for upload.");
        return null;
    }

    try {
      // 1. Create a FormData object to send the file
      const formData = new FormData();
      const fileExtension = uri.split('.').pop();
      const fileName = `${fieldName}_${Date.now()}.${fileExtension}`;
      const fileType = `image/${fileExtension}`;

      // Append the file with the correct format for React Native
      formData.append('file', {
        uri,
        name: fileName,
        type: fileType,
      });

      // 2. Define the path and upload the FormData
      const path = `verifications/${user.uid}/${fileName}`;
      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET_NAME)
        .upload(path, formData, {
          cacheControl: '3600', // Cache for 1 hour
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // 4. Get the public URL to save in Firestore
      const { data: publicUrlData } = supabase.storage
        .from(SUPABASE_BUCKET_NAME)
        .getPublicUrl(path);

      if (publicUrlData?.publicUrl) {
        console.log(`✅ Uploaded ${fieldName} successfully:`, publicUrlData.publicUrl);
        return publicUrlData.publicUrl;
      }
      
      return null;

    } catch (err) {
      console.error("Supabase upload error:", err.message);
      Alert.alert("Upload Error", `Failed to upload ${fieldName}. Please try again.`);
      return null;
    }
  };

  // ✅ Handle submit (UPDATED to use Supabase)
  const handleSubmit = async () => {
    const {
      fullName,
      email,
      businessName,
      phoneNumber,
      idImage,
      profileImage,
      address,
      agree,
    } = formData;

    if (
      !fullName ||
      !email ||
      !businessName ||
      !phoneNumber ||
      !idImage ||
      !profileImage ||
      !address
    ) {
      Alert.alert("Error", "Please fill all fields and upload both images.");
      return;
    }

    if (!agree) {
      Alert.alert("Error", "Please agree to the terms and conditions.");
      return;
    }

    setUploading(true);

    try {
      // 1. Upload images using the new Supabase function
      const idImageUrl = await uploadImageToSupabase(idImage, "idProof");
      const profileImageUrl = await uploadImageToSupabase(profileImage, "profilePic");

      if (!idImageUrl || !profileImageUrl) {
        setUploading(false);
        return; // Exit if upload failed (error is alerted inside the function)
      }

      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in.");
        setUploading(false);
        return;
      }

      // 2. Save data (with Supabase URLs) to Firebase Firestore
      const docRef = doc(db, "sellerVerifications", user.uid);
      await setDoc(docRef, {
        fullName,
        email,
        businessName,
        phoneNumber,
        address,
        idImage: idImageUrl, // Storing the Supabase URL
        profileImage: profileImageUrl, // Storing the Supabase URL
        verified: false, // Initial status is unverified/pending review
        timestamp: serverTimestamp(),
      });

      // Update SecureStore status to handle flow after submission
      await SecureStore.setItemAsync("isVerified", "pending");

      Alert.alert("Submission Successful ✅", "Your documents are submitted for review!", [
        { text: "OK", onPress: () => navigation.replace("HustleDashboard") },
      ]);
      
    } catch (err) {
      console.error("Submission error:", err);
      Alert.alert("Error", "Something went wrong during submission.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  // If verified, we render nothing while the useEffect navigates away.
  // The useEffect above will trigger the navigation.
  if (isVerified) return null;

  const handleTextChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#108834ff" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>
          BECOME A VERIFIED SELLER OR SERVICE PROVIDER
        </Text>

        <View style={styles.circleWrap}>
          <Image
            source={require("../../../assets/images/verifi.png")}
            style={styles.circleImage}
          />
        </View>

        <Text style={styles.instructions}>
          Follow the instructions listed below and become verified to reach your potential buyers.
        </Text>

        <TextInput
          label="Full Name"
          mode="outlined"
          value={formData.fullName}
          onChangeText={(t) => handleTextChange("fullName", t)}
          style={styles.input}
        />
        <TextInput
          label="Email"
          mode="outlined"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(t) => handleTextChange("email", t)}
          style={styles.input}
        />
        <TextInput
          label="Business / Service Name"
          mode="outlined"
          value={formData.businessName}
          onChangeText={(t) => handleTextChange("businessName", t)}
          style={styles.input}
        />
        <TextInput
          label="Active WhatsApp Number"
          mode="outlined"
          keyboardType="phone-pad"
          value={formData.phoneNumber}
          onChangeText={(t) => handleTextChange("phoneNumber", t)}
          style={styles.input}
        />
        <TextInput
          label="Address / Mobile"
          mode="outlined"
          value={formData.address}
          onChangeText={(t) => handleTextChange("address", t)}
          style={styles.input}
        />

        <Text style={styles.uploadInstruction}>
          Upload an image or screenshot that can identify you as a student (e.g., lecture timetable, receipt, mail screenshot, or your picture)
        </Text>
        <View style={styles.uploadBox}>
          <TouchableOpacity
            onPress={() => pickImage("idImage")}
            style={styles.uploadTouchable}
          >
            <Text style={styles.uploadText}>Upload ID / Proof</Text>
          </TouchableOpacity>
          {formData.idImage && (
            <Image source={{ uri: formData.idImage }} style={styles.preview} />
          )}
        </View>

        <Text style={[styles.uploadInstruction, { marginTop: 6 }]}>
          Upload a picture you want to use as your seller profile image
        </Text>
        <View style={styles.uploadBox}>
          <TouchableOpacity
            onPress={() => pickImage("profileImage")}
            style={styles.uploadTouchable}
          >
            <Text style={styles.uploadText}>Upload Profile Picture</Text>
          </TouchableOpacity>
          {formData.profileImage && (
            <Image source={{ uri: formData.profileImage }} style={styles.preview} />
          )}
        </View>

        <View style={styles.checkboxRow}>
          <Checkbox
            status={formData.agree ? "checked" : "unchecked"}
            onPress={() => setFormData((p) => ({ ...p, agree: !p.agree }))}
          />
          <Text style={styles.checkboxText}>
            I acknowledge to provide the best, be truthful, and not do any malicious things.
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={uploading}
          disabled={uploading}
          style={styles.button}
        >
          {uploading ? "Submitting..." : "Get Verified"}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: "center", backgroundColor: "#108834ff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 14,
    color: "white",
  },
  circleWrap: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    elevation: 4,
    marginTop: 40,
  },
  circleImage: { width: 130, height: 130, borderRadius: 65 },
  instructions: {
    textAlign: "center",
    color: "#fff",
    marginBottom: 16,
    fontSize: 13,
  },
  input: { width: "100%", marginBottom: 10 },
  uploadInstruction: { width: "100%", fontSize: 13, color: "#fff", marginBottom: 6 },
  uploadBox: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  uploadTouchable: { paddingVertical: 8 },
  uploadText: { color: "#fff", fontWeight: "600" },
  preview: { width: 110, height: 110, borderRadius: 8, marginTop: 8 },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginVertical: 12, width: "100%" },
  checkboxText: { marginLeft: 8, flex: 1, fontSize: 13, color: "white" },
  button: {
    marginTop: 8,
    width: "100%",
    borderRadius: 8,
    paddingVertical: 6,
    backgroundColor: "purple",
  },
});