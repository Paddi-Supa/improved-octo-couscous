import { useNavigation } from "@react-navigation/native";
import { collection, getDocs, getFirestore, limit, orderBy, query } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewArrivals() {
  const [items, setItems] = useState<any[]>([]);
  const db = getFirestore();
  const navigation: any = useNavigation();

  useEffect(() => {
    let mounted = true;
    const fetchBoth = async () => {
      try {
        // fetch recent products and services (most recent first)
  // fetch recent products and services (limit 30 each for performance)
  const qProd = query(collection(db, "products"), orderBy("timestamp", "desc"), limit(30));
  const qServ = query(collection(db, "services"), orderBy("timestamp", "desc"), limit(30));

        const [prodSnap, servSnap] = await Promise.all([getDocs(qProd), getDocs(qServ)]);

        const prods = prodSnap.docs.map((d) => ({ id: d.id, type: "product", ...d.data() }));
        const servs = servSnap.docs.map((d) => ({ id: d.id, type: "service", ...d.data() }));

        // normalize timestamp to millis for sorting
        const toMillis = (ts: any): number => {
          if (!ts) return 0;
          if (typeof ts === "number") return ts;
          if (ts.toMillis) return ts.toMillis();
          if (ts.seconds) return ts.seconds * 1000;
          try { return new Date(ts).getTime(); } catch (e) { return 0; }
        };

        const combined = [...prods, ...servs].map((it: any) => ({
          ...it,
          _ts: toMillis(it.timestamp),
        }));

        combined.sort((a, b) => (b._ts || 0) - (a._ts || 0));

        if (mounted) setItems(combined.slice(0, 12));
      } catch (e) {
        console.warn("Failed to load new arrivals:", e);
      }
    };

    fetchBoth();
    return () => { mounted = false };
  }, []);

  const flatListRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);

  const ITEM_WIDTH = 160 + 14; // card width + marginRight

  const scrollToIndex = useCallback((index: number) => {
    if (!flatListRef.current) return;
    const offset = index * ITEM_WIDTH;
    try {
      flatListRef.current.scrollToOffset({ offset, animated: true });
    } catch (e) {
      // fallback: scrollToIndex
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  }, []);

  // auto-scroll timer
  useEffect(() => {
    const interval = 3500; // 3.5s per advance
    let timer: any = null;
    if (!isAutoScrollPaused && items.length > 1) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % items.length;
          scrollToIndex(next);
          return next;
        });
      }, interval);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isAutoScrollPaused, items.length, scrollToIndex]);

  const onUserScroll = () => {
    // pause auto-scroll briefly when the user interacts
    setIsAutoScrollPaused(true);
    // resume after a short delay
    const resumeMs = 5000; // 5s pause after user interaction
    const t = setTimeout(() => setIsAutoScrollPaused(false), resumeMs);
    return () => clearTimeout(t);
  };

  const renderItem = ({ item }: { item: any }) => {
    const image = item.image || (item.images && item.images[0]) || null;
    const title = item.productName || item.serviceTitle || item.name || item.title || "Untitled";
    const price = item.priceType === "Fixed" || item.priceType === "fixed" || item.price ? (item.price ? `₦${item.price}` : "") : (item.priceType === "Negotiable" ? "Negotiable" : "");

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("ProductDetail", { productId: item.id, type: item.type })}
        activeOpacity={0.9}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={[styles.image, { backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#777' }}>No image</Text>
          </View>
        )}

        <View style={styles.textBox}>
          <Text style={styles.name} numberOfLines={2}>{title}</Text>
          <Text style={styles.price}>{price}</Text>
        </View>

        {/* small clothing-like tag at top-left */}
        <View style={styles.newBadgeTop} pointerEvents="none">
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      </TouchableOpacity>
    )
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>New Arrivals</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={styles.listContent}
        onScrollBeginDrag={() => { onUserScroll(); }}
        onMomentumScrollBegin={() => { onUserScroll(); }}
        onScroll={({ nativeEvent }) => {
          const offsetX = nativeEvent.contentOffset.x || 0;
          const idx = Math.round(offsetX / ITEM_WIDTH);
          setCurrentIndex(idx);
        }}
        scrollEventThrottle={16}
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
    marginTop: -50,
  },
  header: { fontSize: 18, fontWeight: "700", color: "#222" },
  listContent: { paddingHorizontal: 10, paddingBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginRight: 10,
    width: 150,
    height: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  image: { width: "100%", height: 140, resizeMode: 'cover' },
  textBox: { padding: 10, paddingBottom: 20 },
  name: { fontSize: 14, fontWeight: "700", color: "#222", lineHeight: 18 },
  price: { fontSize: 13, color: "#6c63ff", marginTop: 6, fontWeight: "800" },
  newBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#ef4444",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  // top-left variant for compact clothing tag
  newBadgeTop: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#0dc21cff',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  newBadgeText: { color: "#ffffffff", fontWeight: "800", fontSize: 11, letterSpacing: 0.3 },
});