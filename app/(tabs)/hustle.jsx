import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// <-- Only hustle-related screens, nothing else
import HustlemainScreen from "../screens/HustleScreen/HustlemainScreen";
import HustleDashboard from "../screens/HustleScreen/HustleDashboard";
import ProductListScreen from "../screens/HustleScreen/ProductListScreen";
import ServiceListScreen from "../screens/HustleScreen/ServiceListScreen";
import BadgeScreen from "../screens/HustleScreen/BadgeScreen";
import LoanScreen from "../screens/HustleScreen/LoanScreen";

const Stack = createNativeStackNavigator();

export default function Hustle() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Navigator initialRouteName="HustlemainScreen" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HustlemainScreen" component={HustlemainScreen} />
        <Stack.Screen name="HustleDashboard" component={HustleDashboard} />
        <Stack.Screen name="ProductListScreen" component={ProductListScreen} />
        <Stack.Screen name="ServiceListScreen" component={ServiceListScreen} />
        <Stack.Screen name="BadgeScreen" component={BadgeScreen} />
        <Stack.Screen name="LoanScreen" component={LoanScreen} />
      </Stack.Navigator>
    </SafeAreaView>
  );
}