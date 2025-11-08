import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import TabIconWithBadge from '../components/TabIconWithBadge';

export default function TabLayout() {
  // IconWithBadge moved to a reusable component (TabIconWithBadge)

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#6501B5',
      tabBarStyle: {
        height: 120,
        paddingTop: 10, // Add padding to push content down
      }
    }}>
        <Tabs.Screen 
          name="marketplace" 
          options={{
            tabBarLabel: 'Marketplace',
            tabBarIcon:({color}) => <Ionicons name="home" size={24} color={color} />
          }}
        />
        {/* Chats moved into Community screen - removed standalone Chats tab */}
        <Tabs.Screen 
          name="hustle" 
          options={{
            tabBarLabel: 'Hustle',
            tabBarIcon:({color}) => <Ionicons name="add-circle" size={24} color={color} /> 
          }}
        />
        <Tabs.Screen 
          name="earn" 
          options={{
            tabBarLabel: 'Earn',
            tabBarIcon:({color}) => <Ionicons name="wallet" size={24} color={color} />
          }}
        />
        <Tabs.Screen 
          name="community" 
          options={{
            tabBarLabel: 'Community',
            tabBarIcon:({color}) => <TabIconWithBadge name="people-circle-outline" color={color} />
          }}
        />
        <Tabs.Screen 
          name="profile" 
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon:({color}) => <Ionicons name="menu" size={24} color={color} />
          }}
        />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBadge: {
    position: 'absolute',
    top: 2,
    right: -2,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f11010ff',
    borderWidth: 1,
    borderColor: '#fff'
  }
});
