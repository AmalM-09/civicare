import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SectionList, 
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Vibration,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { Audio } from 'expo-av'; 
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

  // --- CUSTOM ALERT STATE ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertIssue, setAlertIssue] = useState(null);
  const soundRef = useRef(null); 
  const latestIssueIdRef = useRef(null);

  // --- CLEANUP ---
  useEffect(() => {
    return () => {
      stopAlert(); 
    };
  }, []);

  // --- PLAY LOOPING SOUND & VIBRATE ---
  const triggerHighPriorityAlert = async (issue) => {
    setAlertIssue(issue);
    setAlertVisible(true);

    Vibration.vibrate([0, 500, 500], true); 

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' }, 
        { shouldPlay: true, isLooping: true } 
      );
      soundRef.current = sound;
    } catch (error) {
      console.log("Error playing sound:", error);
    }
  };

  // --- STOP SOUND, VIBRATION & HIDE POPUP ---
  const stopAlert = async () => {
    Vibration.cancel(); 

    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    setAlertVisible(false);
    setAlertIssue(null);
  };

  const handleDismissAlert = () => {
    stopAlert();
  };

  const handleViewAlertDetails = () => {
    const issueToView = alertIssue;
    stopAlert(); 
    navigation.navigate('AdminIssueDetail', { issue: issueToView }); 
  };

  // --- SILENT BACKGROUND POLLING ---
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${BASE_URL}/get-issues`);
        if (response.data.status === "ok" && response.data.data.length > 0) {
          const fetchedIssues = response.data.data;
          const newestIssue = fetchedIssues[0]; 

          if (!latestIssueIdRef.current) {
            latestIssueIdRef.current = newestIssue._id;
            setIssues(fetchedIssues);
            setLoading(false);
            return;
          }

          // BRAND NEW ISSUE DETECTED
          if (newestIssue._id !== latestIssueIdRef.current) {
            latestIssueIdRef.current = newestIssue._id; 
            setIssues(fetchedIssues); 

            // ✨ NEW LOGIC: Trigger alert ONLY if Gemini assigned it "High" priority! ✨
            const isHighPriority = newestIssue.priority === 'High';
            
            if (isHighPriority && !alertVisible) {
              triggerHighPriorityAlert(newestIssue);
            }
          }
        }
      } catch (error) {
        console.log("Polling error:", error);
      }
    }, 10000); 

    return () => clearInterval(interval); 
  }, [alertVisible]);

  // --- MANUAL FETCH ---
  const fetchIssues = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/get-issues`);
      if (response.data.status === "ok") {
        setIssues(response.data.data);
        if (response.data.data.length > 0) {
           latestIssueIdRef.current = response.data.data[0]._id;
        }
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

  // ✨ NEW LOGIC: Helper to turn Gemini's text into a math score for sorting ✨
  const getPriorityScore = (priorityStr) => {
    if (priorityStr === 'High') return 3;
    if (priorityStr === 'Medium') return 2;
    return 1; // Default for 'Low' or missing
  };

  // --- FILTER & SECTION LOGIC ---
  const getSectionedIssues = () => {
    if (activeTab === 'Pending') {
      let pendingList = issues.filter(item => item.status === 'Pending' || !item.status);
      let processingList = issues.filter(item => item.status === 'Processing');
      
      const sortList = (list) => list.sort((a, b) => {
        // Sort by Gemini's Priority first
        const scoreA = getPriorityScore(a.priority);
        const scoreB = getPriorityScore(b.priority);
        if (scoreA !== scoreB) return scoreB - scoreA;
        
        // If priority is the same, sort by oldest date
        return new Date(a.date) - new Date(b.date);
      });

      const sections = [];
      if (pendingList.length > 0) sections.push({ title: 'New / Action Required', data: sortList(pendingList) });
      if (processingList.length > 0) sections.push({ title: 'Currently Processing', data: sortList(processingList) });
      
      return sections;
    } else {
      let solvedList = issues.filter(item => item.status === 'Solved');
      solvedList.sort((a, b) => new Date(b.date) - new Date(a.date));
      return solvedList.length > 0 ? [{ title: 'Completed Issues', data: solvedList }] : [];
    }
  };

  const sectionedData = getSectionedIssues();

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
    const isPendingTab = activeTab === 'Pending';
    const currentPriority = item.priority || 'Low'; // Fallback just in case

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AdminIssueDetail', { issue: item })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.categoryText}>{item.category}</Text>
          
          {/* ✨ NEW LOGIC: Badges color-coded based on Gemini's Priority output ✨ */}
          {isPendingTab ? (
            <View style={[styles.badge, { 
              backgroundColor: item.status === 'Processing' ? COLORS.warning : 
                              (currentPriority === 'High' ? COLORS.danger : 
                               currentPriority === 'Medium' ? COLORS.accent : 
                               COLORS.primary) 
            }]}>
              <Text style={styles.badgeText}>
                {item.status === 'Processing' ? 'Processing' : `${currentPriority} Priority`}
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
      
      {/* CUSTOM ALERT MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={alertVisible}
        onRequestClose={handleDismissAlert} 
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            
            <View style={styles.alertIconWrapper}>
               <Ionicons name="warning" size={45} color={COLORS.white} />
            </View>

            <Text style={styles.alertTitle}>HIGH PRIORITY ALERT</Text>
            <Text style={styles.alertSubtitle}>AI has flagged this issue as critical.</Text>

            <View style={styles.alertDetailsBox}>
               <Text style={styles.alertDetailCategory}>{alertIssue?.category}</Text>
               <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
                 <Ionicons name="location" size={16} color={COLORS.textLight} />
                 <Text style={styles.alertDetailLocation} numberOfLines={2}>
                   {alertIssue?.locationName || "Location unknown"}
                 </Text>
               </View>
            </View>

            <View style={styles.alertButtonGroup}>
              <TouchableOpacity style={styles.dismissBtn} onPress={handleDismissAlert}>
                <Text style={styles.dismissBtnText}>Dismiss</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.viewBtn} onPress={handleViewAlertDetails}>
                <Text style={styles.viewBtnText}>View Details</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.white} style={{marginLeft: 5}}/>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

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
  
  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', 
    justifyContent: 'center', alignItems: 'center', padding: 20
  },
  alertBox: {
    backgroundColor: COLORS.white, width: '100%', borderRadius: 20, 
    padding: 25, alignItems: 'center', elevation: 10,
    borderTopWidth: 6, borderTopColor: COLORS.danger
  },
  alertIconWrapper: {
    backgroundColor: COLORS.danger, width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginTop: -65, 
    borderWidth: 5, borderColor: COLORS.white, elevation: 5
  },
  alertTitle: { fontSize: 20, fontWeight: '900', color: COLORS.danger, marginTop: 15, letterSpacing: 1 },
  alertSubtitle: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginTop: 5, marginBottom: 20 },
  alertDetailsBox: {
    backgroundColor: '#f9f9f9', width: '100%', padding: 15, borderRadius: 12, 
    borderWidth: 1, borderColor: '#eee', marginBottom: 25
  },
  alertDetailCategory: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  alertDetailLocation: { fontSize: 13, color: COLORS.textLight, marginLeft: 5, flex: 1, lineHeight: 18 },
  alertButtonGroup: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  dismissBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.danger,
    alignItems: 'center', marginRight: 10
  },
  dismissBtnText: { color: COLORS.danger, fontWeight: 'bold', fontSize: 15 },
  viewBtn: {
    flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 10, 
    backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center'
  },
  viewBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
  // --------------------

  header: {
    backgroundColor: COLORS.primary, padding: 20, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { color: COLORS.white, fontSize: 22, fontWeight: 'bold' },

  tabContainer: {
    flexDirection: 'row', backgroundColor: COLORS.white, padding: 10, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#ebf5fb' },
  tabText: { fontSize: 15, fontWeight: 'bold', color: COLORS.inactiveTab },
  activeTabText: { color: COLORS.accent },

  listContent: { padding: 15, paddingBottom: 50 },
  sectionHeader: {
    backgroundColor: COLORS.sectionBg, paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, marginTop: 10, marginBottom: 15,
  },
  sectionHeaderText: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },

  card: {
    backgroundColor: COLORS.white, padding: 15, borderRadius: 12, marginBottom: 15,
    borderLeftWidth: 5, borderLeftColor: COLORS.primary, elevation: 3,
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