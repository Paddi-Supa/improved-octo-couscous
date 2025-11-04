import { useNavigation } from '@react-navigation/native';
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
  const [open, setOpen] = useState(false);
  return (
    <Pressable onPress={() => setOpen(!open)} style={styles.faqItem} accessibilityRole="button">
      <View style={styles.faqRow}>
        <Text style={styles.faqQ}>{q}</Text>
        <Text style={styles.faqToggle}>{open ? '−' : '+'}</Text>
      </View>
      {open ? <Text style={styles.faqA}>{a}</Text> : null}
    </Pressable>
  );
}

export default function PaddiBoosters() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  // mobile-first content sizing
  const contentPadding = 24;
  const imgWidth = Math.min(720, Math.max(320, width - contentPadding * 2));
  const imgHeight = Math.round(imgWidth * 0.56);

  const handleJoin = async () => {
    const url = 'https://chat.whatsapp.com/J01TkOJy6FWExMbhBTREul?mode=wwt';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Unable to open link', 'Please try again later.');
    } catch (e) {
      console.warn('Failed to open join link', e);
      Alert.alert('Failed to open link', 'Please check your network or try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HERO - mobile single column */}
        <View style={styles.hero}>
          <View style={styles.heroInner}>
            <View style={[styles.heroImageWrap, { height: imgHeight }]}>
              <ImageBackground
                source={require('../../assets/images/paddi.png')}
                style={styles.heroImage}
                imageStyle={{ resizeMode: 'cover' }}
              />
            </View>

            <View style={styles.heroText}>
              <Text style={styles.h1}>Make Money Online</Text>
              <Text style={styles.h1Accent}>by joining Paddi Boosters as an affiliate</Text>

              <Text style={styles.lead}>
                Set your own hours, earn competitive commission, and join a supportive community of affiliate
                marketers.
              </Text>

              <View style={styles.ctaRow}>
                <Pressable style={styles.primaryCta} onPress={handleJoin} accessibilityRole="button">
                  <Text style={styles.primaryCtaText}>🚀 Join Paddi Boosters</Text>
                </Pressable>

                <Pressable
                  style={styles.outlineCta}
                  onPress={() => Alert.alert('Learn more', 'Coming Soon.....')}
                >
                  <Text style={styles.outlineCtaText}>Learn more</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* BENEFITS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why join Paddi Boosters?</Text>
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>⏰</Text>
              <Text style={styles.featureTitle}>Flexible hours</Text>
              <Text style={styles.featureText}>Work when you want — mornings, evenings or weekends.</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>💸</Text>
              <Text style={styles.featureTitle}>Competitive commission</Text>
              <Text style={styles.featureText}>Earn commission for every successful referral.</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>📈</Text>
              <Text style={styles.featureTitle}>Growth support</Text>
              <Text style={styles.featureText}>Get training, templates and community backing.</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>🔒</Text>
              <Text style={styles.featureTitle}>Trusted platform</Text>
              <Text style={styles.featureText}>Reliable payouts and a simple onboarding flow.</Text>
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
              <Text style={styles.stepText}>Register and get your unique referral link.</Text>
            </View>
            <View style={styles.stepCard}>
              <Text style={styles.stepNum}>2</Text>
              <Text style={styles.stepTitle}>Share</Text>
              <Text style={styles.stepText}>Share links on social media or directly with customers.</Text>
            </View>
            <View style={styles.stepCard}>
              <Text style={styles.stepNum}>3</Text>
              <Text style={styles.stepTitle}>Earn</Text>
              <Text style={styles.stepText}>Earn commission for purchases via your link.</Text>
            </View>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By the numbers</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>Coming Soon...</Text>
              <Text style={styles.statLabel}>Active boosters</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>Coming Soon...</Text>
              <Text style={styles.statLabel}>Paid commissions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>Coming Soon...</Text>
              <Text style={styles.statLabel}>Monthly conversions</Text>
            </View>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.sectionAlt}>
          <Text style={styles.sectionTitle}>Frequently asked questions</Text>
          <FaqItem q="How do I get paid?" a="Payouts are scheduled monthly and you can receive funds via bank transfer or mobile money where supported." />
          <FaqItem q="Is there a joining fee?" a="No — joining Paddi Boosters is free. You only need to register and start sharing." />
          <FaqItem q="Can I promote anywhere?" a="Yes. You can promote via social media, WhatsApp groups, or private messages using your referral links." />
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, alignItems: 'stretch' },
  hero: { width: '100%', backgroundColor: '#FAF7FF', paddingVertical: 16, borderRadius: 12, marginBottom: 18 },
  heroInner: { flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' },
  heroImageWrap: { width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', elevation: 6, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 6 }, shadowRadius: 10 },
  heroImage: { width: '100%', height: '100%' },
  heroText: { paddingTop: 14, paddingHorizontal: 4 },
  h1: { fontSize: 32, fontWeight: '900', color: '#6501b5' },
  h1Accent: { fontSize: 19, fontWeight: '700', color: '#0B0B0B', marginTop: 6 },
  lead: { marginTop: 10, color: '#374151', fontSize: 15, lineHeight: 20 },
  ctaRow: { flexDirection: 'column', marginTop: 14, width: '100%' },
  primaryCta: { backgroundColor: '#6501B5', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 10, alignItems: 'center', width: '100%' },
  primaryCtaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  outlineCta: { borderColor: '#6501B5', borderWidth: 1, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, marginTop: 10, alignItems: 'center', width: '100%' },
  outlineCtaText: { color: '#6501B5', fontWeight: '800' },

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
  stepNum: { fontSize: 20, fontWeight: '900', color: '#6501B5' },
  stepTitle: { fontWeight: '800', marginTop: 8 },
  stepText: { color: '#6B7280', marginTop: 6, fontSize: 13 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  statCard: { flex: 1, alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 10, marginRight: 8, elevation: 2 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  statLabel: { color: '#6B7280', marginTop: 6, fontSize: 12 },

  faqItem: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginTop: 8 },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { fontWeight: '800' },
  faqToggle: { fontSize: 18, color: '#6501B5' },
  faqA: { marginTop: 8, color: '#6B7280' },
});