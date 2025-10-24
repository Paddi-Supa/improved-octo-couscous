import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import { addDoc, collection, getFirestore, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Button, Menu, Switch, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "../../../utils/supabaseClient";

export default function ProductListScreen() {
  const navigation = useNavigation();
  const auth = getAuth();
  const db = getFirestore();

  // Form state
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("New");
  const [category, setCategory] = useState("Books & academics");
  const [description, setDescription] = useState("");
  const [campusPickup, setCampusPickup] = useState("");
  const [negotiable, setNegotiable] = useState(false);

  // NEW: Account details
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");

  // images (max 2)
  const [images, setImages] = useState<Array<string | null>>([null, null]);

  // menu states for dropdowns
  const [condMenuVisible, setCondMenuVisible] = useState(false);
  const [catMenuVisible, setCatMenuVisible] = useState(false);

  // uploading / modal
  const [uploading, setUploading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  // categories + conditions (as requested)
  const CONDITIONS = ["New", "Used", "Fairly Used"];
  const CATEGORIES = [
    "Books & academics",
    "Provisions & foods",
    "Phones & Gadgets",
    "Beauty Must have",
    "Fashion and lifestyle",
    "Hostel essential",
  ];

  // pick image helper (fieldIndex: 0 or 1)
  const pickImage = async (index: number) => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!res.canceled) {
        const uri = res.assets?.[0]?.uri;
        if (!uri) return; // Exit if URI is not found

        setImages((prev) => {
          const copy = [...prev]; // create a copy of the state array
          copy[index] = uri;
          return copy;
        });
      }
    } catch (err) {
      console.warn("Image pick error:", err);
      Alert.alert("Image Error", "Could not pick image.");
    }
  };

  // remove image
  const removeImage = (index: number) => {
    setImages((prev) => {
      const copy = [...prev];
      copy[index] = null;
      return copy;
    });
  };

  // upload a single image to Supabase under folder products/{uid}/filename
  const uploadImageToSupabase = async (
    uri: string,
    fileName: string,
    userUid: string
  ) => {
    try {
      const path = `products/${userUid}/${fileName}`;

      // Use FormData for robust uploads in React Native
      const formData = new FormData();
      const fileExtension = uri.split(".").pop();
      const fileType = `image/${fileExtension}`;

      formData.append("file", {
        uri,
        name: fileName,
        type: fileType,
      } as any);

      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(path, formData, { upsert: false, cacheControl: "3600" });

      if (error) {
        console.error("Supabase upload error:", error);
        return null;
      }

      // Get public url
      const { data: publicData } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);
      return publicData?.publicUrl ?? null;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  // main submit handler
  const handleSubmit = async () => {
    // validation (now includes accountNumber & bankName)
    if (
      !productName.trim() ||
      !price.trim() ||
      !description.trim() ||
      !accountNumber.trim() ||
      !bankName.trim()
    ) {
      Alert.alert(
        "Validation Error",
        "Please fill all required fields (Product name, price, description and account details)."
      );
      return;
    }
    if (!images[0] || !images[1]) {
      Alert.alert(
        "Images Required",
        "Please select two images for this product."
      );
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not signed in", "You must be signed in to upload a product.");
      return;
    }

    setUploading(true);
    Keyboard.dismiss();

    try {
      // upload images sequentially (could be parallel)
      const uid = user.uid;
      const ts = Date.now();
      const fileName1 = `product_${ts}_1.jpg`;
      const fileName2 = `product_${ts}_2.jpg`;

      const url1 = await uploadImageToSupabase(
        images[0] as string,
        fileName1,
        uid
      );
      const url2 = await uploadImageToSupabase(
        images[1] as string,
        fileName2,
        uid
      );

      if (!url1 || !url2) {
        Alert.alert(
          "Upload Failed",
          "Failed to upload one or more images. Try again."
        );
        setUploading(false);
        return;
      }

      // Save to Firestore (includes accountNumber & bankName)
      const productDoc = {
        sellerId: uid,
        productName: productName.trim(),
        price: Number(price),
        condition,
        category,
        description: description.trim(),
        images: [url1, url2],
        campusPickup: campusPickup.trim() || null,
        negotiable,
        accountNumber: accountNumber.trim(),
        bankName: bankName.trim(),
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "products"), productDoc);
      console.log("Product uploaded successfully!");

      // show success overlay modal
      setSuccessVisible(true);

      // keep it visible until user taps (user will tap -> navigate)
    } catch (err) {
      console.error("Submit error:", err);
      Alert.alert("Error", "Something went wrong. Try again.");
    } finally {
      setUploading(false);
    }
  };

  // after success tap: close modal and navigate back to marketplace
  const onSuccessTap = () => {
    setSuccessVisible(false);
    // Navigate to the parent dashboard and ensure the 'product' tab is active.
    // This assumes the parent component can receive params to set the active tab.
    // @ts-ignore
    navigation.navigate("HustleDashboard", {
      initialTab: "product",
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Add a product</Text>

          {/* NEW: Account Number */}
          <TextInput
            label="Account Number *"
            mode="outlined"
            keyboardType="numeric"
            value={accountNumber}
            onChangeText={(t) => setAccountNumber(t.replace(/[^0-9]/g, ""))}
            style={styles.input}
          />

          {/* NEW: Bank Name */}
          <TextInput
            label="Bank Name *"
            mode="outlined"
            value={bankName}
            onChangeText={setBankName}
            style={styles.input}
          />

          <TextInput
            label="Product name *"
            mode="outlined"
            value={productName}
            onChangeText={setProductName}
            style={styles.input}
          />

          <TextInput
            label="Price *"
            mode="outlined"
            keyboardType="numeric"
            value={price}
            onChangeText={(t) => setPrice(t.replace(/[^0-9.]/g, ""))}
            style={styles.input}
          />

          {/* Condition dropdown */}
          <View style={styles.row}>
            <Menu
              visible={condMenuVisible}
              onDismiss={() => setCondMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  onPress={() => setCondMenuVisible(true)}
                  style={styles.menuAnchor}
                >
                  <Text style={styles.menuAnchorText}>Condition: {condition}</Text>
                </TouchableOpacity>
              }
            >
              {CONDITIONS.map((c) => (
                <Menu.Item
                  key={c}
                  onPress={() => {
                    setCondition(c);
                    setCondMenuVisible(false);
                  }}
                  title={c}
                />
              ))}
            </Menu>

            {/* Category dropdown */}
            <Menu
              visible={catMenuVisible}
              onDismiss={() => setCatMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  onPress={() => setCatMenuVisible(true)}
                  style={styles.menuAnchor}
                >
                  <Text style={styles.menuAnchorText}>Category: {category}</Text>
                </TouchableOpacity>
              }
            >
              {CATEGORIES.map((c) => (
                <Menu.Item
                  key={c}
                  onPress={() => {
                    setCategory(c);
                    setCatMenuVisible(false);
                  }}
                  title={c}
                />
              ))}
            </Menu>
          </View>

          <TextInput
            label="Product description *"
            mode="outlined"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[styles.input, { height: 110 }]}
          />

          {/* Images (2) */}
          <Text style={styles.subLabel}>Product images (2) *</Text>
          <View style={styles.imageRow}>
            {[0, 1].map((i) => (
              <View key={i} style={styles.imageBox}>
                {images[i] ? (
                  <>
                    <Image
                      source={{ uri: images[i] as string }}
                      style={styles.preview}
                    />
                    <View style={styles.imageButtons}>
                      <Button compact onPress={() => pickImage(i)}>
                        Change
                      </Button>
                      <Button compact onPress={() => removeImage(i)}>
                        Remove
                      </Button>
                    </View>
                  </>
                ) : (
                  <Button
                    mode="outlined"
                    onPress={() => pickImage(i)}
                    style={{ width: "100%" }}
                  >
                    Select Image {i + 1}
                  </Button>
                )}
              </View>
            ))}
          </View>

          <TextInput
            label="Campus pickup (optional)"
            mode="outlined"
            value={campusPickup}
            onChangeText={setCampusPickup}
            style={styles.input}
          />

          <View style={styles.rowSpace}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text>Negotiable</Text>
              <Switch
                value={negotiable}
                onValueChange={() => setNegotiable((v) => !v)}
              />
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={uploading}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Product"}
            </Button>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Success overlay modal */}
      <Modal visible={successVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={onSuccessTap}>
          <View style={styles.modalOverlay}>
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                Product Added Successfully ✅
              </Text>
              <Text style={styles.successSub}>Tap anywhere to continue</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: {
    padding: 18,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  input: { marginBottom: 12, backgroundColor: "#fff" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  menuAnchor: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f3f3f3",
    borderRadius: 8,
    minWidth: 160,
  },
  menuAnchorText: { color: "#333" },
  subLabel: { marginBottom: 8, fontWeight: "600" },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  imageBox: { flex: 1, marginHorizontal: 6, alignItems: "center" },
  preview: { width: "100%", height: 120, borderRadius: 8 },
  imageButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 6,
  },
  rowSpace: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(12,12,12,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successBox: {
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 28,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    maxWidth: 420,
  },
  successText: { fontSize: 18, fontWeight: "800", marginBottom: 6 },
  successSub: { color: "#666" },
});