import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const FollowingScreen = () => {
  const navigation: any = useNavigation()

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.badge}>Coming soon</Text>
        <Text style={styles.emoji}>✨</Text>
        <Text style={styles.title}>Following</Text>
        <Text style={styles.subtitle}>
          We're cooking up something fabulous — a personalized feed just for the people you follow.
          It'll be hotter than your coffee and sassier than your comments. Stay tuned!
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('ForYou')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Browse For You</Text>
        </TouchableOpacity>

        <Text style={styles.smallNote}>Prefer the unexpected? Check out the For You tab instead.</Text>
      </View>
    </View>
  )
}

export default FollowingScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  card: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 12
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20
  },
  primaryButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    marginTop: 6,
    minWidth: 180,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15
  },
  smallNote: {
    marginTop: 14,
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center'
  }
})