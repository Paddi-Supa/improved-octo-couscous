import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

// Community screens
import CommentsScreen from './CommentsScreen';
import CreatePhotoPostScreen from './CreatePhotoPostScreen';
import CreatePostScreen from './CreatePostScreen';
import FollowingScreen from './FollowingScreen';
import ForYouScreen from './ForYouScreen';

const Stack = createNativeStackNavigator();

export default function CommunityTab() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Navigator initialRouteName="ForYou" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ForYou" component={ForYouScreen} />
        <Stack.Screen name="Following" component={FollowingScreen} />
        <Stack.Screen name="CreatePost" component={CreatePostScreen} />
        <Stack.Screen name="CreatePhotoPost" component={CreatePhotoPostScreen} />
        <Stack.Screen name="CommentsScreen" component={CommentsScreen} />
      </Stack.Navigator>
    </SafeAreaView>
  );
}