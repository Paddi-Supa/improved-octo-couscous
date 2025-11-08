import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onFinish: () => void;
}

// 1. UPDATE THIS ARRAY WITH YOUR IMAGE PATHS
const slides = [
  {
    key: '1',
    image: require('../assets/onboardingasset/a1.png'), // Replace with your file name
    title: 'Welcome to Paddi Supa App',
    subtitle: 'Your Ultimate student exclusive ecosystem to Connect, Earn, Hustle and Grow your Campus Business.',
  },
  {
    key: '2',
    image: require('../assets/onboardingasset/a2.png'), // Replace with your file name
    title: 'Discover products and listings near you',
    subtitle: 'Your needs are just a tap away with location-based searching.',
  },
  {
    key: '3',
    image: require('../assets/onboardingasset/a3.png'), // Replace with your file name
    title: 'List your products and services in minutes',
    subtitle: 'Instantly connect with potential buyers and start selling easily.',
  },
  {
    key: '4',
    image: require('../assets/onboardingasset/a4.png'), // Replace with your file name
    title: 'Connect with community and chat',
    subtitle: 'Share ideas, ask questions, and chat privately with other students.',
  },
  {
    key: '5',
    image: require('../assets/onboardingasset/a5.png'), // Replace with your file name
    title: 'Earn money by doing tasks and what you love',
    subtitle: 'Unlock new income streams by completing task, offering your unique skills and services.',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  // Animated values per slide for subtle scale + fade effect
  const animValsRef = useRef<Animated.Value[]>(slides.map((s, i) => new Animated.Value(i === 0 ? 1 : 0.9)));
  const router = useRouter();

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = slides.map((_, i) => {
      const toValue = i === currentPage ? 1 : 0.9;
      return Animated.timing(animValsRef.current[i], {
        toValue,
        duration: 300,
        useNativeDriver: true,
      });
    });
    Animated.parallel(animations).start();
  }, [currentPage]);

  const handlePageScroll = (e: any) => {
    setCurrentPage(e.nativeEvent.position);
  };

  const goToNextPage = () => {
    if (currentPage < slides.length - 1) {
      pagerRef.current?.setPage(currentPage + 1);
    } else {
      handleFinishOnboarding();
    }
  };

  const goToSkip = () => {
    // Optionally set a flag that the user skipped, but for now, it's the same as finishing
    handleFinishOnboarding();
  };

  const handleFinishOnboarding = async () => {
    try {
      // Sets the flag so the user doesn't see this screen again
      await SecureStore.setItemAsync('hasOnboarded', 'true');
      // Navigate to the Sign-in screen
      console.log('[Onboarding] finished — calling onFinish');
      onFinish();
      // Explicitly navigate to the Login screen so we don't rely solely on stored flags
      try {
        router.replace('/(auth)/LoginScreen');
      } catch (navErr) {
        console.warn('Failed to navigate to login from onboarding:', navErr);
      }
    } catch (error) {
      console.error('Error setting onboarding flag:', error);
    }
  };

  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            { backgroundColor: index === currentPage ? '#6501b5' : '#BDC3C7' }, // Using red for active, gray for inactive
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <PagerView
        style={styles.pagerView}
        initialPage={0}
        ref={pagerRef}
        onPageSelected={handlePageScroll}
      >
        {slides.map((slide, idx) => {
          const anim = animValsRef.current[idx];
          const scale = anim;
          const opacity = anim.interpolate({ inputRange: [0.9, 1], outputRange: [0.85, 1] });
          return (
            <View key={slide.key} style={styles.page}>
              <View style={styles.imageBox}>
                <Animated.View style={[styles.animatedWrapper, { transform: [{ scale }], opacity }]}> 
                  <Image source={slide.image} style={styles.illustration} resizeMode="contain" />
                </Animated.View>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
              </View>
            </View>
          )
        })}
      </PagerView>

  
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={goToSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>

        {renderPaginationDots()}
        
        <TouchableOpacity onPress={goToNextPage} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>
            {currentPage === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6501B5', // brand purple base
    paddingTop: -17,
  },
  pagerView: {
    flex: 1,

  },
  page: {
    flex: 1,
    paddingTop: 18,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  // New Styles for Illustrations
  imageBox: {
    width: width * 0.86,
    height: width * 0.86,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17,
    marginTop: 160,
    backgroundColor: '#fff', // White background for the image box
    borderRadius: 24,
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8, // Android shadow
  },
  illustration: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  animatedWrapper: {
    width: '96%',
    height: '96%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ---
  textContainer: {
    paddingHorizontal: 28,
    alignItems: 'center',
    marginTop: 4,
  },
  title: {
    fontSize: 35,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: 'thin',
    color: '#F3EAF0',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Pagination & Nav
  bottomNav: {
    position: 'absolute',
  // raise a bit more to avoid overlapping device gesture bar / nav
  // increased from previous values to give extra clearance
  bottom: Platform.OS === 'ios' ? 64 : 54,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 72,
    backgroundColor: '#FFFFFF', // white pill
    borderRadius: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 7,
    marginHorizontal: 8,
    backgroundColor: '#E0E0E0',
  },
  skipButton: {
    minWidth: 80,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  skipButtonText: {
    color: '#6d045b',
    fontSize: 15,
    fontWeight: '700',
  },
  nextButton: {
    minWidth: 126,
    paddingVertical: 14,
    paddingHorizontal: 26,
    backgroundColor: '#6501b5',
    borderRadius: 30,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default OnboardingScreen;
