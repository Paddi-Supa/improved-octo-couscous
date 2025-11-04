import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Screens
import CommentsScreen from '../screens/Community/CommentsScreen';
import CreatePhotoPostScreen from '../screens/Community/CreatePhotoPostScreen';
import CreatePostScreen from '../screens/Community/CreatePostScreen';
import FollowingScreen from '../screens/Community/FollowingScreen';
import ForYouScreen from '../screens/Community/ForYouScreen';
import UserProfileScreen from '../screens/Community/UserProfileScreen';
import ChatListScreen from '../screens/MarketplaceScreen/ChatsListScreen';

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

function TabsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>PADDI SUPA</Text>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: '#fff' },
          tabBarIndicatorStyle: { backgroundColor: '#6501B5', height: 3 },
          tabBarLabelStyle: { fontWeight: '600' },
        }}
      >
        <Tab.Screen name="ForYou" component={ForYouScreen} options={{ title: 'For You' }} />
        <Tab.Screen name="Following" component={FollowingScreen} options={{ title: 'Following' }} />
        <Tab.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Chats' }} />
      </Tab.Navigator>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('CreatePostScreen');
              }}
            >
              <Text style={styles.modalButtonText}>✏️ Create Text Post</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('CreatePhotoPostScreen');
              }}
            >
              <Text style={styles.modalButtonText}>🖼 Upload Photo Post</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function CommunityTab() {
  return (
    <Stack.Navigator initialRouteName="TabsScreen" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TabsScreen" component={TabsScreen} />
      <Stack.Screen name="CreatePostScreen" component={CreatePostScreen} />
      <Stack.Screen name="CreatePhotoPostScreen" component={CreatePhotoPostScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="CommentsScreen" component={CommentsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', marginTop: 30 },

  header: {
    backgroundColor: '#6501B5',
    paddingVertical: 16,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
    alignItems: 'center',
    marginTop: 5,
  },

  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },

  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    backgroundColor: '#6501B5',
    width: 58,
    height: 58,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBox: {
    width: 260,
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
  },

  modalButton: {
    paddingVertical: 12,
  },

  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  modalCancel: {
    marginTop: 10,
    alignItems: 'center',
  },

  modalCancelText: {
    color: 'red',
    fontWeight: '700',
  },
});