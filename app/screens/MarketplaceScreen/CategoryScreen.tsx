// CategoryScreen.jsx
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  TextInput as RNTextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_WIDTH = Math.round((width - 48 - CARD_GAP) / 2); // two cards per row with paddings and gap

export default function CategoryScreen() {
  const navigation: any = useNavigation();
  const db = getFirestore();

  const categories = [
    { key: "all", label: "All", type: "mixed" },
    { key: "books", label: "Books & academics", type: "product" },
    { key: "food", label: "Provisions & foods", type: "product" },
    { key: "services", label: "Services", type: "service" },
    { key: "phones", label: "Phones & Gadgets", type: "product" },
    { key: "beauty", label: "Beauty Must Have", type: "product" },
    { key: "fashion", label: "Fashion & lifestyle", type: "product" },
    { key: "hostel", label: "Hostel essentials", type: "product" },
    { key: "gigs", label: "Gigs & Side Hustle", type: "service" },
    { key: "rides", label: "Rides", type: "service" },
    { key: "black_friday", label: "Black Friday", type: "product" },
    { key: "promo", label: "Promo & Ads", type: "product" },
  ];

  const [selected, setSelected] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [items, setItems] = useState<any[]>([]); // merged items (products/services)
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchForAll = async () => {
      // fetch latest 12 products + latest 12 services and merge (product + service)
      const prodQ = query(collection(db, "products"), orderBy("timestamp", "desc"), limit(12));
      const servQ = query(collection(db, "services"), orderBy("timestamp", "desc"), limit(12));
      const [prodSnap, servSnap] = await Promise.all([getDocs(prodQ), getDocs(servQ)]);
      const prodList = prodSnap.docs.map((d) => ({ id: d.id, __type: "product", ...d.data() }));
      const servList = servSnap.docs.map((d) => ({ id: d.id, __type: "service", ...d.data() }));
      // merge but keep newest first by timestamp (if available). If timestamp missing, keep order
      const merged = [...prodList, ...servList].sort((a: any, b: any) => {
        const ta = a.timestamp?.seconds ?? 0;
        const tb = b.timestamp?.seconds ?? 0;
        return tb - ta;
      });
      return merged;
    };

      const fetchCategory = async (catKey: string) => {
      // find category metadata
      const cat = categories.find((c) => c.key === catKey);
      if (!cat) return [];

      if (cat.type === "product") {
        // products filtered by category label (assumes product.category matches label)
        const q = query(
          collection(db, "products"),
          where("category", "==", cat.label),
          orderBy("timestamp", "desc"),
          limit(24)
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, __type: "product", ...d.data() }));
      } else {
        // services filtered by category field (we store category in service docs)
        const q = query(
          collection(db, "services"),
          where("category", "==", cat.label),
          orderBy("timestamp", "desc"),
          limit(24)
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, __type: "service", ...d.data() }));
      }
    };

    const fetchItems = async () => {
      setLoading(true);
      try {
        let list = [];
        if (selected === "all") {
          list = await fetchForAll();
        } else if (selected === "black_friday") {
          // static fallback behavior: try to fetch flagged BF products; if none, show latest products
          const bfQ = query(collection(db, "products"), where("isBlackFriday", "==", true), orderBy("timestamp", "desc"), limit(24));
          const snap = await getDocs(bfQ);
          if (snap.empty) {
            const fallback = query(collection(db, "products"), orderBy("timestamp", "desc"), limit(24));
            const fb = await getDocs(fallback);
            list = fb.docs.map((d) => ({ id: d.id, __type: "product", ...d.data() }));
          } else {
            list = snap.docs.map((d) => ({ id: d.id, __type: "product", ...d.data() }));
          }
        } else if (selected === "promo") {
          const pQ = query(collection(db, "products"), where("isPromo", "==", true), orderBy("timestamp", "desc"), limit(24));
          const snap = await getDocs(pQ);
          list = snap.docs.map((d) => ({ id: d.id, __type: "product", ...d.data() }));
        } else {
          list = await fetchCategory(selected);
        }
        if (mounted) setItems(list);
      } catch (err) {
        console.error("Category fetch error:", err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchItems();
    return () => {
      mounted = false;
    };
  }, [selected, db]);

  const filtered = items.filter((it: any) => {
    if (!searchText) return true;
    const name = (it.productName || it.serviceTitle || it.title || "").toLowerCase();
    return name.includes(searchText.toLowerCase());
  });

  const onPressCard = (item: any) => {
    if (item.__type === "product") {
      navigation.navigate("ProductDetail", { productId: item.id });
    }
  };

  const renderCategoryBlock = ({ item }: { item: any }) => {
    const active = item.key === selected;
    return (
      <TouchableOpacity
        style={[styles.catBlock, active && styles.catBlockActive]}
        onPress={() => {
          setSelected(item.key);
          setSearchText("");
        }}
        activeOpacity={0.8}
      >
        <Text style={[styles.catText, active && styles.catTextActive]} numberOfLines={2}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItemCard = ({ item }: { item: any }) => {
    const title = item.productName || item.serviceTitle || item.title || "Untitled";
    const img = (item.images && item.images[0]) || item.image || null;
    const priceDisplay =
      item.__type === "product"
        ? `₦${Number(item.price || 0).toLocaleString()}`
        : item.priceType === "Fixed"
        ? `₦${Number(item.price || 0).toLocaleString()}`
        : "Negotiable";
    const actionText = item.__type === "product" ? "Buy Now" : "Order";

    return (
      <TouchableOpacity style={styles.card} onPress={() => onPressCard(item)} activeOpacity={0.9}>
        <Image
          source={img ? { uri: img } : require("../../../assets/images/verifi.png")}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.cardPrice}>{priceDisplay}</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onPressCard(item)}
            activeOpacity={0.85}
          >
            <Text style={styles.actionText}>{actionText}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.searchToggle}
            onPress={() => setSearchOpen((s) => !s)}
            activeOpacity={0.8}
          >
            <Text style={styles.searchToggleText}>{searchOpen ? "Close" : "Search"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {searchOpen && (
        <View style={styles.searchRow}>
          <RNTextInput
            placeholder="Search in results..."
            value={searchText}
            onChangeText={setSearchText}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
      )}

      <FlatList
        data={categories}
        renderItem={renderCategoryBlock}
        keyExtractor={(c) => c.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catList}
        style={{ maxHeight: 86 }}
      />

      {(selected === "black_friday" || selected === "promo") && (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>
            {selected === "black_friday" ? "Black Friday Specials" : "Promo & Ads"}
          </Text>
          <Text style={styles.bannerSubtitle}>Coming soon</Text>
        </View>
      )}

      <View style={styles.itemsHeaderRow}>
        <Text style={styles.itemsHeader}>
          {categories.find((c) => c.key === selected)?.label || "Items"}
        </Text>
        <Text style={styles.itemsCount}>{filtered.length} items</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="small" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No items available</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItemCard}
          keyExtractor={(it) => it.id}
          numColumns={2}
          columnWrapperStyle={styles.itemRow}
          contentContainerStyle={styles.itemsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#222" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  searchToggle: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f3f3ff",
    borderRadius: 8,
  },
  searchToggleText: { color: "#6c63ff", fontWeight: "600" },

  searchRow: { paddingHorizontal: 16, paddingBottom: 10 },
  searchInput: {
    backgroundColor: "#f2f2f6",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  catList: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    alignItems: "center",
  },
  catBlock: {
    marginRight: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  catBlockActive: {
    backgroundColor: "#6c63ff",
    borderColor: "#6c63ff",
  },
  catText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  catTextActive: { color: "#fff" },

  banner: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 12,
    backgroundColor: "#fff6f9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ffe6f4",
  },
  bannerTitle: { fontSize: 16, fontWeight: "800", color: "#e5396a" },
  bannerSubtitle: { marginTop: 4, color: "#666" },

  itemsHeaderRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemsHeader: { fontSize: 16, fontWeight: "700", color: "#222" },
  itemsCount: { color: "#666", fontSize: 13 },

  loader: { padding: 20, alignItems: "center" },
  empty: { padding: 30, alignItems: "center" },
  emptyText: { color: "#777" },

  itemsList: {
    paddingHorizontal: 12,
    paddingBottom: 80,
  },
  itemRow: { justifyContent: "space-between", marginBottom: 12 },

  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: 100, // smaller image height so two columns feel dense
    backgroundColor: "#eee",
  },
  cardBody: { padding: 8 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#333" },
  cardPrice: { marginTop: 6, color: "#6c63ff", fontWeight: "800" },
  actionButton: {
    marginTop: 8,
    backgroundColor: "#6c63ff",
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  actionText: { color: "#fff", fontWeight: "700" },
});