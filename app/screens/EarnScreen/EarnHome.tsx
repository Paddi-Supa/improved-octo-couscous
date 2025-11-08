import { useNavigation } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import { collection, doc, getDoc, onSnapshot, runTransaction, updateDoc } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { auth, db } from '../../../firebaseConfig'

const EarnHome = () => {
  const navigation: any = useNavigation()
  const [profile, setProfile] = useState<any>(null)
  const [wallet, setWallet] = useState<any>({ balance: 0 })
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadAll()
  }, [])

    const tasksRef = collection(db, 'tasks')
    const tasksUnsub = onSnapshot(tasksRef, (snap) => {
      const list: any[] = []
      snap.forEach((d) => {
        const data: any = d.data()

        // Helper to parse an array-based task entry. The user may provide arrays like
        // task1: [ ... ] containing a mix of title/description/image/reward/url in any order.
        const parseTaskArray = (arr: any[]) => {
          if (!Array.isArray(arr)) return null
          // attempt to heuristically find reward, url, image, and assign remaining to title/description
          let title = ''
          let description = ''
          let image: string | null = null
          let reward = 0
          let url: string | null = null

          const isNumberLike = (v: any) => !isNaN(Number(v)) && v !== '' && v !== null && v !== undefined
          const isUrlLike = (v: any) => typeof v === 'string' && (v.startsWith('https') || v.startsWith('www.') || v.includes('/') )
          const isImageLike = (v: any) => typeof v === 'string' && (/(\.jpg|\.jpeg|\.png|\.gif|\.webp)$/i.test(v) || v.startsWith('https') || v.includes('cdn') || v.includes('uploads'))

          // detect indexes
          const rewardIdx = arr.findIndex(isNumberLike)
          if (rewardIdx >= 0) reward = Number(arr[rewardIdx])
          const urlIdx = arr.findIndex((a,i) => i !== rewardIdx && isUrlLike(a))
          if (urlIdx >= 0) url = arr[urlIdx]
          const imageIdx = arr.findIndex((a,i) => i !== rewardIdx && i !== urlIdx && isImageLike(a))
          if (imageIdx >= 0) image = arr[imageIdx]

          const used = new Set<number>()
          if (rewardIdx >= 0) used.add(rewardIdx)
          if (urlIdx >= 0) used.add(urlIdx)
          if (imageIdx >= 0) used.add(imageIdx)

          const leftovers = arr.map((v,i) => ({ v, i })).filter(x => !used.has(x.i)).map(x => x.v)
          if (leftovers.length === 1) {
            title = String(leftovers[0] || '')
          } else if (leftovers.length >= 2) {
            // prefer first leftover as title, rest as description
            title = String(leftovers[0] || '')
            description = leftovers.slice(1).map((s:any) => String(s || '')).join(' ')
          }

          // final fallbacks
          if (!title && typeof arr[0] === 'string') title = arr[0]
          return { title, description, image, reward, url }
        }

        // normalize fields coming from the tasks DB so UI can rely on consistent keys
        // Support legacy flat fields (title, reward, description, image, url)
        // and new array-based fields like task1, task2 ...
        if (data.title || data.reward || data.description || data.image || data.url) {
          const normalized = {
            id: d.id,
            title: data.title || data.name || 'Untitled Task',
            reward: Number(data.reward) || 0,
            description: data.description || data.taskDescription || '',
            image: data.image || data.imageUrl || data.taskImage || null,
            url: data.url || data.link || null,
            available: data.available === undefined ? true : !!data.available,
          }
          if (normalized.available) list.push(normalized)
        } else {
          // look for array-based entries (task1, task2, any key starting with 'task')
          Object.keys(data).forEach((key) => {
            if (/^task/i.test(key) && Array.isArray(data[key])) {
              const parsed = parseTaskArray(data[key])
              if (parsed) {
                const normalized = {
                  id: `${d.id}_${key}`,
                  title: parsed.title || 'Untitled Task',
                  reward: Number(parsed.reward) || 0,
                  description: parsed.description || '',
                  image: parsed.image || null,
                  url: parsed.url || null,
                  available: true,
                }
                if (normalized.available) list.push(normalized)
              }
            }
          })
        }
      })
      setTasks(list)
    }, (err) => console.warn('tasks listener error', err))

  const openTaskUrl = async (task: any) => {
    try {
      if (!task?.url) return Alert.alert('No URL', 'This task does not have a URL to open')
      const supported = await Linking.canOpenURL(task.url)
      if (supported) {
        await Linking.openURL(task.url)
        // mark as opened so the Submit Proof button becomes active
        setOpenedIds((prev) => {
          const next = new Set(prev)
          next.add(task.id)
          return next
        })
      } else Alert.alert('Cannot open link', task.url)
    } catch (e) {
      console.warn('Failed to open task url', e)
      Alert.alert('Error', 'Failed to open task URL')
    }
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      const uid = auth.currentUser?.uid
      if (!uid) return

      // load profile
      const profSnap = await getDoc(doc(db, 'profile', uid))
      if (profSnap.exists()) setProfile(profSnap.data())

      // load wallet (assume doc id == uid)
      const walletSnap = await getDoc(doc(db, 'wallets', uid))
      if (walletSnap.exists()) {
        const w = walletSnap.data()
        setWallet(w)
        // populate local completedIds set from wallet.completedTasks if present
        const done = Array.isArray(w?.completedTasks) ? w.completedTasks : []
        setCompletedIds(new Set(done))
      } else setWallet({ balance: 0 })
    } catch (e) {
      console.warn('Failed to load earn home data', e)
    } finally {
      setLoading(false)
    }
  }

  const goToWalletProfile = () => navigation.navigate('WalletProfile')

  const pickAndUploadProof = async (task: any) => {
    try {
      if (completedIds.has(task.id)) {
        Alert.alert('Already completed', 'You have already completed this task.')
        return
      }
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) return Alert.alert('Permission needed', 'Camera roll permission is required')

  const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, base64: false })
  if ((res as any).canceled) return

  // upload to supabase storage
  const uri = (res as any).assets?.[0]?.uri
      if (!uri) return Alert.alert('No image', 'No image selected')

      setLoading(true)

      const filename = `${auth.currentUser?.uid}/${Date.now()}_${task.id}.jpg`

      // upload to Supabase Storage via REST using FormData (avoids blob usage)
      const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
      const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      // allow overriding bucket name via env; default to 'wallet'
      const SUPABASE_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_BUCKET || 'wallet'
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        Alert.alert('Configuration error', 'Supabase configuration is missing')
        setLoading(false)
        return
      }

      const form = new FormData()
      // in React Native, a file object for FormData uses { uri, name, type }
      const fileName = filename.split('/').pop() || `${Date.now()}.jpg`
      form.append('file', { uri, name: fileName, type: 'image/jpeg' } as any)

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(SUPABASE_BUCKET)}/${encodeURIComponent(filename)}`
      const resp = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
          // Note: Do not set Content-Type; fetch will set the multipart boundary
        },
        body: form,
      })

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '')
        console.warn('Supabase REST upload failed', resp.status, txt)
        Alert.alert('Upload failed', 'Failed to upload image to storage')
        setLoading(false)
        return
      }

      // Construct public URL for the uploaded object (public bucket or public access required)
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(SUPABASE_BUCKET)}/${encodeURIComponent(filename)}`

      // save completedTasks doc using a deterministic doc id (userId_taskId)
      const uid = auth.currentUser?.uid
      if (!uid) {
        Alert.alert('Not signed in', 'Please sign in to submit proof')
        setLoading(false)
        return
      }
      // No longer writing a separate completedTasks collection. We'll record completed task ids
      // inside the user's wallet document atomically while updating balance.
      const reward = Number(task.reward) || 0
      let newBalance: number | null = null
      try {
        if (!uid) {
          Alert.alert('Not signed in', 'Please sign in to submit proof')
          setLoading(false)
          return
        }
        console.warn('Processing proof for walletId=', uid)

        try {
          newBalance = await runTransaction(db, async (tx) => {
            const walletRef = doc(db, 'wallets', uid)
            const snap = await tx.get(walletRef)
            if (!snap.exists()) {
              // create wallet with initial balance and mark this task completed
              tx.set(walletRef, { balance: reward, userId: uid, completedTasks: [task.id] })
              return reward
            }
            const data = snap.data() || {}
            const completed = Array.isArray(data.completedTasks) ? data.completedTasks : []
            if (completed.includes(task.id)) {
              // signal to caller that task was already completed
              throw new Error('ALREADY_COMPLETED')
            }
            const current = Number(data.balance) || 0
            const next = current + reward
            const nextCompleted = Array.isArray(data.completedTasks) ? Array.from(new Set([...data.completedTasks, task.id])) : [task.id]
            tx.update(walletRef, { balance: next, userId: uid, completedTasks: nextCompleted })
            return next
          })
          // update local UI state immediately with new balance
          setWallet((prev: any) => ({ ...(prev || {}), balance: newBalance }))
        } catch (txErr: any) {
          // Log detailed Firestore error info
          console.warn('Wallet transaction failed', txErr?.code || txErr?.message, txErr)
          if (txErr?.message === 'ALREADY_COMPLETED') {
            Alert.alert('Already completed', 'You have already completed this task.')
            setLoading(false)
            return
          }
          Alert.alert('Wallet update failed', 'Your proof was uploaded, but updating your wallet failed. An admin will review your submission.')
          setLoading(false)
          return
        }
      } catch (e:any) {
        console.warn('Unexpected error processing proof', e)
        Alert.alert('Error', 'Failed to process proof')
        setLoading(false)
        return
      }

      // attempt to set task unavailable until admin re-enables; non-fatal if permission denied
      try {
        await updateDoc(doc(db, 'tasks', task.id), { available: false })
      } catch (taskErr: any) {
        console.warn('Failed to mark task unavailable (non-fatal)', taskErr?.code || taskErr?.message, taskErr)
        // continue; we don't want to fail the whole flow for this
      }

      Alert.alert('Success', `Task completed! ₦${reward} has been added to your wallet.`)

      // refresh data
      await loadAll()
      // mark completed locally to avoid race conditions
      setCompletedIds((prev) => {
        const next = new Set(prev)
        next.add(task.id)
        return next
      })
    } catch (e) {
      console.warn('Error submitting proof', e)
      Alert.alert('Error', 'Failed to submit proof')
    } finally {
      setLoading(false)
    }
  }

  const renderTask = ({ item }: { item: any }) => (
    <View style={styles.taskCard}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.taskImage} />
      ) : (
        <View style={styles.taskImagePlaceholder} />
      )}
      <View style={styles.taskContent}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
            {item.description ? <Text style={styles.taskDescription} numberOfLines={2}>{item.description}</Text> : null}
          </View>
          <View style={styles.rewardBadge}>
            <Text style={styles.rewardText}>₦{item.reward}</Text>
          </View>
        </View>

        <View style={styles.taskActions}>
          <TouchableOpacity style={[styles.openBtn, completedIds.has(item.id) && styles.disabledBtn]} onPress={() => openTaskUrl(item)} disabled={completedIds.has(item.id)}>
            <Text style={styles.openText}>{completedIds.has(item.id) ? 'Completed' : 'Open'}</Text>
          </TouchableOpacity>
          {!completedIds.has(item.id) ? (
            <TouchableOpacity style={[styles.submitBtn, !openedIds.has(item.id) && styles.submitDisabled]} onPress={() => pickAndUploadProof(item)} disabled={!openedIds.has(item.id)}>
              <Text style={[styles.submitText, !openedIds.has(item.id) && styles.submitTextDisabled]}>Submit Proof</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.completedBadge]}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Completed</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )

  if (loading) return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="large" color="#6d045b" />
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.profileWrap}>
          <Image source={ profile?.photoURL ? { uri: profile.photoURL } : require('../../../assets/images/default.png') } style={styles.avatar} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.username}>{profile?.username || 'Guest'}</Text>
            <Text style={styles.small}>Welcome back</Text>
          </View>
        </View>
      </View>

      <ImageBackground
        source={require('../../../assets/images/celebrate.jpg')}
        style={styles.walletCard}
        imageStyle={styles.walletBgImage}
      >
        <View style={styles.walletOverlay} />
        <View style={styles.walletCardContent}>
          <Text style={styles.walletLabel}>Wallet Balance</Text>
          <Text style={styles.walletAmount}>₦{wallet?.balance || 0}</Text>
          <TouchableOpacity style={styles.withdrawBtn} onPress={goToWalletProfile}>
            <Text style={styles.withdrawText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <View style={styles.tasksWrap}>
        <Text style={styles.sectionTitle}>Available Tasks</Text>
        {tasks.length === 0 ? (
          <Text style={{ color: '#666', marginTop: 12 }}>No tasks available right now. Check back later.</Text>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(t) => t.id}
            renderItem={renderTask}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        {/* Coming soon: Game Zone */}
        <View style={styles.comingCard}>
          <View style={styles.comingIconWrap}>
            <Text style={styles.comingIcon}>🎮</Text>
          </View>
          <View style={styles.comingContent}>
            <Text style={styles.comingTitle}>Game Zone — Coming soon</Text>
            <Text style={styles.comingSubtitle}>Game Zone coming soon where you can play and earn.</Text>
          </View>
        </View>

        {/* Coming soon: Creative Hub Feed */}
        <View style={styles.comingCard}>
          <View style={styles.comingIconWrap}>
            <Text style={styles.comingIcon}>🎨</Text>
          </View>
          <View style={styles.comingContent}>
            <Text style={styles.comingTitle}>Creative Hub — Coming soon</Text>
            <Text style={styles.comingSubtitle}>Where you can post content, exhibit your creative talent and get paid for it.</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB', padding: 16 },
  headerRow: { marginTop: 8, marginBottom: 18 },
  profileWrap: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eee' },
  username: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  small: { color: '#6B7280' },
  walletCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    alignItems: 'flex-start',
    // subtle elevation for both platforms
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    minHeight: 140,
    justifyContent: 'center',
    overflow: 'hidden'
  },
  walletBgImage: { borderRadius: 16, resizeMode: 'cover' },
  walletOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(76,29,149,0.18)', borderRadius: 16 },
  walletCardContent: { alignItems: 'flex-start', paddingHorizontal: 6 },
  walletLabel: { color: '#F3E8FF', opacity: 0.95, fontWeight: '600' },
  walletAmount: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 6 },
  withdrawBtn: { marginTop: 12, backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 10 },
  withdrawText: { color: '#4C1D95', fontWeight: '800' },
  tasksWrap: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: '#0F172A' },
  taskCard: { flexDirection: 'row', padding: 14, borderRadius: 14, backgroundColor: '#fff', marginBottom: 14, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 } },
  taskImage: { width: 96, height: 96, borderRadius: 10, backgroundColor: '#f0f0f0' },
  taskImagePlaceholder: { width: 96, height: 96, borderRadius: 10, backgroundColor: '#f5f5f7', borderWidth: 1, borderColor: '#eee' },
  taskContent: { flex: 1, paddingLeft: 14, justifyContent: 'center' },
  taskTitle: { fontWeight: '800', fontSize: 16, color: '#0f172a' },
  taskDescription: { marginTop: 6, color: '#6B7280', fontSize: 13 },
  taskReward: { marginTop: 6, color: '#10B981', fontWeight: '700' },
  rewardBadge: { backgroundColor: '#F2E9FF', borderWidth: 1, borderColor: '#E6D8FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  rewardText: { color: '#4C1D95', fontWeight: '800' },
  taskActions: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  openBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#6d045b', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 10 },
  openText: { color: '#6d045b', fontWeight: '700' },
  submitBtn: { backgroundColor: '#6d045b', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  submitText: { color: '#fff', fontWeight: '700' },
  submitDisabled: { backgroundColor: '#D1D5DB' /* gray */ },
  submitTextDisabled: { color: '#6B7280' },
  disabledBtn: { opacity: 0.6 },
  completedBadge: { backgroundColor: '#10B981', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  comingCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: '#fff', marginTop: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 4 } },
  comingIconWrap: { width: 54, height: 54, borderRadius: 10, backgroundColor: 'rgba(76,29,149,0.06)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  comingIcon: { fontSize: 24 },
  comingContent: { flex: 1 },
  comingTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  comingSubtitle: { color: '#6B7280', marginTop: 6, fontSize: 13 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' }
})

export default EarnHome