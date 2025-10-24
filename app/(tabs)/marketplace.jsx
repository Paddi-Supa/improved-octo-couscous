import { createStackNavigator } from '@react-navigation/stack';
import { ScrollView } from 'react-native';

// Your existing components

import Header from '../../components/Marketplace/Header';
import MainCategorySection from '../../components/Marketplace/MainCategorySection';
import QuickAccess from '../../components/Marketplace/QuickAccess';
import Slider from '../../components/Marketplace/Slider';
import TrendingProducts from '../../components/Marketplace/TrendingProducts';
import TrendingService from '../../components/Marketplace/TrendingService';

// The 5 new screens you want to navigate to
import CategoryScreen from '../screens/MarketplaceScreen/CategoryScreen';
import ChatScreen from '../screens/MarketplaceScreen/ChatScreen';
import ProductDetailScreen from '../screens/MarketplaceScreen/ProductDetailScreen'; // Corrected import path
import SellerProfileScreen from '../screens/MarketplaceScreen/SellerProfileScreen';


// --- Step 1: Define your original Marketplace UI as a component ---
// This is your original code, now wrapped in a component named MarketplaceHome.




const MarketplaceHome = () => {
  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Header />

      {/* Slider */}
      <Slider />

      {/* Quick Access */}
      <QuickAccess />

      {/* MainCategorySection */}
      <MainCategorySection />
   
      {/* TrendingProducts */}
      <TrendingProducts />

      {/* TrendingService */}
      <TrendingService />
    </ScrollView>
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