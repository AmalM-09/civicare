import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SectionList, // <-- Changed to SectionList
  StatusBar,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BASE_URL } from '../../config';

// --- THEME COLORS ---
const COLORS = {
  primary: '#2c3e50', 
  accent: '#3498db',
  background: '#f4f6f8',
  white: '#ffffff',
  textDark: '#2c3e50',
  textLight: '#7f8c8d',
  danger: '#e74c3c',
  warning: '#f39c12',
  success: '#27ae60',
  inactiveTab: '#bdc3c7',
  sectionBg: '#e8ecef'
};

export default function AdminHomeScreen({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [activeTab, setActiveTab] = useState('Pending');

  // --- FETCH DATA ---
  const fetchIssues = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/get-issues`);
      if (response.data.status === "ok") {
        setIssues(response.data.data);
      }
    } catch (error) {
      console.log("Admin Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchIssues();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchIssues();
  };

  // --- PRIORITY LOGIC ---
  const getPriorityWeight = (category) => {
    if (category.includes('Water') || category.includes('Pothole')) return 3; 
    if (category.includes('Light') || category.includes('Garbage')) return 2; 
    return 1; 
  };

  // --- FILTER & SECTION LOGIC ---
  const getSectionedIssues = () => {
    if (activeTab === 'Pending') {
      // 1. Separate Pending and Processing
      let pendingList = issues.filter(item => item.status === 'Pending' || !item.status);
      let processingList = issues.filter(item => item.status === 'Processing');
      
      // 2. Sorting Function (Priority -> Date)
      const sortList = (list) => list.sort((a, b) => {
        const weightA = getPriorityWeight(a.category);
        const weightB = getPriorityWeight(b.category);
        if (weightA !== weightB) return weightB - weightA;
        return new Date(a.date) - new Date(b.date);
      });

      // 3. Build Sections
      const sections = [];
      if (pendingList.length > 0) {
        sections.push({ title: 'New / Action Required', data: sortList(pendingList) });
      }
      if (processingList.length > 0) {
        sections.push({ title: 'Currently Processing', data: sortList(processingList) });
      }
      
      return sections;
      
    } else {
      let solvedList = issues.filter(item => item.status === 'Solved');
      solvedList.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return solvedList.length > 0 ? [{ title: 'Completed Issues', data: solvedList }] : [];
    }
  };

  const sectionedData = getSectionedIssues();

  // --- UI HELPERS ---
  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const renderIssueCard = ({ item }) => {
    const priorityWeight = getPriorityWeight(item.category);
    const isPendingTab = activeTab === 'Pending';

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AdminIssueDetail', { issue: item })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.categoryText}>{item.category}</Text>
          
          {/* Priority/Status Badge */}
          {isPendingTab ? (
            <View style={[styles.badge, { backgroundColor: item.status === 'Processing' ? COLORS.warning : (priorityWeight === 3 ? COLORS.danger : priorityWeight === 2 ? COLORS.accent : COLORS.primary) }]}>
              <Text style={styles.badgeText}>
                {item.status === 'Processing' ? 'Processing' : (priorityWeight === 3 ? 'High Priority' : priorityWeight === 2 ? 'Medium' : 'Low')}
              </Text>
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: COLORS.success }]}>
              <Text style={styles.badgeText}>Completed</Text>
            </View>
          )}
        </View>

        <Text style={styles.dateText}>Reported: {formatDate(item.date)}</Text>
        
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={16} color={COLORS.textLight} />
          <Text style={styles.locationText} numberOfLines={1}>{item.locationName}</Text>
        </View>

        <View style={styles.reporterRow}>
          <Ionicons name="person" size={14} color={COLORS.textLight} />
          <Text style={styles.reporterText}>Citizen: {item.user_name || "Unknown"}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'Pending' && styles.activeTab]}
          onPress={() => setActiveTab('Pending')}
        >
          <Text style={[styles.tabText, activeTab === 'Pending' && styles.activeTabText]}>
            Active Issues
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'Completed' && styles.activeTab]}
          onPress={() => setActiveTab('Completed')}
        >
          <Text style={[styles.tabText, activeTab === 'Completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <SectionList
          sections={sectionedData}
          renderItem={renderIssueCard}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false} // Set to true if you want headers to stick to the top while scrolling
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={60} color={COLORS.textLight} />
              <Text style={styles.emptyText}>
                {activeTab === 'Pending' ? "Great job! No active issues." : "No completed issues yet."}
              </Text>
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
    backgroundColor: COLORS.primary,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: COLORS.white, fontSize: 22, fontWeight: 'bold' },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 10,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#ebf5fb' },
  tabText: { fontSize: 15, fontWeight: 'bold', color: COLORS.inactiveTab },
  activeTabText: { color: COLORS.accent },

  listContent: { padding: 15, paddingBottom: 50 },
  
  // Section Header Styles
  sectionHeader: {
    backgroundColor: COLORS.sectionBg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  card: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  
  dateText: { fontSize: 12, color: COLORS.textLight, marginBottom: 12 },
  
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  locationText: { fontSize: 14, color: COLORS.textDark, marginLeft: 6, flex: 1 },
  
  reporterRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 8, borderRadius: 8, marginTop: 5 },
  reporterText: { fontSize: 12, color: COLORS.textLight, marginLeft: 6, fontWeight: '500' },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: COLORS.textLight, marginTop: 10 }
});