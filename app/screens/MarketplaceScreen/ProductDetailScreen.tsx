import { useNavigation, useRoute } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, getFirestore } from "firebase/firestore";
import React, { memo, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Linking,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function ProductDetailsScreen() {
  const route: any = useRoute();
  const navigation: any = useNavigation();
  const params = (route.params as any) || {};
  // Handle both param patterns (id/type and productId)
  const id = params.id || params.productId;
  const type = params.type || "product"; // Default to product if not specified
  const db = getFirestore();

  const [data, setData] = useState<any | null>(null);
  const [seller, setSeller] = useState<any | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Reviews & Ratings
  const [userRating, setUserRating] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  // (review input will be rendered in header)

  useEffect(() => {
    fetchDetails();
    fetchReviews();
  }, []);

  const fetchDetails = async () => {
    try {
      if (!type || !id) {
        console.log("Missing required params:", { type, id });
        return;
      }
      
      const collectionName = type === "service" ? "services" : "products";
      console.log("Fetching from collection:", collectionName, "with id:", id);
      
      const docRef = doc(db, collectionName, id);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const itemData = snap.data();
        if (!itemData.sellerId) {
          console.log("Warning: Document exists but missing sellerId:", itemData);
        }
        setData(itemData);

        // Fetch Seller Data
        const sellerRef = doc(db, "sellerVerifications", itemData.sellerId);
        const sellerSnap = await getDoc(sellerRef);
        if (sellerSnap.exists()) {
          setSeller(sellerSnap.data());
        }
      }
    } catch (e) {
      console.log("Error fetching details:", e);
    }
  };

  const fetchReviews = async () => {
    try {
      const reviewCollection = collection(db, "reviews");
      const snap = await getDocs(reviewCollection);
      const reviewList = snap.docs
        .map((d: any) => ({ id: d.id, ...(d.data() as any) }))
        .filter((r: any) => r.productId === id);

      setReviews(reviewList);

      if (reviewList.length > 0) {
        const avg = reviewList.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviewList.length;
        setAverageRating(avg);
      } else {
        setAverageRating(0);
      }
    } catch (e) {
      console.log("Error fetching reviews:", e);
    }
  };

  // submitReview accepts the review text to avoid lifting text state into parent
  const submitReview = async (reviewText: string) => {
    if (userRating === 0 || !reviewText || reviewText.trim() === "") return;

    const newReview = {
      productId: id,
      rating: userRating,
      review: reviewText.trim(),
      timestamp: new Date(),
    };

    try {
      await addDoc(collection(db, "reviews"), newReview);
      setUserRating(0);
      // fetch updated reviews
      fetchReviews();
    } catch (e) {
      console.log("Error submitting review:", e);
    }
  };

  if (!data) return <Text style={styles.loading}>Loading details...</Text>;

  const buyLabel = type === "service" ? "Order Now" : "Buy Now";
  const itemName = data.productName || data.serviceTitle;
  const itemImages = data.images || [data.image];

  // Render stars for user input
  const renderUserStarRating = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setUserRating(i)}>
          <Text style={{ fontSize: 22, color: i <= userRating ? "#FFD700" : "#ccc" }}>★</Text>
        </TouchableOpacity>
      );
    }
    return <View style={{ flexDirection: "row", marginVertical: 6 }}>{stars}</View>;
  };

  // Memoized child component to manage review text locally and avoid parent re-renders
  const InnerReviewInput = ({ onSubmit }: { onSubmit: (text: string) => void }) => {
    const [text, setText] = useState("");
    return (
      <View>
        <TextInput
          style={styles.reviewInput}
          placeholder="Write your review..."
          multiline
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity style={styles.submitReviewBtn} onPress={() => { onSubmit(text); setText(""); }}>
          <Text style={styles.submitReviewText}>Submit Review</Text>
        </TouchableOpacity>
      </View>
    )
  };

  const ReviewInput = memo(InnerReviewInput);

  // Render stars for average rating (supports half stars)
  const renderAverageStars = () => {
    const fullStars = Math.floor(averageRating);
    const halfStar = averageRating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    const stars = [];

    for (let i = 0; i < fullStars; i++) stars.push(<Text key={`f${i}`} style={styles.star}>★</Text>);
    if (halfStar) stars.push(<Text key="half" style={styles.star}>⭐</Text>);
    for (let i = 0; i < emptyStars; i++) stars.push(<Text key={`e${i}`} style={[styles.star, { color: "#ccc" }]}>★</Text>);

    return <View style={{ flexDirection: "row" }}>{stars}</View>;
  };

  const ListHeaderComponent = () => (
    <View style={styles.detailsContainer}>
      {/* Title */}
      <Text style={styles.header}>Details</Text>

      {/* Image */}
      {itemImages[0] ? (
        <Image source={{ uri: itemImages[0] }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.imagePlaceholder]}>
          <Text style={{ color: '#777' }}>No image available</Text>
        </View>
      )}

      {/* Product Name */}
      <Text style={styles.itemName}>{itemName}</Text>

      {/* Seller Name */}
      <Text style={styles.sellerName}>
        Seller: {seller?.businessName || "Unknown Seller"}
      </Text>

      {/* Price */}
      <Text style={styles.price}>
        {data.priceType === "Negotiable"
          ? "Price: Negotiable"
          : `₦${data.price}`}
      </Text>

      {/* Average Rating with Stars */}
      {reviews.length > 0 && (
        <View style={{ marginTop: 4 }}>
          {renderAverageStars()}
          <Text style={{ color: "#777", fontSize: 12 }}>
            {averageRating.toFixed(1)} ({reviews.length} reviews)
          </Text>
        </View>
      )}

      {/* Description */}
      <Text style={styles.sectionTitle}>Description</Text>
      <Text style={styles.description}>{data.description}</Text>

      {/* Seller profile preview */}
      <TouchableOpacity
        style={styles.sellerRow}
        onPress={() => navigation.navigate("SellerProfile", { sellerId: data.sellerId })}
        activeOpacity={0.8}
      >
        <Image
          source={
            seller?.profileImage
              ? { uri: seller.profileImage }
              : seller?.image
              ? { uri: seller.image }
              : require("../../../assets/images/verifi.png")
          }
          style={styles.sellerAvatar}
        />
        <View style={{ marginLeft: 12, justifyContent: "center" }}>
          <Text style={styles.sellerBusinessName}>{seller?.businessName || "Seller"}</Text>
          {seller?.businessTag && (
            <Text style={styles.sellerSub}>{seller.businessTag}</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.buyBtn}
          onPress={() => setShowPaymentModal(true)}
        >
          <Text style={styles.buyText}>{buyLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => Linking.openURL(`tel:${seller?.phoneNumber}`)}
        >
          <Text style={styles.iconText}>📞</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            const auth = getAuth();
            const currentUserId = auth.currentUser?.uid;

            if (!currentUserId) {
              // Handle not logged in state
              Alert.alert("Login Required", "Please log in to chat with the seller.");
              return;
            }

            if (data?.sellerId) {
              if (currentUserId === data.sellerId) {
                Alert.alert("Note", "This is your own listing. You can't chat with yourself.");
                return;
              }

              navigation.navigate("ChatScreen", {
                sellerId: data.sellerId,
                productId: id,
                type: type
              });
            } else {
              Alert.alert("Error", "Seller information is not available.");
            }
          }}
        >
          <Text style={styles.iconText}>💬</Text>
        </TouchableOpacity>
      </View>

      {/* Reviews Section */}
      <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
      {renderUserStarRating()}
      <ReviewInput onSubmit={submitReview} />

      {reviews.length === 0 && (
        <Text style={{ marginTop: 6, color: "#777" }}>No reviews yet</Text>
      )}
    </View>
  );

  const renderReview = ({ item }: { item: any }) => {
    const rating = Math.max(0, Math.min(5, Number(item?.rating) || 0));
    const filled = "★".repeat(rating);
    const empty = "☆".repeat(5 - rating);
    return (
      <View style={[styles.reviewCard, styles.detailsContainer]}>
        <Text style={styles.reviewStars}>{filled + empty}</Text>
        <Text style={styles.reviewText}>{item?.review || ""}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item, index) => (item?.id ? String(item.id) : String(index))}
        ListHeaderComponent={ListHeaderComponent}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      />

      {/* review input moved back to header */}

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Payment Details</Text>

            <Text style={styles.modalLabel}>Bank Name</Text>
            <Text style={styles.modalValue}>{data.bankName}</Text>

            <Text style={styles.modalLabel}>Account Number</Text>
            <Text style={styles.modalValue}>{data.accountNumber}</Text>

            <Text style={styles.warning}>
              ⚠️ Please ensure you have **physically received your product/service**
              before making payment. Paddi is **not responsible** for refunds
              or disputes between buyers and sellers.
            </Text>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  detailsContainer: { 
    padding: 12 
  },
  header: { 
    fontSize: 18, 
    fontWeight: "700", 
    marginBottom: 10 
  },
  productImage: {
    width: "100%",
    height: 240,
    borderRadius: 10,
    resizeMode: "cover",
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f2f2'
  },
  itemName: { 
    fontSize: 17, 
    fontWeight: "700", 
    marginTop: 10 
  },
  sellerName: { 
    fontSize: 14, 
    marginTop: 4, 
    color: "#666" 
  },
  price: { 
    color: "#6c63ff", 
    fontSize: 16, 
    fontWeight: "700", 
    marginTop: 8 
  },
  sectionTitle: { 
    marginTop: 12, 
    fontWeight: "700", 
    fontSize: 15 
  },
  description: { 
    fontSize: 14, 
    marginTop: 4, 
    color: "#444" 
  },
  actionRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginTop: 18 
  },
  buyBtn: {
    flex: 1,
    backgroundColor: "#27ae60",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buyText: { 
    color: "#fff", 
    fontWeight: "600", 
    fontSize: 14 
  },
  iconBtn: {
    width: 48,
    height: 48,
    marginLeft: 10,
    backgroundColor: "#eee",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { 
    fontSize: 22 
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 10,
  },
  modalTitle: { 
    fontWeight: "700", 
    fontSize: 17, 
    marginBottom: 10 
  },
  modalLabel: { 
    fontWeight: "600", 
    marginTop: 8 
  },
  modalValue: { 
    fontSize: 15, 
    color: "#333" 
  },
  warning: { 
    marginTop: 12, 
    fontSize: 12, 
    color: "#b22222" 
  },
  closeBtn: {
    backgroundColor: "#6c63ff",
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  closeText: { 
    color: "#fff", 
    fontWeight: "600" 
  },
  loading: { 
    marginTop: 60, 
    textAlign: "center", 
    color: "#777" 
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginTop: 6,
    minHeight: 60,
    textAlignVertical: "top",
  },
  submitReviewBtn: {
    backgroundColor: "#6c63ff",
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 6,
    alignItems: "center",
  },
  submitReviewText: { 
    color: "#fff", 
    fontWeight: "600" 
  },
  reviewCard: {
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 6,
    marginTop: 6,
  },
  reviewStars: { 
    fontSize: 16, 
    color: "#FFD700" 
  },
  reviewText: { 
    marginTop: 4, 
    fontSize: 14, 
    color: "#333" 
  },
  star: { 
    fontSize: 16, 
    color: "#FFD700", 
    marginRight: 2 
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  sellerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#eee",
  },
  sellerBusinessName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },
  sellerSub: {
    fontSize: 12,
    color: "#666",
  },
  reviewFooter: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 14,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  reviewInputFooter: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    minHeight: 48,
    maxHeight: 140,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
});