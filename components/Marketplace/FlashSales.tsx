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
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FLASH_BADGE = require("../../assets/images/flashsale.png");

export default function FlashSales() {
  const [items, setItems] = useState<any[]>([]);
  const db = getFirestore();
  const navigation: any = useNavigation();

  const toMillis = (ts: any): number => {
    if (!ts) return 0;
    if (typeof ts === "number") return ts;
    if (ts.toMillis) return ts.toMillis();
    if (ts.seconds) return ts.seconds * 1000;
    try {
      return new Date(ts).getTime();
    } catch (e) {
      return 0;
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchDiscounted = async () => {
      try {
        const qProd = query(
          collection(db, "products"),
          where("isDiscounted", "==", true),
          orderBy("timestamp", "desc"),
          limit(24)
        );
        const qServ = query(
          collection(db, "services"),
          where("isDiscounted", "==", true),
          orderBy("timestamp", "desc"),
          limit(24)
        );

        let prodSnap: any;
        let servSnap: any;
        try {
          [prodSnap, servSnap] = await Promise.all([getDocs(qProd), getDocs(qServ)]);
        } catch (err) {
          console.warn("FlashSales: ordered query failed, falling back to where-only. Error:", err);
          const qProd2 = query(collection(db, "products"), where("isDiscounted", "==", true), limit(50));
          const qServ2 = query(collection(db, "services"), where("isDiscounted", "==", true), limit(50));
          [prodSnap, servSnap] = await Promise.all([getDocs(qProd2), getDocs(qServ2)]);
        }

        const prods = prodSnap.docs.map((d: any) => ({ id: d.id, type: "product", ...d.data() }));
        const servs = servSnap.docs.map((d: any) => ({ id: d.id, type: "service", ...d.data() }));

        const combined = [...prods, ...servs].map((it: any) => ({ ...it, _ts: toMillis(it.timestamp) }));
        combined.sort((a: any, b: any) => (b._ts || 0) - (a._ts || 0));

        if (mounted) {
          const sliced = combined.slice(0, 12);
          console.debug(`FlashSales: loaded ${sliced.length} items`);
          setItems(sliced);
        }
      } catch (e) {
        console.warn("Failed to load flash sales:", e);
        if (mounted) setItems([]);
      }
    };

    fetchDiscounted();
    return () => {
      mounted = false;
    };
  }, []);

  const renderItem = ({ item }: { item: any }) => {
    const image = item.image || (item.images && item.images[0]) || null;
    const title = item.productName || item.serviceTitle || item.name || item.title || "Untitled";

    // Try common fields for prices
    const original =
      item.originalPrice ?? item.priceBeforeDiscount ?? item.original ?? null;
    const discounted = item.discountPrice ?? item.discountedPrice ?? item.price ?? null;

    const originalStr = original != null ? `₦${Number(original).toLocaleString()}` : null;
    const discountedStr = discounted != null ? `₦${Number(discounted).toLocaleString()}` : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("ProductDetail", { productId: item.id, type: item.type })}
        activeOpacity={0.9}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={[styles.image, { backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" }]}>
            <Text style={{ color: "#777" }}>No image</Text>
          </View>
        )}

        <View style={styles.textBox}>
          <Text style={styles.name} numberOfLines={2}>{title}</Text>

          <View style={styles.priceRow}>
            {originalStr ? (
              <Text style={styles.originalPrice}>{originalStr}</Text>
            ) : null}

            {discountedStr ? (
              <Text style={styles.discountPrice}>{discountedStr}</Text>
            ) : null}
          </View>
          {/* show discount end date if available */}
          {(() => {
            const endMs = toMillis(item.discountEnd ?? item.discount_end ?? item.discountEndDate ?? item.discountEndTimestamp ?? null);
            if (!endMs) return null;
            const now = Date.now();
            const endDate = new Date(endMs);
            if (endMs > now) {
              return <Text style={styles.expiry}>Ends {endDate.toLocaleDateString()}</Text>;
            } else {
              return <Text style={[styles.expiry, { color: '#b91c1c' }]}>Expired {endDate.toLocaleDateString()}</Text>;
            }
          })()}
        </View>

        {/* circular flash badge bottom-right */}
        <View style={styles.flashBadge} pointerEvents="none">
          <Image source={FLASH_BADGE} style={styles.flashBadgeImage} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Flash Sales⚡</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No flash sales right now.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    marginTop: -8,
  },
  header: { fontSize: 18, fontWeight: "700", color: "#222" },
  listContent: { paddingHorizontal: 10, paddingBottom: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginRight: 12,
    width: 170,
    height: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
  },
  image: { width: "100%", height: 140, resizeMode: "cover" },
  textBox: { padding: 12, paddingBottom: 18 },
  name: { fontSize: 14, fontWeight: "700", color: "#222", lineHeight: 18, marginBottom: 6 },
  priceRow: { flexDirection: "row", alignItems: "baseline" },
  originalPrice: { fontSize: 12, color: "#888", textDecorationLine: "line-through", marginRight: 8 },
  discountPrice: { fontSize: 19, color: "#0dc40dff", fontWeight: "900" },
  expiry: { marginTop: 6, color: '#6b7280', fontSize: 12 },

  flashBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 6,
    overflow: "hidden",
  },
  flashBadgeImage: { width: 50, height: 50, resizeMode: "contain" },
  emptyState: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#666', fontSize: 14 },
});