import { useNavigation, useRoute } from "@react-navigation/native";
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function SellerProfileScreen() {
  const route: any = useRoute();
  const navigation: any = useNavigation();
  const { sellerId } = (route.params as any) || {};
  const db = getFirestore();

  const [seller, setSeller] = useState<any | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    fetchSeller();
    fetchListings();
  }, [sellerId]);

  const fetchSeller = async () => {
    try {
      const ref = doc(db, "sellerVerifications", sellerId);
      const snap = await getDoc(ref);
      if (snap.exists()) setSeller(snap.data());
      else setSeller(null);
    } catch (e) {
      console.log("Error fetching seller:", e);
      setSeller(null);
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const productsQ = query(collection(db, "products"), where("sellerId", "==", sellerId));
      const servicesQ = query(collection(db, "services"), where("sellerId", "==", sellerId));

      const [prodSnap, servSnap] = await Promise.all([getDocs(productsQ), getDocs(servicesQ)]);

      const prods = prodSnap.docs.map((d) => ({ id: d.id, type: "product", ...(d.data() as any) }));
      const servs = servSnap.docs.map((d) => ({ id: d.id, type: "service", ...(d.data() as any) }));

      // Combine and sort by timestamp if available (newest first)
      const combined = [...prods, ...servs].sort((a, b) => {
        const ta = a.timestamp ? a.timestamp.toMillis?.() ?? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? b.timestamp.toMillis?.() ?? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
      });

      setListings(combined);
    } catch (e) {
      console.log("Error fetching listings:", e);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const name = item.productName || item.serviceTitle || item.title || "Untitled";
    const price = item.priceType === "Fixed" || item.priceType === "fixed" ? `₦${item.price}` : item.priceType || "Negotiable";
    const description = item.description || item.serviceDescription || "";
    const imgUri = (item.images && item.images[0]) || item.image || null;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("ProductDetail", { id: item.id, type: item.type })}
      >
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={styles.listingImage} />
        ) : (
          <View style={[styles.listingImage, { backgroundColor: '#f2f2f2' }]} />
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{name}</Text>
          <Text style={styles.cardPrice}>{price}</Text>
          {description ? <Text style={styles.cardDesc} numberOfLines={2}>{description}</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (!sellerId) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#777" }}>No seller selected.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!seller ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6c63ff" />
        </View>
      ) : (
        <View style={styles.header}>
          <Text style={styles.topBusinessName}>{seller.businessName || "Seller"}</Text>
          <Image
            source={seller.profileImage ? { uri: seller.profileImage } : seller.image ? { uri: seller.image } : require("../../../assets/images/verifi.png")}
            style={styles.profilePic}
          />
          <View style={{ alignItems: "center", marginTop: 8 }}>
            <Text style={styles.businessName}>{seller.businessName || "Seller"}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
              {seller.verified && <Text style={styles.verified}>✔︎ Verified</Text>}
            </View>
          </View>
        </View>
      )}

      <View style={styles.listingHeaderRow}>
        <Text style={styles.listingHeader}>Listings</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color="#6c63ff" />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={<Text style={{ textAlign: "center", color: "#777", marginTop: 12 }}>No listings yet</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  topBusinessName: { fontSize: 16, fontWeight: "700", color: "#222", marginBottom: 15, marginTop: 30 },
  profilePic: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#eee" },
  businessName: { fontSize: 18, fontWeight: "800", marginTop: 10 },
  verified: { color: "#27ae60", fontWeight: "700", marginLeft: 8 },
  listingHeaderRow: { paddingHorizontal: 12, paddingTop: 12 },
  listingHeader: { fontSize: 16, fontWeight: "700" },
  card: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#f2f2f2" },
  cardBody: { marginLeft: 0 },
  cardContent: { flex: 1, paddingLeft: 12, justifyContent: 'center' },
  listingImage: { width: 96, height: 96, borderRadius: 8, backgroundColor: '#eee' },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  cardPrice: { marginTop: 6, color: "#6c63ff", fontWeight: "700" },
  cardDesc: { marginTop: 6, color: "#444" },
});