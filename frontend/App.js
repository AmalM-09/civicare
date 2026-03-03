import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import RegisterScreen from './src/pages/Login&Register/Register';

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from './src/pages/Home';
import ReportIssueScreen from './src/pages/ReportIssueScreen';
import IssueDetailScreen from './src/pages/IssueDetailScreen';
import ProfileScreen from './src/pages/ProfileScreen';
import EditProfileScreen from './src/pages/EditProfileScreen';
import HistoryScreen from './src/pages/HistoryScreen';
import LoginScreen from './src/pages/Login&Register/Login';
import AdminHomeScreen from './src/pages/AdminHomeScreen';
import AdminIssueDetailScreen from './src/pages/AdminIssueDetailScreen';
import AdminUserDetailsScreen from './src/pages/AdminUserDetailsScreen';



export default function App() {

  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        <Stack.Screen name="Home" component={Home}/> 
        <Stack.Screen name='Report' component={ReportIssueScreen} />
        <Stack.Screen name="IssueDetail" component={IssueDetailScreen} />
        <Stack.Screen name='Profile' component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />

        <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
        <Stack.Screen name="AdminIssueDetail" component={AdminIssueDetailScreen} />
         <Stack.Screen name="AdminUserDetails" component={AdminUserDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
   
  );
}


