import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { Dimensions, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const { width, height } = Dimensions.get('window')

const EarnMainScreen = () => {
  const navigation: any = useNavigation()

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../assets/images/money.png')}
        resizeMode="cover"
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
        <View style={styles.overlay} />

        <View style={styles.cardWrap}>
          <Text style={styles.title}>Welcome to Paddi Earn</Text>
          <Text style={styles.subtitle}>
            Make quick cash by completing simple tasks and doing what you love.
            Earn by sharing skills, completing gigs, and engaging with short tasks.
          </Text>

          <TouchableOpacity
            style={styles.proceedButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('EarnHome')}
          >
            <Text style={styles.proceedText}>Proceed to Earn</Text>
          </TouchableOpacity>
        </View>

      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6d045b', // purple base
  },
  backgroundImage: {
    flex: 1,
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageStyle: {
    opacity: 0.5,
    // keep image from stretching too much
    width: width * 1.0,
    height: height * 1.0,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(109,4,91,0.22)'
  },
  cardWrap: {
    width: '86%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18
  },
  proceedButton: {
    backgroundColor: '#6d045b',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    minWidth: 180,
    alignItems: 'center'
  },
  proceedText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15
  }
})

export default EarnMainScreen