import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// --- IMPORT YOUR BASE URL ---
import { BASE_URL } from '../../config'; 

// --- THEME COLORS ---
const COLORS = {
  primary: '#8e44ad',
  background: '#f8f4fc',
  cardBg: '#ffffff',
  textDark: '#4a235a',
  textLight: '#7f8c8d',
  successBg: '#e8f5e9',
  successText: '#27ae60',
  warningBg: '#fff3e0',
  warningText: '#f39c12',
  dangerBg: '#fce4ec',
  dangerText: '#c0392b'
};

export default function HistoryScreen({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- FETCH HISTORY DATA ---
  const fetchHistory = async () => {
    try {
      const storedData = await AsyncStorage.getItem('user_data');
      if (!storedData) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const user = JSON.parse(storedData);

      const response = await axios.post(`${BASE_URL}/get-user-history`, {
        user_id: user._id
      });

      if (response.data.status === "ok") {
        setIssues(response.data.data);
      }
    } catch (error) {
      console.log("Error fetching history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchHistory();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  // --- HELPERS ---
  const formatDate = (isoDate) => {
    if (!isoDate) return "Unknown Date";
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  // --- RENDER EACH CARD ---
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.7}
      // Passes the clicked issue to your Detail page!
      onPress={() => navigation.navigate('IssueDetail', { issue: item })} 
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
           <Ionicons 
             name={item.category.includes('Light') ? 'bulb' : item.category.includes('Water') ? 'water' : 'alert-circle'} 
             size={24} 
             color={COLORS.primary} 
           />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
           <Text style={styles.cardTitle}>{item.category}</Text>
           <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
           <Text style={[styles.statusText, { color: getStatusTextColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.locationRow}>
        <Ionicons name="location-sharp" size={16} color={COLORS.textLight} />
        <Text style={styles.locationText} numberOfLines={1}>
          {item.locationName || "Location not available"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submission History</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Loading State or List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: COLORS.textLight }}>Loading your history...</Text>
        </View>
      ) : (
        <FlatList
          data={issues}
          renderItem={renderItem}
          keyExtractor={item => item._id} // Uses MongoDB ID
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={60} color={COLORS.textLight} />
              <Text style={styles.emptyText}>You haven't submitted any reports yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background, 
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  backBtn: { padding: 5 },

  listContent: { padding: 20, paddingTop: 0 },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
    borderWidth: 1, borderColor: '#f0f0f0'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 45, height: 45, borderRadius: 12,
    backgroundColor: '#f3e5f5',
    justifyContent: 'center', alignItems: 'center'
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  cardDate: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 13, color: COLORS.textLight, marginLeft: 6, flex: 1 },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: COLORS.textLight, fontSize: 16, marginTop: 10 }
});