import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: 'blue',
      tabBarStyle: {
        height: 70,
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
            tabBarIcon:({color}) => <Ionicons name="people-circle-outline" size={24} color={color} />
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
