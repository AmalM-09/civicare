import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, StatusBar, 
  FlatList, ActivityIndicator, RefreshControl, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../../config';

// Themed Colors
const COLORS = {
  primary: '#8e44ad',
  primaryLight: '#9b59b6',
  background: '#f8f4fc',
  cardBg: '#ffffff',
  textDark: '#2d3436',
  textLight: '#636e72',
  white: '#ffffff',
  warning: '#f39c12',
  success: '#27ae60',
  danger: '#e74c3c',
  accentPink: '#fce4ec',
  border: '#f1f2f6'
};

export default function WorkerHome({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Real Worker State
  const [workerDetails, setWorkerDetails] = useState({ name: "Loading...", profileImage: null });
  const [activeTab, setActiveTab] = useState('Active'); 

  const fetchAssignedTasks = async () => {
    try {
      // 1. Get the actual logged-in worker's ID
      const storedData = await AsyncStorage.getItem('user_data');
      if (!storedData) {
        navigation.replace('Login');
        return;
      }
      
      const parsedWorker = JSON.parse(storedData);
      setWorkerDetails({ name: parsedWorker.name, profileImage: parsedWorker.profileImage });

      // 2. Fetch tasks specifically assigned to THIS worker
      const response = await axios.post(`${BASE_URL}/get-worker-issues`, { 
        worker_id: parsedWorker._id 
      });

      if (response.data.status === "ok") {
        setIssues(response.data.data);
      }
    } catch (error) {
      console.log("Error fetching worker tasks:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAssignedTasks(); }, []));

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignedTasks();
  };

  // Filter Logic
  const activeTasks = issues.filter(i => i.status !== 'Solved');
  const solvedTasks = issues.filter(i => i.status === 'Solved');
  const displayIssues = activeTab === 'Active' ? activeTasks : solvedTasks;

  const TaskCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9} 
      onPress={() => navigation.navigate('WorkerIssueDetail', { issue: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.categoryTitle}>{item.category}</Text>
        <View style={[styles.badge, { backgroundColor: item.status === 'Solved' ? '#e8f5e9' : COLORS.accentPink }]}>
          <Text style={[styles.badgeText, { color: item.status === 'Solved' ? COLORS.success : COLORS.primary }]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.locationRow}>
        <Ionicons name="location-sharp" size={16} color={COLORS.primary} />
        <Text style={styles.locationText} numberOfLines={2}>{item.locationName}</Text>
      </View>
      
      <View style={styles.footerRow}>
        <Text style={styles.dateText}>
            Reported: {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        {item.priority && (
            <View style={styles.priorityBox}>
                <Ionicons name="flash" size={12} color={item.priority === 'High' ? COLORS.danger : COLORS.primary} style={{marginRight: 4}}/>
                <Text style={[styles.priorityText, {color: item.priority === 'High' ? COLORS.danger : COLORS.primary}]}>
                  {item.priority.toUpperCase()}
                </Text>
            </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHeaderGrid = () => (
    <View style={styles.segmentedContainer}>
      <View style={styles.segmentedControl}>
        <TouchableOpacity 
          style={[styles.segmentBtn, activeTab === 'Active' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('Active')}
        >
          <Text style={[styles.segmentText, activeTab === 'Active' && styles.segmentTextActive]}>
            To-Do ({activeTasks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.segmentBtn, activeTab === 'Solved' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('Solved')}
        >
          <Text style={[styles.segmentText, activeTab === 'Solved' && styles.segmentTextActive]}>
            History ({solvedTasks.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Top Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <View style={styles.profileRow}>
              {/* Profile Image replaces the wrench icon */}
              <TouchableOpacity onPress={() => navigation.navigate("WorkerProfile")}>
                {workerDetails.profileImage ? (
                  <Image source={{ uri: workerDetails.profileImage }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={22} color={COLORS.primary} />
                  </View>
                )}
              </TouchableOpacity>
              
              <View style={{marginLeft: 15}}>
                <Text style={styles.headerTitle}>{workerDetails.name}</Text>
                <Text style={styles.headerSub}>Field Maintenance</Text>
              </View>
            </View>
            
            {/* Added a gear icon to navigate to Profile Settings */}
            <TouchableOpacity onPress={() => navigation.navigate("WorkerProfile")} style={styles.profileBtn}>
              <Ionicons name="settings-outline" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{marginTop: 15, color: COLORS.textLight, fontWeight: '500'}}>Loading tasks...</Text>
        </View>
      ) : (
        <FlatList 
          data={displayIssues}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderHeaderGrid}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          renderItem={({ item }) => <TaskCard item={item} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name={activeTab === 'Active' ? "sparkles" : "document-text-outline"} size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyText}>
                {activeTab === 'Active' ? "Clear sky! All your tasks are completed." : "No task history found."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    backgroundColor: COLORS.primary, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    paddingBottom: 25,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatarImg: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: COLORS.white },
  avatarPlaceholder: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  headerSub: { fontSize: 12, color: COLORS.accentPink, marginTop: 2, fontWeight: '600', opacity: 0.9 },
  profileBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  segmentedContainer: { marginTop: 20, marginBottom: 10 },
  segmentedControl: { flexDirection: 'row', backgroundColor: '#efe9f5', borderRadius: 15, padding: 5, borderWidth: 1, borderColor: COLORS.accentPink },
  segmentBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: COLORS.white, elevation: 3, shadowColor: COLORS.primary, shadowOpacity: 0.1, shadowRadius: 5 },
  segmentText: { fontSize: 13, fontWeight: '700', color: COLORS.textLight },
  segmentTextActive: { color: COLORS.primary },

  listContent: { padding: 20 },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: COLORS.accentPink, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  categoryTitle: { fontSize: 19, fontWeight: '800', color: COLORS.primary },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  
  locationRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fcf8ff', padding: 10, borderRadius: 10, marginBottom: 15 },
  locationText: { fontSize: 14, color: COLORS.textDark, marginLeft: 8, flex: 1, fontWeight: '500' },
  
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f8f4f9', paddingTop: 15 },
  dateText: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  priorityBox: { flexDirection: 'row', alignItems: 'center' },
  priorityText: { fontSize: 10, fontWeight: '900' },

  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.accentPink, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { color: COLORS.textLight, fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 }
});