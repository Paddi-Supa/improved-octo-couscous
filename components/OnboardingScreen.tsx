import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
      await AsyncStorage.setItem('hasOnboarded', 'true');
      // Navigate to the Sign-in screen
      
      onFinish();
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
            { backgroundColor: index === currentPage ? '#E74C3C' : '#BDC3C7' }, // Using red for active, gray for inactive
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
        {slides.map((slide) => (
          <View key={slide.key} style={styles.page}>
            <View style={styles.imageBox}>
                <Image source={slide.image} style={styles.illustration} resizeMode="contain" />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </View>
          </View>
        ))}
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
    backgroundColor: '#500343ff', // Light gray background for a clean look
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingTop: 50,
    alignItems: 'center',
  },
  // New Styles for Illustrations
  imageBox: {
    width: width * 1.0,
    height: width * 1.0, // Make the image area square
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 70,
    backgroundColor: '#fff', // White background for the image box
    borderRadius: 85,
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1.9,
    shadowRadius: 1,
    elevation: 8, // Android shadow
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  // ---
  textContainer: {
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 40, // As requested
    fontWeight: 'bold',
    color: '#ffffffff',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 17, // As requested
    color: '#ffffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Pagination & Nav
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#fff', // White bottom bar
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  skipButton: {
    minWidth: 80,
    padding: 10,
  },
  skipButtonText: {
    color: '#999',
    fontSize: 16,
  },
  nextButton: {
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: '#E74C3C', // A nice vibrant red
    borderRadius: 30,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
