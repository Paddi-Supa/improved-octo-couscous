import { useNavigation } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../firebaseConfig";

const { width } = Dimensions.get("window");

export default function MainCategorySection() {
  const navigation = useNavigation<any>();
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const shimmer = useRef(new Animated.Value(0)).current;

  const names = [
    "Books & Academics",
    "Provisions & Foods",
    "Phones & Gadgets",
    "Beauty Must Have",
    "Fashion & Lifestyle",
    "Hostel Essentials",
    "Gigs & Side Hustle",
    "Services",
    "Rides",
  ];

  const routes = [
    "CategoryScreen",
    "CategoryScreen",
    "ChatScreen",
    "SellerProfile",
    "ProductDetail",
    "CategoryScreen",
    "CategoryScreen",
    "CategoryScreen",
    "CategoryScreen",
  ];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  useEffect(() => {
    async function fetchImages() {
      try {
        const d = doc(db, "main", "UwLiXBeRTb7oLLWS9FSS");
        const snap = await getDoc(d);
        if (snap.exists()) {
          const data = snap.data();
          if (data?.mains && Array.isArray(data.mains)) {
            setImages(data.mains.slice(0, 8));
          } else {
            setImages([]);
          }
        } else {
          setImages([]);
        }
      } catch (e) {
        console.warn("MainCategory fetch error:", e);
        setImages([]);
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, []);

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });

  const cardWidth = width * 0.55;
  const cardHeight = width * 0.3;

  return (
    <View style={styles.wrap}>
      <Text style={styles.header}>Categories</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.card,
                  { width: cardWidth, height: cardHeight },
                  { opacity: shimmerOpacity, backgroundColor: "#e6e6e6" },
                ]}
              />
            ))
          : images.map((uri, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.85}
                style={[styles.card, { width: cardWidth, height: cardHeight }]}
                onPress={() => {
                  const route = routes[i] || routes[0];
                  try {
                    navigation.navigate(route);
                  } catch (err) {
                    console.warn("Navigate error:", err);
                  }
                }}
              >
                <Image source={{ uri }} style={styles.image} resizeMode="cover" />
                <View style={styles.overlay} />
                <Text style={styles.label}>{names[i] || ""}</Text>
              </TouchableOpacity>
            ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 10,
  },
  scroll: {
    alignItems: "center",
    paddingRight: 12,
  },
  card: {
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: "#f0f0f0",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  label: {
    position: "absolute",
    left: 12,
    bottom: 12,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    maxWidth: "75%",
  },
});