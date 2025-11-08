import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import { addDoc, collection, getFirestore, serverTimestamp } from "firebase/firestore";
import React, { useRef, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Button, Menu, Switch, TextInput } from "react-native-paper";

import { supabase } from "../../../utils/supabaseClient";

export default function ServiceListScreen() {
  const navigation: any = useNavigation();
  const auth = getAuth();
  const db = getFirestore();

  const [serviceTitle, setServiceTitle] = useState("");
  const [priceType, setPriceType] = useState("Fixed");
  const [price, setPrice] = useState("");
  const [serviceType, setServiceType] = useState("Home Service");
  const [description, setDescription] = useState("");
  const [availability, setAvailability] = useState("24/7");
  const [location, setLocation] = useState("");
  const [negotiable, setNegotiable] = useState(false);

  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");

  const [image, setImage] = useState<string | null>(null);

  const [priceMenuVisible, setPriceMenuVisible] = useState(false);
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [availMenuVisible, setAvailMenuVisible] = useState(false);

  // ✅ CATEGORY STATE
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [category, setCategory] = useState("Services");

  const [uploading, setUploading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const scrollRef = useRef<ScrollView | null>(null)

  const PRICE_TYPES = ["Fixed", "Negotiable"];
  const SERVICE_TYPES = ["Home Service", "Mobile"];
  const AVAIL_OPTIONS = ["24/7", "Always", "9 AM - 5 PM", "By Appointment"];

  // ✅ FIXED SERVICE CATEGORIES
  const SERVICE_CATEGORIES = [
    
    "Services",
    
  ];

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!res.canceled) {
        const uri = res.assets?.[0]?.uri;
        if (!uri) return;
        setImage(uri);
      }
    } catch (err) {
      Alert.alert("Image Error", "Could not pick image.");
    }
  };

  const removeImage = () => setImage(null);

  const uploadImageToSupabase = async (uri: string, userUid: string) => {
    try {
      const path = `services/${userUid}/${Date.now()}_service.jpg`;
      const formData = new FormData();
      const fileExt = uri.split(".").pop() ?? "jpg";
      const fileType = `image/${fileExt === "jpg" ? "jpeg" : fileExt}`;
      formData.append("file", {
        uri,
        name: path.split("/").pop(),
        type: fileType,
      } as any);
      const { data, error } = await supabase.storage
        .from("service-images")
        .upload(path, formData, { upsert: false, cacheControl: "3600" });
      if (error) return null;
      const { data: publicData } = supabase.storage
        .from("service-images")
        .getPublicUrl(path);
      return publicData?.publicUrl ?? null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!serviceTitle.trim() || !description.trim()) {
      Alert.alert("Validation Error", "Please fill Service Title and Description.");
      return;
    }
    if (priceType === "Fixed" && !price.trim()) {
      Alert.alert("Validation Error", "Please enter a price.");
      return;
    }
    if (!image) {
      Alert.alert("Image Required", "Please select a service image.");
      return;
    }
    if (!bankName.trim() || !accountNumber.trim()) {
      Alert.alert("Bank Details Missing", "Please enter your Bank Name and Account Number.");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    setUploading(true);
    Keyboard.dismiss();

    try {
      const uid = user.uid;
      const imageUrl = await uploadImageToSupabase(image, uid);
      if (!imageUrl) return;

      await addDoc(collection(db, "services"), {
        sellerId: uid,
        serviceTitle: serviceTitle.trim(),
        priceType,
        price: priceType === "Fixed" ? Number(price) : null,
        serviceType,
        description: description.trim(),
        availability,
        location: location.trim(),
        negotiable,
        image: imageUrl,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        category, // ✅ SAVE CATEGORY
        timestamp: serverTimestamp(),
      });

      setSuccessVisible(true);
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setServiceTitle("")
    setPriceType("Fixed")
    setPrice("")
    setServiceType("Home Service")
    setDescription("")
    setAvailability("24/7")
    setLocation("")
    setNegotiable(false)
    setAccountNumber("")
    setBankName("")
    setImage(null)
    setPriceMenuVisible(false)
    setTypeMenuVisible(false)
    setAvailMenuVisible(false)
    setCategoryMenuVisible(false)
    setCategory("Services")
    if (scrollRef.current && (scrollRef.current as any).scrollTo) {
      try { (scrollRef.current as any).scrollTo({ y: 0, animated: true }) } catch (e) { }
    }
  }

  const onSuccessTap = () => {
    setSuccessVisible(false);
    resetForm()
    navigation.navigate("HustleDashboard", { initialTab: "service" });
  };

  return (
    <View style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
  <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
          <Text style={styles.title}>Add a Service</Text>

          <TextInput
            label="Service title *"
            mode="outlined"
            value={serviceTitle}
            onChangeText={setServiceTitle}
            style={styles.input}
          />

          {/* ✅ CATEGORY DROPDOWN */}
          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <TouchableOpacity
                onPress={() => setCategoryMenuVisible(true)}
                style={styles.menuAnchor}
              >
                <Text style={styles.menuAnchorText}>Category: {category}</Text>
              </TouchableOpacity>
            }
          >
            {SERVICE_CATEGORIES.map((c) => (
              <Menu.Item
                key={c}
                onPress={() => {
                  setCategory(c);
                  setCategoryMenuVisible(false);
                }}
                title={c}
              />
            ))}
          </Menu>

          <TextInput
            label="Bank Name *"
            mode="outlined"
            value={bankName}
            onChangeText={setBankName}
            style={styles.input}
          />

          <TextInput
            label="Account Number *"
            mode="outlined"
            keyboardType="numeric"
            value={accountNumber}
            onChangeText={(t) => setAccountNumber(t.replace(/[^0-9]/g, ""))}
            style={styles.input}
          />

          {/* Price Type dropdown */}
          <View style={styles.row}>
            <Menu
              visible={priceMenuVisible}
              onDismiss={() => setPriceMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  onPress={() => setPriceMenuVisible(true)}
                  style={styles.menuAnchor}
                >
                  <Text style={styles.menuAnchorText}>Price type: {priceType}</Text>
                </TouchableOpacity>
              }
            >
              {PRICE_TYPES.map((p) => (
                <Menu.Item
                  key={p}
                  onPress={() => {
                    setPriceType(p);
                    setPriceMenuVisible(false);
                    if (p === "Negotiable") setPrice("");
                  }}
                  title={p}
                />
              ))}
            </Menu>

            <Menu
              visible={typeMenuVisible}
              onDismiss={() => setTypeMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  onPress={() => setTypeMenuVisible(true)}
                  style={styles.menuAnchor}
                >
                  <Text style={styles.menuAnchorText}>Type: {serviceType}</Text>
                </TouchableOpacity>
              }
            >
              {SERVICE_TYPES.map((t) => (
                <Menu.Item
                  key={t}
                  onPress={() => {
                    setServiceType(t);
                    setTypeMenuVisible(false);
                  }}
                  title={t}
                />
              ))}
            </Menu>
          </View>

          {priceType === "Fixed" && (
            <TextInput
              label="Price (₦) *"
              mode="outlined"
              keyboardType="numeric"
              value={price}
              onChangeText={(t) => setPrice(t.replace(/[^0-9.]/g, ""))}
              style={styles.input}
            />
          )}

          <TextInput
            label="Service description *"
            mode="outlined"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[styles.input, { height: 110 }]}
          />

          <View style={styles.row}>
            <Menu
              visible={availMenuVisible}
              onDismiss={() => setAvailMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  onPress={() => setAvailMenuVisible(true)}
                  style={styles.menuAnchor}
                >
                  <Text style={styles.menuAnchorText}>Availability: {availability}</Text>
                </TouchableOpacity>
              }
            >
              {AVAIL_OPTIONS.map((a) => (
                <Menu.Item
                  key={a}
                  onPress={() => {
                    setAvailability(a);
                    setAvailMenuVisible(false);
                  }}
                  title={a}
                />
              ))}
            </Menu>

            <TextInput
              label="Campus Location"
              mode="outlined"
              value={location}
              onChangeText={setLocation}
              style={[styles.menuAnchor, { flex: 1, backgroundColor: "#fff" }]}
            />
          </View>

          <Text style={styles.subLabel}>Service image *</Text>
          <View style={{ marginBottom: 12 }}>
            {image ? (
              <>
                <Image source={{ uri: image }} style={styles.preview} />
                <View style={styles.imageButtons}>
                  <Button compact onPress={pickImage}>Change</Button>
                  <Button compact onPress={removeImage}>Remove</Button>
                </View>
              </>
            ) : (
              <Button mode="outlined" onPress={pickImage} style={{ width: "100%" }}>
                Select Image
              </Button>
            )}
          </View>

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
              {uploading ? "Uploading..." : "Upload Service"}
            </Button>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </TouchableWithoutFeedback>

      <Modal visible={successVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={onSuccessTap}>
          <View style={styles.modalOverlay}>
            <View style={styles.successBox}>
              <Text style={styles.successText}>Service Added Successfully ✅</Text>
              <Text style={styles.successSub}>Tap anywhere to continue</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
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
  preview: { width: "100%", height: 200, borderRadius: 8 },
  imageButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
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