import React, { useState } from 'react';
import {
    Alert,
    ImageBackground,
    Linking,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Pressable onPress={() => setOpen(!open)} style={styles.faqItem} accessibilityRole="button">
      <View style={styles.faqRow}>
        <Text style={styles.faqQ}>{q}</Text>
        <Text style={styles.faqToggle}>{open ? '−' : '+'}</Text>
      </View>
      {open ? <Text style={styles.faqA}>{a}</Text> : null}
    </Pressable>
  )
}

export default function DeliveryPartners() {
  const { width } = useWindowDimensions()
  const imgWidth = Math.max(320, width - 48)
  const imgHeight = Math.round(imgWidth * 0.56)

  const handleJoin = async () => {
    const url = 'https://wa.link/0935w4'
    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) await Linking.openURL(url)
      else Alert.alert('Unable to open link', 'Please try again later.')
    } catch (e) {
      console.warn('Failed to open link', e)
      Alert.alert('Failed to open link', 'Please check your network or try again.')
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HERO */}
        <View style={styles.hero}>
          <View style={[styles.heroImageWrap, { height: imgHeight }]}> 
            <ImageBackground
              source={require('../../assets/images/delivery.jpg')}
              style={styles.heroImage}
              imageStyle={{ resizeMode: 'cover' }}
            />
          </View>

          <View style={styles.heroText}>
            <Text style={styles.h1}>Become a Delivery Partner</Text>
            <Text style={styles.h1Accent}>Help people deliver goods across all 6 campuses and earn on every trip</Text>

            <Text style={styles.lead}>
              Deliver packages, earn weekly payouts, and work flexible hours. We connect you with customers across the
              six campuses — you pick the rides you want.
            </Text>

            <View style={styles.ctaRow}>
              <Pressable style={styles.primaryCta} onPress={handleJoin} accessibilityRole="button">
                <Text style={styles.primaryCtaText}>🚚 Join as a Delivery Partner</Text>
              </Pressable>

              <Pressable
                style={styles.outlineCta}
                onPress={() => Alert.alert('Learn more', 'Coming Soon....')}
              >
                <Text style={styles.outlineCtaText}>Learn more</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* FEATURES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why partner with us?</Text>
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>⏱️</Text>
              <Text style={styles.featureTitle}>Flexible hours</Text>
              <Text style={styles.featureText}>Work when you want — mornings, evenings or weekends.</Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>💵</Text>
              <Text style={styles.featureTitle}>Weekly payouts</Text>
              <Text style={styles.featureText}>Fast and reliable payments for completed deliveries.</Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>📍</Text>
              <Text style={styles.featureTitle}>Multiple destinations</Text>
              <Text style={styles.featureText}>Deliver across all six campuses with straightforward routing.</Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>🎓</Text>
              <Text style={styles.featureTitle}>Support & training</Text>
              <Text style={styles.featureText}>Onboarding, safety tips and driver support when you need it.</Text>
            </View>
          </View>
        </View>

        {/* STEPS */}
        <View style={styles.sectionAlt}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={styles.stepsRow}>
            <View style={styles.stepCard}>
              <Text style={styles.stepNum}>1</Text>
              <Text style={styles.stepTitle}>Sign up</Text>
              <Text style={styles.stepText}>Register with your details and documentation.</Text>
            </View>

            <View style={styles.stepCard}>
              <Text style={styles.stepNum}>2</Text>
              <Text style={styles.stepTitle}>Accept tasks</Text>
              <Text style={styles.stepText}>Choose deliveries that fit your schedule and route.</Text>
            </View>

            <View style={styles.stepCard}>
              <Text style={styles.stepNum}>3</Text>
              <Text style={styles.stepTitle}>Deliver & earn</Text>
              <Text style={styles.stepText}>Complete deliveries and receive payouts weekly.</Text>
            </View>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By the numbers</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>Coming Soon...</Text>
              <Text style={styles.statLabel}>Deliveries / month</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>Coming Soon...</Text>
              <Text style={styles.statLabel}>Active partners</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>Coming Soon...</Text>
              <Text style={styles.statLabel}>Avg weekly earnings</Text>
            </View>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.sectionAlt}>
          <Text style={styles.sectionTitle}>Frequently asked questions</Text>
          <FaqItem q="What documents do I need?" a="A valid ID and contact details. We'll guide you through the rest during onboarding." />
          <FaqItem q="How often do I get paid?" a="Payouts are processed weekly to your bank or mobile money account." />
          <FaqItem q="Can I choose deliveries?" a="Yes — you select jobs that fit your schedule and route preferences." />
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, alignItems: 'stretch' },
  hero: { width: '100%', backgroundColor: '#F8FCFF', paddingVertical: 12, borderRadius: 12, marginBottom: 18 },
  heroImageWrap: { width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', elevation: 6, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 6 }, shadowRadius: 10 },
  heroImage: { width: '100%', height: '100%' },
  heroText: { paddingTop: 12 },
  h1: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  h1Accent: { fontSize: 15, fontWeight: '700', color: '#0B0B0B', marginTop: 6 },
  lead: { marginTop: 10, color: '#374151', fontSize: 15, lineHeight: 20 },
  ctaRow: { flexDirection: 'column', marginTop: 14, width: '100%' },
  primaryCta: { backgroundColor: '#6501b5', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 10, alignItems: 'center', width: '100%' },
  primaryCtaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  outlineCta: { borderColor: '#6501b5', borderWidth: 1, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, marginTop: 10, alignItems: 'center', width: '100%' },
  outlineCtaText: { color: '#6501b5', fontWeight: '800' },

  section: { width: '100%', marginTop: 18 },
  sectionAlt: { width: '100%', marginTop: 18, backgroundColor: '#FBFBFD', padding: 12, borderRadius: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 12 },

  features: { flexDirection: 'column' },
  featureItem: { width: '100%', marginBottom: 12, backgroundColor: '#fff', padding: 14, borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
  featureEmoji: { fontSize: 20 },
  featureTitle: { fontWeight: '800', marginTop: 8 },
  featureText: { color: '#6B7280', marginTop: 6, fontSize: 13 },

  stepsRow: { flexDirection: 'column' },
  stepCard: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 2 },
  stepNum: { fontSize: 16, fontWeight: '900', color: '#0B7CFE' },
  stepTitle: { fontWeight: '800', marginTop: 8 },
  stepText: { color: '#6B7280', marginTop: 6, fontSize: 13 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  statCard: { flex: 1, alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 10, marginRight: 8, elevation: 2 },
  statValue: { fontSize: 12, fontWeight: '900', color: '#0F172A' },
  statLabel: { color: '#6B7280', marginTop: 6, fontSize: 12 },

  faqItem: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginTop: 8 },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { fontWeight: '800' },
  faqToggle: { fontSize: 18, color: '#6501b5' },
  faqA: { marginTop: 8, color: '#6B7280' },
})