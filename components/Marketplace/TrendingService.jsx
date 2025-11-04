import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { collection, getDocs, getFirestore, limit, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrendingServices() {
  const [services, setServices] = useState([]);
  const navigation = useNavigation();
  const db = getFirestore();

  useEffect(() => {
    let mounted = true;
    const fetchServices = async () => {
      try {
        const q = query(collection(db, "services"), orderBy("timestamp", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        const list = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        if (mounted) setServices(list);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    fetchServices();
    return () => {
      mounted = false;
    };
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("ProductDetail", { productId: item.id, type: 'service' })}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.textBox}>
        <Text style={styles.name} numberOfLines={1}>
          {item.serviceTitle}
        </Text>
        <Text style={styles.price}>
          {item.priceType === "Fixed" ? `₦${item.price}` : "Negotiable"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Trending Services</Text>
        <TouchableOpacity
          style={styles.viewMore}
          onPress={() => navigation.navigate("CategoryScreen")}
          activeOpacity={0.7}
        >
          <Text style={styles.viewMoreText}>View more</Text>
          <Ionicons name="arrow-forward" size={16} color="#6c63ff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={services}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: "#f6f7fb" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: -65,
  },
  header: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  viewMore: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewMoreText: {
    color: "#6c63ff",
    fontSize: 13,
    marginRight: 6,
    fontWeight: "600",
  },
  listContent: { paddingHorizontal: 10, paddingBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginRight: 12,
    width: 150,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 120,
  },
  textBox: {
    padding: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  price: {
    fontSize: 13,
    color: "#6c63ff",
    marginTop: 4,
    fontWeight: "700",
  },
});