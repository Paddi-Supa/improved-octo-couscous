
import * as ImagePicker from 'expo-image-picker';
import { updateProfile } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { supabase } from '../../utils/supabaseClient';

export default function Profile() {
  const user = auth.currentUser;
  const uid = user?.uid;

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || null);
  const [uploading, setUploading] = useState(false);
  // logout/view-account removed per request
  const [savingUsername, setSavingUsername] = useState(false);
  const [postsCount, setPostsCount] = useState(null);
  const [listingsCount, setListingsCount] = useState(null);
  const [reviewsCount, setReviewsCount] = useState(null);

  useEffect(() => {
    // load profile document if displayName or photoURL missing
    let mounted = true;
    const loadProfile = async () => {
      if (!uid) return;
      try {
        const profileRef = doc(db, 'profile', uid);
        const snap = await getDoc(profileRef);
        if (snap.exists() && mounted) {
          const data = snap.data();
          if (data.username && !displayName) setDisplayName(data.username);
          if (data.photoURL) setPhotoURL(data.photoURL);
        }
      } catch (e) {
        console.error('Failed to load profile doc', e);
      }
    };
    loadProfile();
    return () => { mounted = false; };
  }, [uid]);

  // Load counts for posts, listings (products+services), and reviews for the current user
  useEffect(() => {
    if (!uid) return;
    let mounted = true;

    const loadCounts = async () => {
      try {
        // Posts count
        const postsQ = query(collection(db, 'posts'), where('authorId', '==', uid));
        const postsSnap = await getDocs(postsQ);
        if (mounted) setPostsCount(postsSnap.size);

        // Listings count (products + services)
        const productsQ = query(collection(db, 'products'), where('sellerId', '==', uid));
        const servicesQ = query(collection(db, 'services'), where('sellerId', '==', uid));
        const [prodSnap, servSnap] = await Promise.all([getDocs(productsQ), getDocs(servicesQ)]);
        const totalListings = (prodSnap?.size || 0) + (servSnap?.size || 0);
        if (mounted) setListingsCount(totalListings);

        // Reviews count: fetch reviews and filter those that belong to user's listings
        // Note: this fetches all reviews and filters client-side — acceptable for small datasets.
        const listingIds = [
          ...prodSnap.docs.map((d) => d.id),
          ...servSnap.docs.map((d) => d.id),
        ];

        if (listingIds.length === 0) {
          if (mounted) setReviewsCount(0);
        } else {
          const reviewsSnap = await getDocs(collection(db, 'reviews'));
          const matched = reviewsSnap.docs.filter((d) => listingIds.includes(d.data().productId));
          if (mounted) setReviewsCount(matched.length);
        }
      } catch (e) {
        console.warn('Failed to load profile counts', e);
        if (mounted) {
          setPostsCount(0);
          setListingsCount(0);
          setReviewsCount(0);
        }
      }
    };

    loadCounts();
    return () => { mounted = false; };
  }, [uid]);

  const pickImageAndUpload = async () => {
    if (!uid) return Alert.alert('Not signed in', 'Please sign in to update your profile');



    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert('Permission required', 'Permission to access photos is required to upload a profile picture.');
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    // new expo-image-picker returns { cancelled?: boolean, canceled?: boolean, assets?: [{ uri }] }
    if (res.canceled || res.cancelled) return;

    const uri = res.assets?.[0]?.uri;
    if (!uri) return Alert.alert('Upload failed', 'Could not read selected image URI.');

    try {
      setUploading(true);

      // Use FormData for robust uploads in React Native (Blob often fails)
      const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `${uid}-${Date.now()}.${fileExt}`;
      const filePath = `profile/${fileName}`;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      });

      const { error: uploadError } = await supabase.storage.from('profile').upload(filePath, formData, {
        cacheControl: '3600',
        upsert: true,
      });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('profile').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // save to firestore profile collection
      await setDoc(doc(db, 'profile', uid), {
        uid,
        photoURL: publicUrl,
        username: displayName || user?.displayName || '',
        updatedAt: serverTimestamp()
      }, { merge: true });

      setPhotoURL(publicUrl);
      Alert.alert('Success', 'Profile photo updated');
    } catch (e) {
      console.error('Upload failed', e);
      const msg = e?.message || String(e);
      if (msg.includes('Network request failed')) {
        Alert.alert('Upload failed', 'Network request failed — this is often caused by no internet on the device/emulator, or the file URI being inaccessible. Check your device network and try again.');
      } else {
        Alert.alert('Upload failed', msg);
      }
    } finally {
      setUploading(false);
    }
  };

  // logout removed — signOut flow intentionally removed per the change request

  const saveUsername = async () => {
    if (!uid) return Alert.alert('Not signed in', 'Please sign in to update your username');
    if (!displayName || displayName.trim().length === 0) return Alert.alert('Invalid username', 'Please enter a valid username');

    try {
      setSavingUsername(true);
      // save to firestore
      await setDoc(doc(db, 'profile', uid), {
        uid,
        username: displayName.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // update firebase auth profile so auth.currentUser.displayName is in sync
      try {
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: displayName.trim() });
        }
      } catch (e) {
        console.warn('Failed to update auth profile displayName', e);
      }

      Alert.alert('Saved', 'Username updated');
    } catch (e) {
      console.error('Failed to save username', e);
      Alert.alert('Failed', e.message || String(e));
    } finally {
      setSavingUsername(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account</Text>
        </View>
        {/* View account removed intentionally */}
      </View>

      

      <View style={styles.profileCard}>
        <View style={styles.topRow}>
          <View style={styles.avatarContainer}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{displayName?.charAt(0)?.toUpperCase() || 'U'}</Text>
              </View>
            )}

            <Pressable
              style={styles.avatarOverlay}
              onPress={pickImageAndUpload}
              accessibilityLabel="Change profile photo"
            >
              <Text style={styles.avatarOverlayText}>📷</Text>
            </Pressable>
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.name}>{displayName || 'User'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{listingsCount === null ? '…' : listingsCount}</Text>
                <Text style={styles.statLabel}>Listings</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{postsCount === null ? '…' : postsCount}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{reviewsCount === null ? '…' : reviewsCount}</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>
            </View>
          </View>
        </View>

        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display name"
          placeholderTextColor="#9CA3AF"
        />

        <View style={styles.actionsRow}>
          <Pressable
            onPress={saveUsername}
            disabled={savingUsername}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            {savingUsername ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Save</Text>}
          </Pressable>

          <Pressable
            onPress={pickImageAndUpload}
            disabled={uploading}
            style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
          >
            {uploading ? <ActivityIndicator color="#6501B5" /> : <Text style={styles.outlineButtonText}>Change Photo</Text>}
          </Pressable>
        </View>

        {/* Log out removed per request */}
      </View>

      {/* Logout confirmation modal removed */}

      <View style={styles.extraCard}>
        <Text style={styles.extraTitle}>Profile Tips</Text>
        <Text style={styles.extraBody}>Use a clear headshot so people recognise you. Keep your username friendly and professional.</Text>
      </View>
      
      {/* WhatsApp Channel promo */}
      <View style={styles.whatsappCard}>
        <View style={styles.whatsappRow}>
          <View style={styles.whatsappContent}>
            <Text style={styles.whatsappTitle}>Join Our WhatsApp Channel</Text>
            <Text style={styles.whatsappSubtitle}>Get instant updates and announcements</Text>
          </View>
          <Image
            source={require('../../assets/images/WhatsApp.png')}
            style={styles.whatsappImage}
            resizeMode="contain"
          />
        </View>

        <Pressable
          style={styles.whatsappButton}
          onPress={async () => {
            const url = 'https://tinyurl.com/4pt7xwfc'
            try {
              const supported = await Linking.canOpenURL(url)
              if (supported) await Linking.openURL(url)
              else Alert.alert('Cannot open link', url)
            } catch (e) {
              console.warn('Failed to open WhatsApp link', e)
              Alert.alert('Error', 'Failed to open the WhatsApp channel')
            }
          }}
        >
          <Text style={styles.whatsappButtonPlus}>+</Text>
          <Text style={styles.whatsappButtonText}>Follow Channel</Text>
        </Pressable>
      </View>

      {/* Contact Support promo */}
      <View style={styles.supportCard}>
        <View style={styles.supportRow}>
          <View style={styles.supportContent}>
            <Text style={styles.supportTitle}>Contact Support</Text>
            <Text style={styles.supportSubtitle}>Need help? Chat with our support team on WhatsApp</Text>
          </View>
          <Image
            source={require('../../assets/images/Downc.jpg')}
            style={styles.supportImage}
            resizeMode="contain"
          />
        </View>

        <Pressable
          style={styles.supportButton}
          onPress={async () => {
            const url = 'https://wa.link/0935w4'
            try {
              const supported = await Linking.canOpenURL(url)
              if (supported) await Linking.openURL(url)
              else Alert.alert('Cannot open link', url)
            } catch (e) {
              console.warn('Failed to open support WhatsApp link', e)
              Alert.alert('Error', 'Failed to open WhatsApp chat')
            }
          }}
        >
          <Text style={styles.supportChevron}>‹</Text>
          <Text style={styles.supportButtonText}>Chat Now</Text>
          <Text style={styles.supportChevron}>›</Text>
        </Pressable>
      </View>

      {/* YouTube promo */}
      <View style={styles.youtubeCard}>
        <View style={styles.youtubeRow}>
          <View style={styles.youtubeContent}>
            <Text style={styles.youtubeTitle}>Watch our YouTube channel</Text>
            <Text style={styles.youtubeSubtitle}>Watch our videos and tutorials to get the most out of Paddi Supa.</Text>
          </View>
          <Image
            source={require('../../assets/images/youtube.png')}
            style={styles.youtubeImage}
            resizeMode="contain"
          />
        </View>

        <Pressable
          style={styles.youtubeButton}
          onPress={async () => {
            const url = 'https://tinyurl.com/39z4wy4f'
            try {
              const supported = await Linking.canOpenURL(url)
              if (supported) await Linking.openURL(url)
              else Alert.alert('Cannot open link', url)
            } catch (e) {
              console.warn('Failed to open YouTube link', e)
              Alert.alert('Error', 'Failed to open YouTube')
            }
          }}
        >
          <Text style={styles.youtubeButtonText}>Watch Now</Text>
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB', padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtitle: { color: '#6B7280', marginTop: 4 },
  headerAction: { paddingVertical: 6, paddingHorizontal: 12 },
  headerActionText: { color: '#6B7280', fontWeight: '600' },
  profileCard: { backgroundColor: '#fff', borderRadius: 14, padding: 18, elevation: 3 },
  avatar: { width: 90, height: 90, borderRadius: 55 },
  avatarPlaceholder: { backgroundColor: '#E6E9F2', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 36, color: '#374151', fontWeight: '700' },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  infoCol: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginLeft:7 },
  email: { color: '#6B7280', marginTop: 4, marginLeft: 7 },
  statsRow: { flexDirection: 'row', marginTop: 8, marginLeft:9 },
  statItem: { marginRight: 18, alignItems: 'flex-start' },
  statValue: { fontWeight: '800', color: '#0F172A' },
  statLabel: { color: '#6B7280', fontSize: 12 },
  input: { width: '100%', borderColor: '#E5E7EB', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginTop: 14, color: '#0F172A' },
  actionsRow: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
  primaryButton: { flex: 1, backgroundColor: '#6501B5', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginRight: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  outlineButton: { flex: 1, borderWidth: 1, borderColor: '#6501B5', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginLeft: 8 },
  outlineButtonText: { color: '#6501B5', fontWeight: '700' },
  logoutButton: { marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#374151', fontWeight: '700' },
  avatarContainer: { position: 'relative', marginRight: 14, marginBottom: 6 },
  avatarOverlay: { position: 'absolute', right: -6, bottom: -6, backgroundColor: '#111827', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  avatarOverlayText: { color: '#fff', fontSize: 18 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.995 }] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '86%', backgroundColor: '#fff', borderRadius: 12, padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  modalBody: { color: '#6B7280', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginLeft: 8 },
  modalCancel: { backgroundColor: '#EEF2FF' },
  modalConfirm: { backgroundColor: '#EF4444' },
  modalCancelText: { color: '#374151', fontWeight: '700' },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
  extraCard: { marginTop: 20, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  extraTitle: { fontWeight: '700', marginBottom: 6 },
  extraBody: { color: '#6B7280' },
  whatsappCard: { marginTop: 14, backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 2, flexDirection: 'column' },
  whatsappRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  whatsappContent: { flex: 1, paddingRight: 12 },
  whatsappTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  whatsappSubtitle: { color: '#111213ff', marginTop: 6, fontSize: 13 },
  whatsappImage: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#fff' },
  whatsappButton: { marginTop: 12, backgroundColor: '#16A34A', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  whatsappButtonPlus: { color: '#ffffffff', fontSize: 18, fontWeight: '900', marginRight: 8 },
  whatsappButtonText: { color: '#ffffffff', fontWeight: '800' }
  ,
  supportCard: { marginTop: 14, backgroundColor: '#ffffffff', borderRadius: 12, padding: 14, elevation: 2, flexDirection: 'column' },
  supportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  supportContent: { flex: 1, paddingRight: 12 },
  supportTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  supportSubtitle: { color: '#6B7280', marginTop: 6, fontSize: 13 },
  supportImage: { width: 69, height: 69, borderRadius: 8, backgroundColor: '#ffffff07' },
  supportButton: { marginTop: 12, backgroundColor: '#16A34A', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  supportButtonText: { color: '#ffffffff', fontWeight: '800', marginHorizontal: 8 },
  supportChevron: { color: '#ffffffff', fontSize: 16, fontWeight: '900' }
  ,
  youtubeCard: { marginTop: 14, backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 2 },
  youtubeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  youtubeContent: { flex: 1, paddingRight: 12 },
  youtubeTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  youtubeSubtitle: { color: '#6B7280', marginTop: 6, fontSize: 13 },
  youtubeImage: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#fff' },
  youtubeButton: { marginTop: 12, backgroundColor: '#FF0000', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  youtubeButtonText: { color: '#fff', fontWeight: '800' }
});