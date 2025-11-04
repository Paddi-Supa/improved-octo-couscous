import { useNavigation } from '@react-navigation/native'
import { collection, getDocs, getFirestore, limit, orderBy, query } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function TopSellers() {
  const [items, setItems] = useState<any[]>([])
  const navigation: any = useNavigation()
  const db = getFirestore()

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        // fetch recent products (limit 12)
        const productsQ = query(collection(db, 'products'), orderBy('timestamp', 'desc'), limit(12))
        const prodSnap = await getDocs(productsQ)
        const products = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

        // fetch all reviews and compute per-product aggregates
        const reviewsSnap = await getDocs(collection(db, 'reviews'))
        const reviews = reviewsSnap.docs.map((d) => d.data())

        const enriched = products.map((p) => {
          const rs = reviews.filter((r: any) => r.productId === p.id)
          const count = rs.length
          const avg = count > 0 ? rs.reduce((s: number, r: any) => s + (Number(r.rating) || 0), 0) / count : 0
          return { ...p, averageRating: avg, reviewsCount: count }
        })

        // only include items with average rating >= 2.0
        const filtered = enriched.filter((e) => (e.averageRating || 0) >= 2)

        // sort by average rating then by reviews count
        filtered.sort((a, b) => {
          if ((b.averageRating || 0) === (a.averageRating || 0)) return (b.reviewsCount || 0) - (a.reviewsCount || 0)
          return (b.averageRating || 0) - (a.averageRating || 0)
        })

        if (mounted) setItems(filtered)
      } catch (e) {
        console.error('Error fetching top sellers:', e)
      }
    }

    fetchData()
    return () => {
      mounted = false
    }
  }, [])

  const renderStars = (avg: number) => {
    const rating = Math.max(0, Math.min(5, Number(avg) || 0))
    const full = Math.floor(rating)
    const half = rating - full >= 0.5
    const empty = 5 - full - (half ? 1 : 0)
    return (
      <Text style={styles.stars}>
        {'★'.repeat(full)}{half ? '☆' : ''}{'☆'.repeat(empty)}
      </Text>
    )
  }

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.images?.[0] }} style={styles.image} />
      <View style={styles.textBox}>
        <Text style={styles.name} numberOfLines={1}>
          {item.productName}
        </Text>
        <Text style={styles.price}>₦{item.price}</Text>

        <View style={styles.ratingRow}>
          <Text style={styles.avgText}>{item.averageRating ? item.averageRating.toFixed(1) : '0.0'}</Text>
          <Text style={styles.reviewsText}> ({item.reviewsCount || 0} reviews)</Text>
        </View>

        {renderStars(item.averageRating)}
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.wrapper}>
      <Text style={styles.header}>Top Sellers</Text>
      <FlatList
        data={items}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 12, paddingTop: 6, backgroundColor: '#f6f7fb', paddingLeft: 4 },
  header: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 8, paddingLeft: 16, marginTop: -30 },
  listContent: { paddingHorizontal: 8, paddingBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: 12,
    width: 160,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  image: { width: '100%', height: 110 },
  textBox: { padding: 8 },
  name: { fontSize: 14, fontWeight: '700', color: '#000' },
  price: { fontSize: 13, color: '#6c63ff', marginTop: 6, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  avgText: { fontWeight: '800', marginRight: 6 },
  reviewsText: { color: '#6b7280', fontSize: 12 },
  stars: { marginTop: 6, color: '#FFD700' },
})