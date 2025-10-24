import { useNavigation } from "@react-navigation/native";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../firebaseConfig";

const { width } = Dimensions.get("window");
const TILE_SIZE = Math.round(width * 0.18);
const MAX_TILES = 8;

type AccessItem = {
  id: string;
  title: string; // From local TITLES array
  route: string; // From local ROUTES array
  imageUrl?: string;
};

export default function QuickAccess() {
  const [accessItems, setAccessItems] = useState<AccessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  // Re-introducing the hardcoded titles and routes
  const TITLES = [
    "80% Off Deals",
    "Earn While You Shop",
    "Top Rated Picks",
    "Flash Sales",
    "New Arrivals",
    "Hot Phones",
    "Groceries",
    "Fashion Deals",
  ];

  const ROUTES = [
    "CategoryScreen",
    "CategoryScreen",
    "CategoryScreen",
    "CategoryScreen",
    "ChatScreen",
    "SellerProfile",
    "ProductDetail",
    "CategoryScreen",
  ];

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "Access", "HrAQmlePFbxX4XMEqI9Q"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && Array.isArray(data.items)) {
            // Combine Firestore data with local TITLES and ROUTES
            const items: AccessItem[] = data.items.map((dbItem: any, index: number) => ({
              id: `${docSnap.id}-${index}`,
              imageUrl: dbItem || "",
              title: TITLES[index] || "New Item", // Fallback title
              route: ROUTES[index] || "CategoryScreen", // Fallback route
            }));
            setAccessItems(items.slice(0, MAX_TILES));
          } else {
            console.warn("Document 'HrAQmlePFbxX4XMEqI9Q' does not contain an 'items' array.");
            setAccessItems([]);
          }
        } else {
          console.warn("Document 'HrAQmlePFbxX4XMEqI9Q' does not exist in 'Access' collection.");
        }
        setLoading(false);
      },
      (err) => {
        console.warn("QuickAccess onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handlePress = (index: number) => {
    // Use the index to find the correct route from the local array
    const routeName = ROUTES[index] || ROUTES[0];
    try {
      navigation.navigate(routeName);
    } catch (err) {
      console.warn("Navigation failed:", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (!accessItems.length) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={accessItems}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          return (
            <TouchableOpacity
              style={styles.itemContainer}
              activeOpacity={0.85}
              onPress={() => handlePress(index)}
            >
              <View style={styles.imageBox}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.placeholder} />
                )}
              </View>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    backgroundColor: "#fff",
    paddingVertical: 8,
  },
  listContent: {
    paddingHorizontal: 12,
    alignItems: "center",
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContainer: {
    width: TILE_SIZE + 12,
    alignItems: "center",
    marginRight: 12,
  },
  imageBox: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f4f4f4",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "60%",
    height: "60%",
    backgroundColor: "#ddd",
  },
  title: {
    marginTop: 6,
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    width: TILE_SIZE,
    fontWeight: "600",
  },
});