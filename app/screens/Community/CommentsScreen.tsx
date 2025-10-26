import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../../firebaseConfig";

export default function CommentsScreen() {
  const route = useRoute();
  const navigation: any = useNavigation();
  const params: any = route.params || {};
  // CommentsScreen accepts either a `post` object or a `postId` for flexibility
  const { post: initialPost, postId } = params;

  const [post, setPost] = useState<any>(initialPost || null);
  const [comment, setComment] = useState<string>("");
  const [comments, setComments] = useState<any[]>([]);

  // If only postId provided, fetch post document
  useEffect(() => {
    let mounted = true;
    const loadPost = async () => {
      if (!post && postId) {
        try {
          const d = await getDoc(doc(db, "posts", postId));
          if (d.exists() && mounted) setPost({ id: d.id, ...d.data() });
        } catch (e) {
          console.error("Failed to load post:", e);
        }
      }
    };
    loadPost();
    return () => {
      mounted = false;
    };
  }, [postId, post]);

  // Subscribe to comments for this post
  useEffect(() => {
    if (!post?.id) return;
    const q = query(
      collection(db, "posts", post.id, "comments"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docItem) => list.push({ id: docItem.id, ...docItem.data() }));
      setComments(list);
    });

    return () => unsubscribe();
  }, [post?.id]);

  const sendComment = async () => {
    if (!comment.trim()) return;
    if (!auth.currentUser?.uid) {
      console.error("User must be logged in to comment");
      return;
    }
    if (!post?.id) return;

    try {
      await addDoc(collection(db, "posts", post.id, "comments"), {
        text: comment.trim(),
        authorId: auth.currentUser.uid,
        username: auth.currentUser.displayName || "",
        userPhoto: auth.currentUser.photoURL || null,
        timestamp: serverTimestamp(),
      });
      setComment("");
    } catch (e) {
      console.error("Failed to send comment:", e);
    }
  };

  const renderComment = ({ item }: { item: any }) => (
    <View style={styles.commentCard}>
      <Image
        source={item.userPhoto ? { uri: item.userPhoto } : require("../../../assets/images/default.png")}
        style={styles.avatar}
      />
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.username || "Anonymous"}</Text>
          <Text style={styles.commentTime}>{formatTimestamp(item.timestamp)}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
      </View>

      {/* Post preview */}
      {post ? (
        <View style={styles.postPreview}>
          <View style={styles.postPreviewHeader}>
            <Image source={post.profileImage ? { uri: post.profileImage } : require("../../../assets/images/default.png")} style={styles.previewAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.previewAuthor}>{post.username || "Anonymous"}</Text>
              <Text style={styles.previewTime}>{post.timestamp?.toDate?.()?.toLocaleString?.() || ""}</Text>
            </View>
          </View>
          {post.text ? <Text style={styles.previewText}>{post.text}</Text> : null}
          {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={styles.previewImage} /> : null}
        </View>
      ) : (
        <View style={styles.postPreviewEmpty}>
          <Text style={styles.previewText}>Post not available</Text>
        </View>
      )}

      {/* Comments list */}
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        contentContainerStyle={styles.commentsList}
        ListEmptyComponent={<Text style={styles.emptyText}>No comments yet — be the first to say something.</Text>}
      />

      {/* Composer */}
      <View style={styles.composerRow}>
        <Image source={auth.currentUser?.photoURL ? { uri: auth.currentUser.photoURL } : require("../../../assets/images/default.png")} style={styles.composerAvatar} />
        <TextInput
          style={styles.composerInput}
          placeholder="Write a comment..."
          placeholderTextColor="#9AA4B2"
          value={comment}
          onChangeText={setComment}
          multiline={false}
        />
        <TouchableOpacity onPress={sendComment} style={styles.sendButton}>
          <Feather name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function formatTimestamp(ts: any) {
  try {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  } catch (e) {
    return "";
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  headerRow: { flexDirection: "row", alignItems: "center", padding: 12, paddingTop: 18, backgroundColor: "#fff" },
  backButton: { padding: 6, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  postPreview: { backgroundColor: "#fff", padding: 12, margin: 12, borderRadius: 10, elevation: 1 },
  postPreviewHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  previewAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: "#EEE" },
  previewAuthor: { fontWeight: "700", fontSize: 15, color: "#111" },
  previewTime: { fontSize: 12, color: "#8C95A6" },
  previewText: { fontSize: 15, color: "#111", marginTop: 6 },
  previewImage: { width: "100%", height: 220, marginTop: 8, borderRadius: 8, backgroundColor: "#EEE" },
  postPreviewEmpty: { padding: 16, alignItems: "center" },
  commentsList: { paddingHorizontal: 12, paddingBottom: 12 },
  emptyText: { textAlign: "center", color: "#8C95A6", marginTop: 24 },
  commentCard: { flexDirection: "row", padding: 12, backgroundColor: "#fff", borderRadius: 10, marginTop: 10, elevation: 1, alignItems: "flex-start" },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: "#EEE" },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  commentAuthor: { fontWeight: "700", color: "#111" },
  commentTime: { color: "#9AA4B2", fontSize: 12 },
  commentText: { color: "#2B2B2B", fontSize: 14, lineHeight: 20 },
  composerRow: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#EFEFF0" },
  composerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8, backgroundColor: "#EEE" },
  composerInput: { flex: 1, height: 40, backgroundColor: "#F2F4F7", borderRadius: 20, paddingHorizontal: 12, color: "#111" },
  sendButton: { marginLeft: 8, backgroundColor: "#2563EB", padding: 10, borderRadius: 20 }
});