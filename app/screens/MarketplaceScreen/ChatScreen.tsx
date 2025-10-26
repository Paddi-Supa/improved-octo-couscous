
        import { useNavigation, useRoute } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Message = {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
};

type SellerInfo = {
  businessName: string;
  photoURL: string | null;
  lastSeen?: Date;
};

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { sellerId, productId } = route.params;
  
  const db = getFirestore();
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  const flatListRef = useRef<FlatList>(null);

  // Log route params for debugging
  useEffect(() => {
    console.log('Route params:', route.params);
  }, [route.params]);

  // Generate a unique chat ID for this buyer-seller pair
  const chatId = currentUserId && sellerId 
    ? [currentUserId, sellerId].filter((id, index, arr) => arr.indexOf(id) === index).sort().join('_')
    : null;

  // Fetch seller info from sellerVerifications
  useEffect(() => {
    const fetchSellerInfo = async () => {
      try {
        const sellerDoc = await getDoc(doc(db, 'sellerVerifications', sellerId));
        if (sellerDoc.exists()) {
          const data = sellerDoc.data();
          setSellerInfo({
            businessName: data.businessName || 'Seller',
            photoURL: data.photoURL || null,
            lastSeen: data.lastSeen ? new Date(data.lastSeen) : undefined
          });
        }
      } catch (error) {
        console.error('Error fetching seller info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerInfo();
  }, [db, sellerId]);

  // Initialize chat and listen to messages
  useEffect(() => {
    if (!currentUserId || !chatId || !sellerId) return;

    const initializeChat = async () => {
      try {
        // Ensure chat document exists
        const chatDocRef = doc(db, 'chats', chatId);
        const chatData: any = {
          participants: [currentUserId, sellerId],
          lastUpdated: serverTimestamp(),
          lastMessage: ''
        };
        
        // Only add productId if it exists
        if (productId) {
          chatData.productId = productId;
        }
        
        console.log('Creating/updating chat document:', { chatId, chatData });
        await setDoc(chatDocRef, chatData, { merge: true });
        // Mark this user's unread count as 0 (they opened the chat)
        try {
          await updateDoc(chatDocRef, {
            [`unreadCount.${currentUserId}`]: 0
          });
        } catch (e) {
          // ignore - doc may not exist yet in some race conditions
        }

        // Now listen to messages
        const messagesRef = collection(chatDocRef, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          console.log('Messages snapshot:', snapshot.size, 'messages');
          const messageList: Message[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()
          })) as Message[];
          
          setMessages(messageList);
          
          // Scroll to bottom when new messages arrive
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }, (error) => {
          console.error('Messages listener error:', error);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error initializing chat:', error);
        return () => {};
      }
    };

    const unsubscribePromise = initializeChat();
    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe());
    };
  }, [chatId, currentUserId, sellerId, productId, db]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !chatId) return;

    try {
      // Add message to subcollection
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: currentUserId,
        timestamp: serverTimestamp()
      });

      // Update chat document with last message
      const updateData: any = {
        lastMessage: newMessage.trim(),
        lastUpdated: serverTimestamp(),
        participants: [currentUserId, sellerId]
      };
      
      // Only include productId if it exists
      if (productId) {
        updateData.productId = productId;
      }
      
      await setDoc(doc(db, 'chats', chatId), updateData, { merge: true });

      // Increment unread count for other participants
      try {
        const recipients = updateData.participants || [];
        for (const r of recipients) {
          if (r !== currentUserId) {
            try {
              await updateDoc(doc(db, 'chats', chatId), {
                [`unreadCount.${r}`]: increment(1)
              });
            } catch (err) {
              console.warn('Failed to increment unread for', r, err);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to update unread counts after sending message', err);
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isSender = item.senderId === currentUserId;

    return (
      <View style={[
        styles.messageContainer,
        isSender ? styles.senderMessage : styles.receiverMessage
      ]}>
        <Text style={[
          styles.messageText,
          isSender ? styles.senderText : styles.receiverText
        ]}>
          {item.text}
        </Text>
        <Text style={styles.timeText}>
          {item.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Seller Info Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text>←</Text>
        </TouchableOpacity>
        
        <View style={styles.sellerInfo}>
          {sellerInfo?.photoURL ? (
            <Image 
              source={{ uri: sellerInfo.photoURL }} 
              style={styles.sellerImage} 
            />
          ) : (
            <View style={styles.sellerImagePlaceholder} />
          )}
          <View>
            <Text style={styles.sellerName}>{sellerInfo?.businessName || 'Seller'}</Text>
            <Text style={styles.onlineStatus}>
              {sellerInfo?.lastSeen 
                ? `Last seen ${sellerInfo.lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 10,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  sellerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  sellerImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 10,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  onlineStatus: {
    fontSize: 12,
    color: '#666',
  },
  messagesList: {
    padding: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 10,
    borderRadius: 15,
  },
  senderMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  receiverMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8E8E8',
  },
  messageText: {
    fontSize: 16,
  },
  senderText: {
    color: '#fff',
  },
  receiverText: {
    color: '#000',
  },
  timeText: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});