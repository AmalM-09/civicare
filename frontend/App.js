import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Login from './src/pages/Login&Register/Login';
import RegisterScreen from './src/pages/Login&Register/Register';

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from './src/pages/Home';


export default function App() {

  const Stack = createNativeStackNavigator();
  return (
    // <NavigationContainer>
    //   <Stack.Navigator>
    //     <Stack.Screen name="Login" component={Login}/>
    //     <Stack.Screen name='Register' component={RegisterScreen}/>
    //   </Stack.Navigator>
    // </NavigationContainer>
    <Home />
    
  );
}


