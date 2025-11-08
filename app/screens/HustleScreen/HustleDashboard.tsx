import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import BadgeScreen from "../../screens/HustleScreen/BadgeScreen";
import LoanScreen from "../../screens/HustleScreen/LoanScreen";
import ProductListScreen from "../../screens/HustleScreen/ProductListScreen";
import ServiceListScreen from "../../screens/HustleScreen/ServiceListScreen";

type TabKey = "product" | "service" | "badges" | "loan";

const HustleDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("product");

  const renderContent = () => {
    switch (activeTab) {
      case "product":
        return <ProductListScreen />;
      case "service":
        return <ServiceListScreen />;
      case "badges":
        return <BadgeScreen />;
      case "loan":
        return <LoanScreen />;
      default:
        return <ProductListScreen />;
    }
  };

  return (
    <PaperProvider>
      <View style={styles.safeArea}>
        <View style={styles.tabContainer}>
          {[
            { key: "product" as TabKey, label: "Product List" },
            { key: "service" as TabKey, label: "Service List" },
            { key: "badges" as TabKey, label: "Request Delivery" },
            { key: "loan" as TabKey, label: "Seller's Loan" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.activeButton,
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeText,
                ]}
              >
                {tab.label}
              </Text>
              {activeTab === tab.key && <View style={styles.underline} />}
            </TouchableOpacity>
          ))}
        </View>

        <Animated.View
          key={activeTab} // Key change triggers re-render and animations
          style={styles.contentContainer}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
        >
          {renderContent()}
        </Animated.View>
      </View>
    </PaperProvider>
  );
};

export default HustleDashboard;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9F8FF",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#7B1FA2",
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 6,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  activeButton: {
    backgroundColor: "#682D8B",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tabText: {
    color: "#E6E6E6",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.4,
  },
  activeText: {
    color: "#fff",
    fontWeight: "700",
  },
  underline: {
    marginTop: 3,
    width: "55%",
    height: 2.5,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  contentContainer: {
    flex: 1,
    padding: 12,
    backgroundColor: "#F9F8FF",
  },
});