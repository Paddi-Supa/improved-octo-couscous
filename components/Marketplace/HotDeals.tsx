import { useNavigation } from '@react-navigation/native'
import { collection, getDocs, getFirestore, orderBy, query } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

const { width } = Dimensions.get('window')

export default function HotDeals() {
  const [items, setItems] = useState<any[]>([])
  const db = getFirestore()
  const navigation: any = useNavigation()

  useEffect(() => {
    let mounted = true

    const fetchAll = async () => {
      try {
        const qProd = query(collection(db, 'products'), orderBy('timestamp', 'desc'))
        const qServ = query(collection(db, 'services'), orderBy('timestamp', 'desc'))

        const [prodSnap, servSnap] = await Promise.all([getDocs(qProd), getDocs(qServ)])

        const prods = prodSnap.docs.map((d: any) => ({ id: d.id, type: 'product', ...d.data() }))
        const servs = servSnap.docs.map((d: any) => ({ id: d.id, type: 'service', ...d.data() }))

        const combined = [...prods, ...servs].map((it: any) => ({ ...it }))

        // sort by timestamp if present, newest first
        combined.sort((a: any, b: any) => {
          const ta = a.timestamp?.toMillis ? a.timestamp.toMillis() : a.timestamp || 0
          const tb = b.timestamp?.toMillis ? b.timestamp.toMillis() : b.timestamp || 0
          return tb - ta
        })

        if (mounted) setItems(combined)
      } catch (e) {
        console.warn('HotDeals fetch error', e)
        if (mounted) setItems([])
      }
    }

    fetchAll()
    return () => {
      mounted = false
    }
  }, [])

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const image = item.image || (item.images && item.images[0]) || null
    const title = item.productName || item.serviceTitle || item.title || item.name || 'Untitled'
    const price = item.price ?? item.discountPrice ?? null

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id, type: item.type })}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={[styles.image, { backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#777' }}>No image</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {price != null ? <Text style={styles.price}>₦{Number(price).toLocaleString()}</Text> : null}
          <Text style={styles.badge}>{item.type === 'service' ? 'Service' : 'Product'}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hot Deals</Text>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(i) => `${i.type}-${i.id}`}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        // Workaround: disable inner scrolling when nested inside a vertical ScrollView
        // so the outer ScrollView handles scrolling and we avoid VirtualizedList nesting issues.
        scrollEnabled={false}
        nestedScrollEnabled={false}
      />
    </View>
  )
}

const GAP = 12
const CARD_WIDTH = (width - GAP * 3) / 2

const styles = StyleSheet.create({
  container: { backgroundColor: '#f6f7fb', paddingHorizontal: 12, paddingTop: 6 },
  header: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 8, paddingLeft: 4 },
  list: { paddingBottom: 24 },
  card: {
    width: CARD_WIDTH,
    marginRight: GAP,
    marginBottom: GAP,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  image: { width: '100%', height: 120, resizeMode: 'cover' },
  cardBody: { padding: 10 },
  title: { fontSize: 14, fontWeight: '700', color: '#111' },
  price: { marginTop: 6, color: '#6c63ff', fontWeight: '700' },
  badge: { marginTop: 8, fontSize: 11, color: '#6b7280' },
})