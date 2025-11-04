import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const BadgeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Image
            source={require('../../../assets/images/coming.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Coming soon</Text>
        <Text style={styles.subtitle}>This feature will be released soon.</Text>

        <View style={styles.noteWrap}>
          <Text style={styles.note}>We’re putting the finishing touches on this feature — stay tuned.</Text>
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
    paddingVertical: 28,
    paddingHorizontal: 20,
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
    backgroundColor: '#eef8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: { width: 94, height: 94 },
  title: { fontSize: 20, fontWeight: '700', color: '#0e0e0fff', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#0d0d0eff', marginBottom: 12 },
  noteWrap: { marginTop: 6, paddingHorizontal: 10 },
  note: { fontSize: 13, color: '#000000ff', textAlign: 'center' },
})

export default BadgeScreen