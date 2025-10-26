
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { supabase } from '../../utils/supabaseClient';

export default function Profile() {
  const router = useRouter();
  const user = auth.currentUser;
  const uid = user?.uid;

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || null);
  const [uploading, setUploading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // navigate to login screen (replace history)
      router.replace('/(auth)/LoginScreen');
    } catch (e) {
      console.error('Logout failed', e);
      Alert.alert('Logout failed', e.message || String(e));
    }
  };

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
      <View style={styles.header}>
        <Text style={styles.title}>Your Profile</Text>
        <Text style={styles.subtitle}>Manage your account and profile photo</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{displayName?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
          )}

          <Pressable style={styles.avatarOverlay} onPress={pickImageAndUpload} accessibilityLabel="Change profile photo">
            <Text style={styles.avatarOverlayText}>📷</Text>
          </Pressable>
        </View>

        <Text style={styles.name}>{displayName || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display name"
          placeholderTextColor="#9CA3AF"
        />

        <Pressable
          onPress={saveUsername}
          disabled={savingUsername}
          style={({ pressed }) => [styles.uploadButton, styles.saveButton, pressed && styles.pressed]}
        >
          {savingUsername ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>Save Username</Text>
          )}
        </Pressable>

        <Pressable
          onPress={pickImageAndUpload}
          disabled={uploading}
          style={({ pressed }) => [styles.uploadButton, pressed && styles.pressed]}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload / Change Photo</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => setShowLogoutModal(true)}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>

      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm logout</Text>
            <Text style={styles.modalBody}>Are you sure you want to log out?</Text>
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalConfirm]} onPress={() => { setShowLogoutModal(false); handleLogout(); }}>
                <Text style={styles.modalConfirmText}>Log out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.extraCard}>
        <Text style={styles.extraTitle}>Profile Tips</Text>
        <Text style={styles.extraBody}>Use a clear headshot so people recognise you. Keep your username friendly and professional.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB', padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtitle: { color: '#6B7280', marginTop: 6 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 20, alignItems: 'center', elevation: 3 },
  avatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 12 },
  avatarPlaceholder: { backgroundColor: '#E6E9F2', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 36, color: '#374151', fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '700', marginTop: 6, color: '#0F172A' },
  email: { color: '#6B7280', marginBottom: 12 },
  uploadButton: { marginTop: 10, backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  uploadButtonText: { color: '#fff', fontWeight: '700' },
  saveButton: { backgroundColor: '#10B981' },
  input: { width: '100%', borderColor: '#E5E7EB', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 12, color: '#0F172A' },
  logoutButton: { marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EF4444', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  logoutText: { color: '#EF4444', fontWeight: '700' },
  avatarContainer: { position: 'relative', marginBottom: 6 },
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
  extraBody: { color: '#6B7280' }
});