import React, { useState, useCallback } from 'react';
import { BASE_URL } from '../../config';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import Profile from './ProfileScreen';

const API_URL = `${BASE_URL}/get-issues`; 

const COLORS = {
  primary: '#8e44ad',   
  background: '#f8f4fc',
  cardBg: '#ffffff',
  textDark: '#4a235a',   
  textLight: '#888',
  white: '#ffffff',
  successBg: '#e8f5e9',
  successText: '#27ae60',
  warningBg: '#fff3e0',
  warningText: '#f39c12',
  dangerBg: '#fce4ec',   
  dangerText: '#c0392b'
};

export default function Home({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- FETCH DATA FROM DB ---
  const fetchIssues = async () => {
    try {
      const response = await axios.get(API_URL);
      if (response.data.status === "ok") {
        setIssues(response.data.data);
      }
    } catch (error) {
      console.log("Error fetching issues:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchIssues();
    }, [])
  );

  // Manual Pull-to-Refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchIssues();
  };

  // --- FILTER DATA ---
  const activeIssues = issues.filter(item => item.status !== 'Solved');
  const solvedIssues = issues.filter(item => item.status === 'Solved');

  // --- HELPERS ---
  const formatDate = (isoDate) => {
    if (!isoDate) return "Just now";
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Solved': return COLORS.successBg;    
      case 'Processing': return COLORS.warningBg; 
      default: return COLORS.dangerBg;          
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'Solved': return COLORS.successText;    
      case 'Processing': return COLORS.warningText; 
      default: return COLORS.dangerText;          
    }
  };

  const IssueCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8} 
      onPress={() => navigation.navigate('IssueDetail', { issue: item })}
    >
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.categoryTitle}>{item.category}</Text>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location-sharp" size={14} color={COLORS.primary} />
            {/* DB sends 'locationName', not 'location' */}
            <Text style={styles.locationText} numberOfLines={1}>
                {item.locationName || "Location not available"}
            </Text>
          </View>
        </View>
        
        <View style={[styles.statusContainer, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusTextColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.dateText}>Reported: {formatDate(item.date)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBg} />

      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>CiviCare</Text>
          <Text style={styles.greeting}>Welcome back, Citizen</Text>
        </View>
        
        <TouchableOpacity style={styles.profileIcon} onPress={() => navigation.navigate('Profile')}>
           <Ionicons name="person-circle-outline" size={40} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{marginTop: 10, color: COLORS.textLight}}>Loading Issues...</Text>
        </View>
      ) : (
        <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
            
            {/* Active Section */}
            <View style={styles.sectionHeader}>
            <View style={styles.headerTitleRow}>
                <Ionicons name="time-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>In Progress</Text>
            </View>
            <Text style={styles.sectionCount}>{activeIssues.length} active</Text>
            </View>

            {activeIssues.length === 0 ? (
                <Text style={styles.emptyText}>No active issues found.</Text>
            ) : (
                activeIssues.map((item) => <IssueCard key={item._id} item={item} />)
            )}

            {/* Solved Section */}
            <View style={[styles.sectionHeader, { marginTop: 25 }]}>
            <View style={styles.headerTitleRow}>
                <Ionicons name="checkmark-done-circle-outline" size={20} color={COLORS.successText} style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Past Resolutions</Text>
            </View>
            <Text style={styles.sectionCount}>{solvedIssues.length} solved</Text>
            </View>

            {solvedIssues.map((item) => (
               <IssueCard key={item._id} item={item} />
            ))}

        </ScrollView>
      )}

      
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate("Report")}
      >
        <Ionicons name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, 
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: COLORS.cardBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  appName: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary, 
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark, 
  },
  sectionCount: {
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: '#ede7f6', 
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 15, 
    padding: 18,
    marginBottom: 12,
    elevation: 2, 
    shadowColor: COLORS.primary, 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '85%' // Prevent long addresses breaking layout
  },
  locationText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#bdc3c7',
    marginTop: 12,
    textAlign: 'right'
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginTop: 10,
    marginBottom: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: COLORS.primary, 
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
});









