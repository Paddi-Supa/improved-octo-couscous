import { createStackNavigator } from '@react-navigation/stack';

// Screens from app/screens/EarnScreen
import CreativeHubFeed from '../screens/EarnScreen/CreativeHubFeed';
import EarnHome from '../screens/EarnScreen/EarnHome';
import EarnMainScreen from '../screens/EarnScreen/EarnMainScreen';
import TaskDetailsScreen from '../screens/EarnScreen/TaskDetailsScreen';
import WalletProfile from '../screens/EarnScreen/WalletProfile';

const EarnStack = createStackNavigator();

const EarnNavigator = () => {
  return (
    <EarnStack.Navigator
      initialRouteName="EarnMain"
      screenOptions={{ headerShown: false }}
    >
      <EarnStack.Screen name="EarnHome" component={EarnHome} />
      <EarnStack.Screen name="EarnMain" component={EarnMainScreen} />
      <EarnStack.Screen name="CreativeHub" component={CreativeHubFeed} />
      <EarnStack.Screen name="TaskDetails" component={TaskDetailsScreen} />
      <EarnStack.Screen name="WalletProfile" component={WalletProfile} />
    </EarnStack.Navigator>
  );
};

export default EarnNavigator;