import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

// --- IMPORT YOUR SCREENS ---
// Adjust these paths if your folder structure is slightly different
import Home from '../pages/Home';
import ReportIssueScreen from '../pages/ReportIssueScreen';
import ProfileScreen from '../pages/ProfileScreen';

const Tab = createBottomTabNavigator();

const COLORS = {
  primary: '#8e44ad',   // CiviCare Purple
  inactive: '#a0a0a0',  // Soft Grey for inactive tabs
  background: '#ffffff',
  cardBg: '#f8f4fc'
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Hides the top header since your screens have their own
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Report') {
            // We use a completely different, highlighted icon for the center Report button
            iconName = focused ? 'add-circle' : 'add-circle-outline';
            size = 34; // Make the report button slightly larger to stand out!
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={Home} 
        options={{ tabBarLabel: 'Dashboard' }} 
      />
      <Tab.Screen 
        name="Report" 
        component={ReportIssueScreen} 
        options={{ tabBarLabel: 'Report' }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Profile' }} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    height: 65,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 15, // Adds a nice shadow on Android
    shadowColor: '#000', // Adds a nice shadow on iOS
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -4,
  }
});