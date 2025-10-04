import AsyncStorage from '@react-native-async-storage/async-storage'; // Or import * as SecureStore from 'expo-secure-store';
import React, { useRef, useState } from 'react';
import { Dimensions, ImageBackground, NativeSyntheticEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onFinish: () => void;
}

const slides = [
  {
    key: '1',
    title: 'WELCOME TO PADDI SUPA APP',
    subtitle: 'Your ultimate student exclusive campus ecosystem to monetize your skills,connect,earn and build your campus business.',
    image: require('../assets/onboardingasset/onboarding1.jpg'), // Make sure you have these images in your assets folder
  },
  {
    key: '2',
    title: 'FIND YOUR NEEDS',
    subtitle: 'Discover products and services shared by students on campus. Everything you need is just a tap away.',
    image: require('../assets/onboardingasset/onboarding2.jpg'),
  },
  {
    key: '3',
    title: 'START YOUR HUSTLES',
    subtitle: 'List your products or services shared in minutes, start your campus business and connect with buyers instantly.',
    image: require('../assets/onboardingasset/onboarding3.jpg'),
  },
  {
    key: '4',
    title: 'Stay Connected',
    subtitle: 'Chat with friends and share your experiences.',
    image: require('../assets/onboardingasset/onboarding4.jpg'),
  },
  {
    key: '5',
    title: 'Earn Rewards',
    subtitle: 'Get paid for tasks and doing what you love. Join weekly challenges and monetize your creative talent.',
    image: require('../assets/onboardingasset/onboarding5.jpg'),
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const handlePageScroll = (e: NativeSyntheticEvent<{ position: number }>) => {
    // This event gives us the position. We can use it to determine the current page.
    setCurrentPage(e.nativeEvent.position);
  };

  const goToNextPage = () => {
    if (currentPage < slides.length - 1) {
      pagerRef.current?.setPage(currentPage + 1);
    } else {
      // This is the last slide, so the "Next" button becomes "Get Started"
      handleFinishOnboarding();
    }
  };

  const handleFinishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasOnboarded', 'true');
      // If using SecureStore:
      // await SecureStore.setItemAsync('hasOnboarded', 'true');
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
            { backgroundColor: index === currentPage ? '#fff' : 'rgba(255, 0, 149, 0.88)' },
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
        {slides.map((slide, index) => (
          <View key={slide.key} style={styles.page}>
            <ImageBackground source={slide.image} style={styles.imageBackground} resizeMode="cover" >
              <View style={styles.overlay} /> 
              <View style={styles.textContainer}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
                {renderPaginationDots()}
              </View>
            </ImageBackground>
          </View>
        ))}
      </PagerView>

      <View style={styles.bottomNav}>
        {/* You can add a 'Skip' button here if you want */}
        {currentPage > 0 && (
            <TouchableOpacity onPress={() => pagerRef.current?.setPage(currentPage - 1)} style={styles.navButton}>
                <Text style={styles.navButtonText}>Back</Text>
            </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={goToNextPage} style={styles.navButton}>
          <Text style={styles.navButtonText}>
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
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end', // Aligns text to the bottom
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)', // Semi-transparent black overlay
  },
  textContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: height * 0.20, // Adjust vertical position of text
    alignItems: 'center',
    zIndex: 1, // Ensure text is above overlay
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22, // Improves readability for multi-line subtitles
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20, // Space between text and dots
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: 'rgba(247, 9, 187, 0.2)', 
    borderRadius: 20,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 25,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
