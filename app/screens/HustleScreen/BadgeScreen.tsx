import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const BadgeScreen = () => {
return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Text style={styles.iconEmoji}>🚚</Text>
        </View>

        <Text style={styles.title}>Request Delivery coming soon</Text>
        <Text style={styles.subtitle}>We are working on connecting verified delivery agents across all campuses.</Text>

        <View style={styles.noteWrap}>
          <Text style={styles.note}>We’re putting the finishing touches on this feature — check back soon or contact support for updates.</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb', justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconEmoji: { fontSize: 40, lineHeight: 48 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#000000ff', marginBottom: 12, textAlign: 'center' },
  noteWrap: { marginTop: 6, paddingHorizontal: 10 },
  note: { fontSize: 13, color: '#000000ff', textAlign: 'center' },
})

export default BadgeScreen