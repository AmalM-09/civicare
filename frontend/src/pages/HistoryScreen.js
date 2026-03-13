import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// --- IMPORT YOUR BASE URL ---
import { BASE_URL } from '../../config'; 

const COLORS = {
  primary: '#8e44ad',
  background: '#ffffff', // Pure white background
  textDark: '#333333',
  textLight: '#888888',
  success: '#27ae60',
  warning: '#f39c12',
  danger: '#e74c3c',
  border: '#eeeeee',
  lightPurple: '#f9f4fd'
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

  // --- CANCEL LOGIC ---
  const handleCancelIssue = (issueId) => {
    Alert.alert(
      "Cancel Report",
      "Are you sure you want to withdraw this report? This action cannot be undone.",
      [
        { text: "Keep It", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              const response = await axios.post(`${BASE_URL}/delete-issue`, { issue_id: issueId });
              
              if (response.data.status === "ok") {
                setIssues((prevIssues) => prevIssues.filter(issue => issue._id !== issueId));
              } else {
                Alert.alert("Cannot Cancel", response.data.data);
              }
            } catch (error) {
              Alert.alert("Network Error", "Could not reach the server to cancel.");
            }
          }
        }
      ]
    );
  };

  // --- HELPERS ---
  const formatDate = (isoDate) => {
    if (!isoDate) return "Unknown Date";
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    if (status === 'Solved') return COLORS.success;
    if (status === 'Processing') return COLORS.warning;
    return COLORS.danger; 
  };

  const getCategoryIcon = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('light') || cat.includes('electrical')) return 'bulb';
    if (cat.includes('water') || cat.includes('pipe') || cat.includes('drain')) return 'water';
    if (cat.includes('garbage') || cat.includes('trash')) return 'trash';
    if (cat.includes('road') || cat.includes('pothole')) return 'car';
    return 'alert-circle';
  };

  // --- CLEAN ROW ITEM ---
  const renderItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity 
        style={styles.listItem} 
        activeOpacity={0.6}
        onPress={() => navigation.navigate('IssueDetail', { issue: item })} 
      >
        {/* Left Icon */}
        <View style={styles.iconBox}>
           <Ionicons name={getCategoryIcon(item.category)} size={22} color={COLORS.primary} />
        </View>

        {/* Center Text Info */}
        <View style={styles.itemInfo}>
           <Text style={styles.itemTitle}>{item.category}</Text>
           <Text style={styles.itemLocation} numberOfLines={1}>{item.locationName || "Unknown Location"}</Text>
           <View style={styles.dateRow}>
             <Ionicons name="calendar-outline" size={12} color={COLORS.textLight} />
             <Text style={styles.itemDate}>{formatDate(item.date)}</Text>
           </View>
        </View>

        {/* Right Status & Actions */}
        <View style={styles.itemActions}>
           <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
           </View>

           {item.status === 'Pending' && (
             <TouchableOpacity 
               style={styles.cancelBtn} 
               onPress={() => handleCancelIssue(item._id)}
               hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Makes it easier to tap
             >
               <Ionicons name="trash-outline" size={16} color={COLORS.textLight} />
               <Text style={styles.cancelText}>Cancel</Text>
             </TouchableOpacity>
           )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Clean Flat Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* List Area */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={issues}
          renderItem={renderItem}
          keyExtractor={item => item._id} 
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={50} color={COLORS.border} />
              <Text style={styles.emptyText}>No reports found.</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  backBtn: { padding: 5, marginLeft: -5 },

  listContent: { paddingBottom: 30 },

  // Flat Row Styling
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.lightPurple,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  
  itemInfo: { flex: 1, justifyContent: 'center' },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 2 },
  itemLocation: { fontSize: 13, color: COLORS.textLight, marginBottom: 6 },
  
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  itemDate: { fontSize: 12, color: COLORS.textLight, marginLeft: 4, fontWeight: '500' },

  itemActions: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 10 },
  
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },

  cancelBtn: { flexDirection: 'row', alignItems: 'center' },
  cancelText: { fontSize: 12, color: COLORS.textLight, marginLeft: 4, fontWeight: '500' },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: COLORS.textLight, fontSize: 15, marginTop: 12 }
});