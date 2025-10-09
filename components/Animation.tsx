import LottieView from 'lottie-react-native';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

interface AnimationProps {
  onAnimationFinish: () => void;
}

export default function Animation({ onAnimationFinish }: AnimationProps) {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    // We use a ref to ensure we can control the animation directly.
    // The animation will start playing as soon as the component mounts.
    animationRef.current?.play();
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        ref={animationRef}
        style={StyleSheet.absoluteFillObject}
        source={require('../assets/lottie/Splash-asset.json')}
        loop={false} // We don't want it to loop
        autoPlay={false} // We control playback manually in useEffect
        // This function will be called once the animation is complete
        resizeMode="cover" // This will make the animation cover the whole screen
        onAnimationFinish={onAnimationFinish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});