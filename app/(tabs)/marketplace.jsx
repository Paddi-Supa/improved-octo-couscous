import { MaterialCommunityIcons } from '@expo/vector-icons';
import Octicons from '@expo/vector-icons/Octicons';
import { createStackNavigator } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';
import { collection, getDocs } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebaseConfig';

import DeliveryPartners from '../../components/Marketplace/DeliveryPartners';
import FlashSales from '../../components/Marketplace/FlashSales';
import Header from '../../components/Marketplace/Header';
import HotDeals from '../../components/Marketplace/HotDeals';
import MainCategorySection from '../../components/Marketplace/MainCategorySection';
import NewArrivals from '../../components/Marketplace/NewArrivals';
import PaddiBoosters from '../../components/Marketplace/PaddiBoosters';
import QuickAccess from '../../components/Marketplace/QuickAccess';
import Slider from '../../components/Marketplace/Slider';
import TopSellers from '../../components/Marketplace/TopSellers';
import TrendingProducts from '../../components/Marketplace/TrendingProducts';
import TrendingService from '../../components/Marketplace/TrendingService';
import BadgeScreen from '../screens/HustleScreen/BadgeScreen';


// The 5 new screens you want to navigate to
import CategoryScreen from '../screens/MarketplaceScreen/CategoryScreen';
import ChatScreen from '../screens/MarketplaceScreen/ChatScreen';
import ProductDetailScreen from '../screens/MarketplaceScreen/ProductDetailScreen'; // Corrected import path
import SellerProfileScreen from '../screens/MarketplaceScreen/SellerProfileScreen';


// --- Step 1: Define your original Marketplace UI as a component ---
// This is your original code, now wrapped in a component named MarketplaceHome.

const MarketplaceHome = () => {
  const [aiModalVisible, setAiModalVisible] = useState(false);

  const openSupport = async () => {
    const url = 'https://wa.link/0935w4';
    try {
      // Try to open the link
      await Linking.openURL(url);
    } catch (err) {
      // Fallback: still attempt and ignore error
      console.warn('Failed to open support link', err);
    }
  };

  // Ads state
  const [ads, setAds] = useState([])
  const [adModalVisible, setAdModalVisible] = useState(false)
  const [activeAd, setActiveAd] = useState(null)

  const [refreshing, setRefreshing] = useState(false)

  // fetch ads (extracted so we can call it on pull-to-refresh)
  const fetchAds = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'ads'))
      const list = []
      snap.forEach(d => {
        const data = d.data() || {}
        const looksLikeAd = obj => obj && (obj.image || obj.imageUrl || obj.img || obj.title || obj.headline || obj.link || typeof obj === 'string')
        if (looksLikeAd(data)) list.push(data)
        Object.values(data).forEach(v => {
          if (Array.isArray(v)) v.forEach(item => list.push(item))
          else if (typeof v === 'object' && looksLikeAd(v)) list.push(v)
        })
      })
      console.log('Ads loaded from firestore, candidate count:', list.length)
      if (list.length === 0) {
        // still update ads state to empty in case we're refreshing
        setAds([])
        return
      }
      setAds(list)
      await maybeShowAd(list)
    } catch (e) {
      console.warn('Failed to load ads', e)
    }
  }, [maybeShowAd])

  useEffect(() => {
    let mounted = true
    // call fetchAds and ignore the result if unmounted
    fetchAds().catch(e => { if (mounted) console.warn('fetchAds error', e) })
    return () => { mounted = false }
  }, [fetchAds])

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true)
      await fetchAds()
    } catch (e) {
      console.warn('Refresh failed', e)
    } finally {
      // brief delay so refresh animation is visible even if load is very quick
      setTimeout(() => setRefreshing(false), 400)
    }
  }, [fetchAds])

  // normalize helper (handles string URLs and nested media objects)
  const normalize = (a) => {
    if (!a) return { image: null, title: null, description: null, link: null, _raw: a }
    if (typeof a === 'string') return { image: a, title: null, description: null, link: null, _raw: a }
    const imageField = a?.image || a?.imageUrl || a?.img || (a?.media && (a.media.url || a.media.image)) || null
    const image = (typeof imageField === 'string') ? imageField : (imageField && imageField.url) ? imageField.url : null
    return {
      image,
      title: a?.title || a?.headline || a?.name || null,
      description: a?.description || a?.desc || a?.body || null,
      link: a?.link || a?.url || null,
      _raw: a,
    }
  }

  // try to show an ad if the gating time has passed; picks a random ad (shuffle)
  const maybeShowAd = useCallback(async (listArg) => {
    try {
      const list = listArg || ads
      if (!list || list.length === 0) return
      const lastShownRaw = await SecureStore.getItemAsync('lastAdShownAt')
      const lastShown = lastShownRaw ? Number(lastShownRaw) : 0
      const now = Date.now()
      const FIVE_MIN = 5 * 60 * 1000
      if (!lastShown || (now - lastShown) >= FIVE_MIN) {
        // pick a random index
        const nextIndex = Math.floor(Math.random() * list.length)
        const rawAd = list[nextIndex]
        const ad = normalize(rawAd)
        console.log('Showing ad (shuffled) index', nextIndex, ad)
        setAdImageError(false)
        setActiveAd(ad)
        setAdModalVisible(true)
        await SecureStore.setItemAsync('lastAdShownAt', String(now))
        await SecureStore.setItemAsync('lastAdIndex', String(nextIndex))
      }
    } catch (e) {
      console.warn('maybeShowAd failed', e)
    }
  }, [ads])

  // when app becomes active (or when reloaded), re-check gating so ad can show even while inside the app
  useEffect(() => {
    const handler = (state) => {
      if (state === 'active') {
        maybeShowAd()
      }
    }
    const sub = AppState.addEventListener ? AppState.addEventListener('change', handler) : null
    return () => { if (sub && sub.remove) sub.remove() }
  }, [maybeShowAd])

  // track if ad image failed to load so we can show a fallback
  const [adImageError, setAdImageError] = useState(false)

  // scale animation for FAB press feedback
  const scale = useRef(new Animated.Value(1)).current;
  const scaleAi = useRef(new Animated.Value(1)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <Header />

        {/* Slider */}
        <Slider />

        {/* Quick Access */}
        <QuickAccess />

        {/* MainCategorySection */}
        <MainCategorySection />

        {/* Flash Sale */}
        <FlashSales />

        {/* New Arrivals */}
        <NewArrivals />
     
        {/* TrendingProducts */}
        <TrendingProducts />

        {/* TrendingService */}
        <TrendingService />

        {/* Top Sellers */}
        <TopSellers />

        {/* Hot Deals */}
        <HotDeals />

        

        
      </ScrollView>

      {/* AI Assistant Modal */}
      <Modal
        visible={aiModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.aiCard}>
            <Text style={styles.aiTitle}>Paddi Supa AI Assistant</Text>
            <Text style={styles.aiMessage}>Paddi Supa AI assistance coming soon — please stay tuned.</Text>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={() => setAiModalVisible(false)}
              accessibilityRole="button"
            >
              <Text style={styles.aiButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Popup Ad Modal */}
      <Modal
        visible={adModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAdModalVisible(false)}
      >
        <View style={styles.adOverlay}>
              <View style={styles.adCard}>
                {activeAd?.image && !adImageError ? (
                  <Image
                    source={{ uri: activeAd.image }}
                    style={styles.adImage}
                    onError={() => {
                      console.warn('Ad image failed to load:', activeAd?.image)
                      setAdImageError(true)
                    }}
                    onLoad={() => setAdImageError(false)}
                  />
                ) : (
                  // fallback placeholder when no image or it failed to load
                  <View style={[styles.adImage, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
                    {/* intentionally no 'Sponsored' label; prefer title only if present */}
                    {activeAd?.title ? <Text style={{ color: '#6B7280' }}>{activeAd.title}</Text> : null}
                  </View>
                )}
                {activeAd?.title ? <Text style={styles.adTitle}>{activeAd.title}</Text> : null}
                {activeAd?.description ? <Text style={styles.adDesc}>{activeAd.description}</Text> : null}
                {adImageError && activeAd?.image ? (
                  <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 12, textAlign: 'center' }}>Image failed to load</Text>
                ) : null}
                {/* Professional modal: small close button */}
                {/* replace close icon with a cancel mark */}
                <TouchableOpacity style={styles.adClose} onPress={() => setAdModalVisible(false)} accessibilityRole="button">
                  <MaterialCommunityIcons name="cancel" size={20} color="#374151" />
                </TouchableOpacity>
            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              {activeAd?.link ? (
                <TouchableOpacity style={styles.adCTA} onPress={() => { Linking.openURL(activeAd.link); setAdModalVisible(false); }}>
                  <Text style={styles.adCTAText}>Learn more</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={[styles.adCTA, { backgroundColor: '#eee', marginLeft: 8 }]} onPress={() => setAdModalVisible(false)}>
                <Text style={[styles.adCTAText, { color: '#333' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Assistant FAB */}
      <AnimatedTouchable
        activeOpacity={0.85}
        style={[styles.fabAi, { transform: [{ scale: scaleAi }] }]}
        onPress={() => setAiModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Paddi Supa AI assistant"
        onPressIn={() => Animated.spring(scaleAi, { toValue: 0.95, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleAi, { toValue: 1, useNativeDriver: true }).start()}
      >
        <MaterialCommunityIcons name="robot" size={27} color="white" />
      </AnimatedTouchable>

      {/* Floating Customer Service Button */}
      <AnimatedTouchable
        activeOpacity={0.85}
        style={[styles.fab, { transform: [{ scale }] }]}
        onPress={openSupport}
        accessibilityRole="button"
        accessibilityLabel="Customer service"
        onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      >
        <Octicons name="feed-discussion" size={28} color="white" />
      </AnimatedTouchable>
    </View>
  )
}

// --- Step 2: Create the Stack Navigator ---
const MarketplaceStack = createStackNavigator();

// --- Step 3: Define the Navigator and register all screens ---
const MarketplaceNavigator = () => {
  return (
    <MarketplaceStack.Navigator
      // Your original UI is now the first screen in the stack
      initialRouteName="MarketplaceHome"
      screenOptions={{
        headerShown: false, // Hides the header for all screens in this stack
      }}
    >
      {/* Register your original UI as the main screen */}
      <MarketplaceStack.Screen
        name="MarketplaceHome"
        component={MarketplaceHome}
      />
      {/* Full screen FlashSales route so QuickAccess can navigate here */}
      <MarketplaceStack.Screen name="FlashSales" component={FlashSales} />
      <MarketplaceStack.Screen name="PaddiBoosters" component={PaddiBoosters} />
      <MarketplaceStack.Screen name="DeliveryPartners" component={DeliveryPartners} />
      <MarketplaceStack.Screen name="BadgeScreen" component={BadgeScreen} />


      {/* Register the other 4 screens you can navigate to */}
      <MarketplaceStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <MarketplaceStack.Screen name="SellerProfile" component={SellerProfileScreen} />
      <MarketplaceStack.Screen name="ChatScreen" component={ChatScreen} />
      <MarketplaceStack.Screen name="CategoryScreen" component={CategoryScreen} />      
      
    </MarketplaceStack.Navigator>
  );
};

// --- Step 4: Export the Stack Navigator as the default for this file ---
export default MarketplaceNavigator;

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    bottom: Platform.OS === 'ios' ? 34 : 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6501B5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.18 : 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  fabAi: {
    position: 'absolute',
    right: 18,
    bottom: Platform.OS === 'ios' ? 110 : 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6501B5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.12 : 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  aiCard: { width: '86%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' },
  aiTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  aiMessage: { color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  aiButton: { backgroundColor: '#6501B5', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  aiButtonText: { color: '#fff', fontWeight: '700' },
  adOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  // make card background transparent so the overlay shows through
  adCard: { width: '90%', maxWidth: 420, backgroundColor: 'transparent', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 10 },
  adClose: { position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', color: '#cc0f0fff'  },
  adImage: { width: '100%', height: 180, borderRadius: 10, marginBottom: 12, resizeMode: 'cover' },
  adTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  adDesc: { color: '#ffffff11', marginTop: 8, textAlign: 'center' },
  adCTA: { backgroundColor: '#6501B5', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  adCTAText: { color: '#fff', fontWeight: '700' },
});