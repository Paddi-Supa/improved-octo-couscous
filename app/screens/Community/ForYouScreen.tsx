import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../../../firebaseConfig";

export default function ForYouScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [postComments, setPostComments] = useState<{[key: string]: any[]}>({});
  const navigation: any = useNavigation();
  

  // navigate to CommentsScreen and pass the full post object (CommentsScreen expects `post`)
  const navigateToComments = (post: any) => {
    navigation.navigate('CommentsScreen' as never, { post } as never);
  };

  // Listen for posts and comments
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnapshot) => {
        const postData = docSnapshot.data();
        list.push({ 
          id: docSnapshot.id,
          ...postData
        });
        
        // Set up comments listener for each post
        const commentsQuery = query(
          collection(db, "posts", docSnapshot.id, "comments"),
          orderBy("timestamp", "desc")
        );
        onSnapshot(commentsQuery, (commentsSnapshot) => {
          const comments: any[] = [];
          commentsSnapshot.forEach((commentDoc) => {
            comments.push({ id: commentDoc.id, ...commentDoc.data() });
          });
          setPostComments(prev => ({
            ...prev,
            [docSnapshot.id]: comments
          }));
        });
      });
      // Attach any known profile data from cache to the posts
      const attached = list.map((p) => ({
        ...p,
        profileImage: profiles[p.authorId]?.photoURL || p.profileImage,
        username: profiles[p.authorId]?.username || p.username,
      }));
      setPosts(attached);

  // Find any missing profile docs we need to fetch
      const missingIds = Array.from(new Set(list.map((p) => p.authorId).filter(Boolean))).filter((id) => !profiles[id]);
      if (missingIds.length > 0) {
        // fetch profiles in parallel. Be defensive: some projects store profiles under
        // different doc ids (or with a `uid` field). Try getDoc by uid first; if the
        // returned doc doesn't match the requested uid, fall back to querying for a
        // profile document whose `uid` field equals the requested uid. This avoids
        // accidentally picking the wrong profile document.
        Promise.all(missingIds.map(async (uid) => {
          try {
            // try direct doc lookup first
            const d = await getDoc(doc(db, 'profile', uid));
            if (d.exists()) {
              const data = d.data();
              // if the doc contains an explicit uid field, ensure it matches
              if (!data || data.uid === undefined || data.uid === uid) {
                return { uid, data };
              }
              // otherwise, doc id existed but its internal uid doesn't match: continue to query
            }

            // fallback: query for profile where uid == requested uid
            try {
              const q = query(collection(db, 'profile'), where('uid', '==', uid));
              const qs = await (await import('firebase/firestore')).getDocs(q);
              if (qs && qs.size > 0) {
                const first = qs.docs[0];
                return { uid, data: first.data() };
              }
            } catch (qerr) {
              // continue to return null data
              console.warn('Profile query fallback failed for', uid, qerr);
            }

            return { uid, data: null };
          } catch (err) {
            console.warn('Failed to load profile for', uid, err);
            return { uid, data: null };
          }
        }))
        .then((results) => {
          const next: Record<string, any> = {};
          results.forEach((r) => {
            if (r && r.uid) next[r.uid] = r.data || null;
          });
          // merge into profiles cache and update posts using the merged snapshot
          setProfiles((prev) => {
            const merged = { ...prev, ...next };
            setPosts((prevPosts) => prevPosts.map((p) => ({
              ...p,
              profileImage: merged[p.authorId]?.photoURL || p.profileImage,
              username: merged[p.authorId]?.username || p.username,
            })));
            return merged;
          });
        });
      }
    });

    return () => unsubscribe();
  }, []);

  

  // sendComment removed - comments are handled in the dedicated Comments screen

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: item.authorId })}>
          <Image
            source={
              item.profileImage 
                ? { uri: item.profileImage }
                : require("../../../assets/images/default.png")
            }
            style={styles.avatar}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: item.authorId })}>
            <Text style={styles.username}>{item.username || "Anonymous"}</Text>
          </TouchableOpacity>
          <Text style={styles.time}>
            {item.timestamp?.toDate().toLocaleDateString() || "Just now"}
          </Text>
        </View>
      </View>

      <Text style={styles.content}>{item.text}</Text>

      {item.imageUrl && (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      <TouchableOpacity
        style={styles.commentsButton}
        onPress={() => navigateToComments(item)}
      >
        <View style={styles.commentsHeader}>
          <Feather name="message-square" size={20} color="#536471" />
          <Text style={styles.commentsCount}>
            {postComments[item.id]?.length || 0} Comments
          </Text>
        </View>
        
        {postComments[item.id]?.[0] && (
          <View style={styles.previewComment}>
            <Text style={styles.previewCommentText} numberOfLines={1}>
              {postComments[item.id][0].text}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  listContent: {
    paddingVertical: 8
  },
  postCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16
  },
  headerContent: {
    flex: 1,
    marginLeft: 12
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F2F5"
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2
  },
  time: {
    fontSize: 13,
    color: "#65676B"
  },
  content: {
    fontSize: 15,
    lineHeight: 20,
    color: "#1A1A1A",
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  postImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#F0F2F5"
  },
  commentsButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5"
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center"
  },
  commentsCount: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#65676B"
  },
  previewComment: {
    marginTop: 8,
    paddingLeft: 28
  },
  previewCommentText: {
    fontSize: 14,
    color: "#65676B"
  }
 
});