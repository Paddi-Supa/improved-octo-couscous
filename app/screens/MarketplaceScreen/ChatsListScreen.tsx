import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface UserData {
  businessName: string;
  photoURL?: string;
}

interface ProductData {
  productName: string;
}

interface ChatData {
  participants: string[];
  lastMessage?: string;
  lastUpdated: any;
  productId?: string;
  unreadCount?: {
    [key: string]: number;
  };
}

type ChatPreview = {
  id: string;
  lastMessage: string;
  lastUpdated: Date;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto?: string;
  productId?: string;
  productName?: string;
  unreadCount: number;
};

export default function ChatsListScreen() {
  const navigation = useNavigation<any>();
  const auth = getAuth();
  const db = getFirestore();
  const currentUserId = auth.currentUser?.uid;

  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  const pendingRef = useRef<any>(null);

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    // Query chats where the current user is a participant
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUserId),
      orderBy('lastUpdated', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatPreviews: ChatPreview[] = [];

      // Process each chat document
      for (const chatDoc of snapshot.docs) {
        const chatData = chatDoc.data() as ChatData;
        
        // Find the other participant's ID
        const otherUserId = chatData.participants.find((id: string) => id !== currentUserId);
        
        if (otherUserId) {
          try {
            // Get other user's details from sellerVerifications
            const sellerVerificationsRef = collection(db, 'sellerVerifications');
            const userDocRef = doc(sellerVerificationsRef, otherUserId);
            const userDoc = await getDoc(userDocRef);
            const userData = userDoc.exists() ? (userDoc.data() as UserData) : { businessName: 'Unknown User' };

            // Get product details if productId exists
            let productName = undefined;
            if (chatData.productId) {
              const productsRef = collection(db, 'products');
              const productDocRef = doc(productsRef, chatData.productId);
              const productDoc = await getDoc(productDocRef);
              if (productDoc.exists()) {
                const productData = productDoc.data() as ProductData;
                productName = productData.productName;
              }
            }

            chatPreviews.push({
              id: chatDoc.id,
              lastMessage: chatData.lastMessage || 'No messages yet',
              lastUpdated: chatData.lastUpdated?.toDate() || new Date(),
              otherUserId,
              otherUserName: userData?.businessName || 'Unknown User',
              otherUserPhoto: userData?.photoURL,
              productId: chatData.productId,
              productName,
              unreadCount: chatData.unreadCount?.[currentUserId] || 0
            });
          } catch (error) {
            console.error('Error fetching chat details:', error);
          }
        }
      }

      const sorted = chatPreviews.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
      const total = sorted.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

      // debounce setting chats and total unread to avoid UI thrash on rapid updates
      if (pendingRef.current) clearTimeout(pendingRef.current);
      pendingRef.current = setTimeout(() => {
        setChats(sorted);
        setTotalUnread(total);
        setLoading(false);
        pendingRef.current = null;
      }, 250);
    });

    return () => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
      unsubscribe();
    };
  }, [currentUserId, db]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderChatItem = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigation.navigate('marketplace', {
        screen: 'ChatScreen',
        params: {
          sellerId: item.otherUserId,
          productId: item.productId,
        }
      })}
    >
      {/* User Photo */}
      {item.otherUserPhoto ? (
        <Image source={{ uri: item.otherUserPhoto }} style={styles.userPhoto} />
      ) : (
        <View style={[styles.userPhoto, styles.userPhotoPlaceholder]}>
          <Text style={styles.placeholderText}>
            {item.otherUserName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Chat Info */}
      <View style={styles.chatInfo}>
        <View style={styles.topRow}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.otherUserName}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(item.lastUpdated)}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.productName ? `[${item.productName}] ` : ''}
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!currentUserId) {
    return (
      <View style={styles.centerContainer}>
        <Text>Please log in to view your chats</Text>
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text>No chats yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top-right unread indicator */}
      {totalUnread > 0 && (
        <View style={styles.topUnreadIndicator} pointerEvents="none">
          <View style={styles.topUnreadBadge}>
            <Text style={styles.topUnreadText}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  listContent: {
    paddingVertical: 8,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  userPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userPhotoPlaceholder: {
    backgroundColor: '#e1e1e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 24,
    color: '#666',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    color: '#666',
    fontSize: 12,
  },
  lastMessage: {
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  topUnreadIndicator: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 20,
  },
  topUnreadBadge: {
    backgroundColor: '#EF4444',
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    elevation: 4,
  },
  topUnreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});