import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { getAuth } from "firebase/auth";
import { collection, doc, getDoc, getFirestore, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { app } from "../../firebaseConfig";

export default function Header() {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [chatUnread, setChatUnread] = useState<number>(0);

  const router = useRouter();
  const navigation: any = useNavigation();

  useEffect(() => {
    const auth = getAuth(app);
    const user = auth.currentUser;

    (async () => {
      try {
        if (user?.uid) {
          const db = getFirestore(app);
          const profileRef = doc(db, 'profile', user.uid);
          const snap = await getDoc(profileRef);
          if (snap.exists()) {
            const data: any = snap.data();
            if (data && (data.uid === undefined || data.uid === user.uid)) {
              if (data.photoURL) {
                setUserPhoto(data.photoURL);
                await SecureStore.setItemAsync('userPhoto', data.photoURL);
              }
              if (data.username) {
                setUsername(data.username);
                await SecureStore.setItemAsync('username', data.username);
              }
              return;
            }

            // fallback: query profile docs where uid == user.uid
            try {
              const q = query(collection(getFirestore(app), 'profile'), where('uid', '==', user.uid));
              const qs = await (await import('firebase/firestore')).getDocs(q);
              if (qs && qs.size > 0) {
                const first = qs.docs[0].data() as any;
                if (first.photoURL) {
                  setUserPhoto(first.photoURL);
                  await SecureStore.setItemAsync('userPhoto', first.photoURL);
                }
                if (first.username) {
                  setUsername(first.username);
                  await SecureStore.setItemAsync('username', first.username);
                }
                return;
              }
            } catch (qerr) {
              console.warn('Profile fallback query failed in Header', qerr);
            }
          }
        }

        // last-resort fallbacks
        if (user?.photoURL) setUserPhoto(user.photoURL);
        else {
          const photo = await SecureStore.getItemAsync('userPhoto');
          if (photo) setUserPhoto(photo);
        }

        const storedName = await SecureStore.getItemAsync('username');
        if (storedName) setUsername(storedName);
        else if (user?.displayName) setUsername(user.displayName);
        else if (user?.email) setUsername(user.email.split('@')[0]);
      } catch (e) {
        console.error('Failed to load profile for header', e);
        if (user?.photoURL) setUserPhoto(user.photoURL);
        SecureStore.getItemAsync('username').then((stored) => {
          if (stored) setUsername(stored);
        });
      }
    })();
  }, []);

  // listen for unread chat totals for this user
  useEffect(() => {
    const auth = getAuth(app);
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const db = getFirestore(app);
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', uid));
    const unsub = onSnapshot(q, (snap) => {
      let total = 0;
      snap.forEach((d) => {
        const data: any = d.data();
        total += data.unreadCount?.[uid] || 0;
      });
      setChatUnread(total);
    }, (err) => console.warn('Chats listener error', err));
    return () => unsub();
  }, []);

  

  const goToProfile = () => router.push('/profile');

  const onSubmitSearch = async () => {
    const q = (searchValue || '').trim();
    if (!q) return;
    try {
      setSearching(true);
      navigation.navigate('CategoryScreen', { searchQuery: q });
      setSearchValue('');
    } catch (e) {
      console.error('Search navigation failed', e);
    } finally {
      setSearching(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={goToProfile} activeOpacity={0.85}>
          <Image
            source={userPhoto ? { uri: userPhoto } : require('../../assets/images/default.png')}
            style={styles.profileImage}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={goToProfile} activeOpacity={0.85}>
          <View style={styles.nameWrap}>
            <Text style={styles.usernameText}>{username || 'Guest'}</Text>
            <Text style={styles.subText}>Shop • Explore</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#666" />
        <TextInput
          placeholder="Search items, services or sellers"
          placeholderTextColor="#9AA0A6"
          style={styles.searchInput}
          returnKeyType="search"
          value={searchValue}
          onChangeText={setSearchValue}
          editable={!searching}
          onSubmitEditing={onSubmitSearch}
        />
      </View>

      <View style={styles.actionsRight}>
        <TouchableOpacity
          style={styles.iconWrap}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('community', { screen: 'ChatList' })}
        >
          <Ionicons name="notifications-outline" size={20} color="#fff" />
          {chatUnread > 0 && (
            <View style={styles.iconBadge}>
              <Text style={styles.iconBadgeText}>{chatUnread > 99 ? '99+' : chatUnread}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconWrap}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('marketplace')}
        >
          <Ionicons name="cart-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#6501B5',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    minWidth: 110,
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginRight: 10,
    backgroundColor: '#eee',
  },
  nameWrap: {
    flexDirection: 'column',
  },
  usernameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  subText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingHorizontal: 14,
    height: 44,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    color: '#222',
    fontSize: 15,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  iconBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    elevation: 6,
  },
  iconBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
