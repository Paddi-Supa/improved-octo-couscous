import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, View } from "react-native";
import { db } from "../../firebaseConfig";

const { width } = Dimensions.get("window");

export default function Slider() {
  const [banners, setBanners] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const docRef = doc(db, "banners", "saHsMIx4Kk0huijpMDE0");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          console.log("Document found! Data:", docSnap.data());
          const data = docSnap.data();
          // This handles if 'images' is a single URL (string) or multiple (array)
          // We now expect 'images' to always be an array from Firestore.
          if (data && Array.isArray(data.images)) {
            setBanners(data.images);
          } else {
            console.warn("Document found, but it does not contain an 'images' field. Check your Firestore data.", data);
          }
        } else {
          console.log("No such document! Check collection 'banners' and document ID 'saHsMIx4Kk0huijpMDE0'.");
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 0) {
      if (intervalRef.current) clearInterval(intervalRef.current); // Prevent double intervals

      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, 8000); // Adjusted speed to 8s — smooth like Jumia

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [banners]);

  useEffect(() => {
    if (banners.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: currentIndex,
        animated: true,
      });
    }
  }, [currentIndex, banners]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="rgba(104, 6, 99, 1) 2, 171, 1)" />
      </View>
    );
  }

  if (banners.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: "#777" }}>No banner available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Top Deals</Text>
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.bannerWrapper}>
            <Image source={{ uri: item }} style={styles.bannerImage} resizeMode="cover" />
          </View>
        )}
      />
      <View style={styles.pagination}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: (width * 9) / 20 + 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    marginTop: 6,
    paddingVertical: 8,
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginLeft: 16,
    marginBottom: 6,
    fontFamily: "Poppins-Bold",
  },
  bannerWrapper: {
    width: width * 0.93, // Shrink image width slightly
    marginHorizontal: width * 0.015, // Add spacing between slides
  },
  bannerImage: {
    width: "100%",
    height: (width * 9) / 23, // Slightly smaller height
    borderRadius: 8, // Softer edges like Jumia
  },
  loaderContainer: {
    height: (width * 9) / 25,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    height: (width * 9) / 25,
    alignItems: "center",
    justifyContent: "center",
  },
  pagination: {
    position: "absolute",
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: "#d600c4ff",
    opacity: 0.95,
  },
  dotInactive: {
    backgroundColor: "#bbb",
    opacity: 0.4,
  },
});