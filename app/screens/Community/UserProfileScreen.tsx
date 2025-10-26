import { useNavigation, useRoute } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { app } from '../../../firebaseConfig';

type Post = {
  id: string;
  text?: string;
  imageUrl?: string;
  image?: string;
  images?: string[];
  timestamp?: any;
};

export default function UserProfileScreen() {
  const route: any = useRoute();
  const { userId } = route.params || {};
  const db = getFirestore(app);
  const navigation: any = useNavigation();
  const auth = getAuth();

  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [postsCount, setPostsCount] = useState<number | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const ref = doc(db, 'profile', userId);
        const snap = await getDoc(ref);
        if (mounted) {
          const data = snap.exists() ? snap.data() : null;
          console.log('UserProfile loaded profile for', userId, data);
          setProfile(data);
        }

        const postsQ = query(collection(db, 'posts'), where('authorId', '==', userId));
        const snapPosts = await getDocs(postsQ);
        if (mounted) {
          setPostsCount(snapPosts.size);
          const all = snapPosts.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
          const toMillis = (ts: any) => ts?.toMillis?.() ?? (ts?.seconds ? ts.seconds * 1000 : 0);
          const list = all
            .sort((a: any, b: any) => (toMillis(b.timestamp) || 0) - (toMillis(a.timestamp) || 0))
            .slice(0, 10);
          setPosts(list);
        }
      } catch (err) {
        console.warn('Failed to load user profile', err);
        if (mounted) {
          setProfile(null);
          setPosts([]);
          setPostsCount(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [userId, db]);

  const getProfileImage = () => {
    if (!profile) return null;
    return profile.photoURL || profile.profileImage || profile.image || profile.avatar || null;
  };

  const getDisplayName = () => {
    if (!profile) return 'User';
    return profile.username || profile.displayName || profile.name || 'User';
  };

  if (!userId) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#777' }}>No user selected</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6c63ff" />
      </View>
    );
  }

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Image
          source={
            getProfileImage()
              ? { uri: getProfileImage() }
              : require('../../../assets/images/default.png')
          }
          style={styles.avatar}
        />
        <Text style={styles.username}>{getDisplayName()}</Text>
        <Text style={styles.meta}>{postsCount ?? 0} posts</Text>

        {auth.currentUser?.uid !== userId && (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => {
              const currentUserId = auth.currentUser?.uid;
              if (!currentUserId) {
                Alert.alert('Login required', 'Please sign in to chat with users.');
                return;
              }
              navigation.navigate('ChatScreen', { sellerId: userId });
            }}
          >
            <Text style={styles.chatBtnText}>Chat</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>About</Text>
        <Text style={{ color: '#555' }}>{profile?.bio || 'No bio available.'}</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={{ fontWeight: '700' }}>Latest posts</Text>
      </View>
    </View>
  );

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <Text style={styles.postText}>{item.text}</Text>
      {(item.imageUrl || item.image || (item.images && item.images[0])) && (
        <Image
          source={{ uri: item.imageUrl || item.image || item.images![0] }}
          style={styles.postImage}
        />
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No posts yet</Text>
    </View>
  );

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={renderPost}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eee',
  },
  username: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 12,
  },
  meta: {
    color: '#666',
    marginTop: 6,
  },
  chatBtn: {
    marginTop: 10,
    backgroundColor: '#6c63ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  chatBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  postCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 10,
  },
  postText: {
    fontWeight: '600',
    marginBottom: 6,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyContainer: {
    paddingVertical: 12,
  },
  emptyText: {
    color: '#777',
    textAlign: 'center',
  },
});
