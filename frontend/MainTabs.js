import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import your screens (Adjust paths as needed)
import HomeScreen from './Pages/HomeScreen';
import ReportIssueScreen from './Pages/ReportIssueScreen';
import ProfileScreen from './Pages/ProfileScreen';

const Tab = createBottomTabNavigator();

const COLORS = {
  primary: '#8e44ad',
  inactive: '#bdc3c7',
  background: '#ffffff',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Hide the default header
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Report') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
            size = 32; // Make the report button slightly larger
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="Report" component={ReportIssueScreen} options={{ tabBarLabel: 'Report' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}