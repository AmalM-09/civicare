import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../../config';

// Synced Theme Colors
const COLORS = {
  primary: '#8e44ad',
  background: '#f8f4fc',
  cardBg: '#ffffff',
  textDark: '#2d3436',
  textLight: '#636e72',
  white: '#ffffff',
  success: '#27ae60',
  warning: '#f39c12',
  danger: '#e74c3c',
  border: '#fce4ec' // Light Pink
};

export default function WorkerProfile({ navigation }) {
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchProfileData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('user_data');
      if (!storedData) return;
      
      const parsedUser = JSON.parse(storedData);

      const response = await axios.post(`${BASE_URL}/get-worker-profile`, {
         worker_id: parsedUser._id
      });

      if (response.data.status === "ok") {
         setWorker(response.data.data);
      }
    } catch (error) {
      console.log("Error fetching profile:", error);
      Alert.alert("Error", "Could not load profile details.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchProfileData(); }, []));

  // Handle Status Change
  const handleStatusChange = async (newStatus) => {
    if (worker.status === newStatus) return; // Prevent unnecessary API calls

    setUpdatingStatus(true);
    try {
      const response = await axios.post(`${BASE_URL}/update-worker-status`, {
        worker_id: worker._id,
        status: newStatus
      });

      if (response.data.status === "ok") {
        setWorker({ ...worker, status: newStatus });
      } else {
        Alert.alert("Error", response.data.data);
      }
    } catch (error) {
      Alert.alert("Network Error", "Could not update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          navigation.replace('Login');
        }
      }
    ]);
  };

  const StatusButton = ({ title, icon, color, currentStatus }) => {
    const isActive = currentStatus === title;
    return (
      <TouchableOpacity 
        style={[styles.statusBtn, isActive && { backgroundColor: color, borderColor: color }]}
        onPress={() => handleStatusChange(title)}
        disabled={updatingStatus}
      >
        <Ionicons name={icon} size={18} color={isActive ? COLORS.white : color} />
        <Text style={[styles.statusBtnText, isActive ? { color: COLORS.white } : { color: COLORS.textDark }]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading || !worker) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* HEADER */}
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {worker.profileImage ? (
              <Image source={{ uri: worker.profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#f3e5f5', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={40} color={COLORS.primary} />
              </View>
            )}
            <View style={[styles.onlineIndicator, { backgroundColor: worker.status === 'Active' ? COLORS.success : (worker.status === 'On Break' ? COLORS.warning : COLORS.textLight) }]} />
          </View>
          
          <Text style={styles.nameText}>{worker.name}</Text>
          <Text style={styles.deptText}>{worker.department} Department</Text>
        </View>

        {/* STATUS TOGGLE SECTION */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Duty Status</Text>
          <Text style={styles.sectionSub}>Update your availability for new tasks.</Text>
          
          {updatingStatus && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginBottom: 10 }} />}

          <View style={styles.statusRow}>
            <StatusButton title="Active" icon="checkmark-circle" color={COLORS.success} currentStatus={worker.status} />
            <StatusButton title="Inactive" icon="moon" color={COLORS.textLight} currentStatus={worker.status} />
          </View>
        </View>

        {/* DETAILS SECTION */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Employee Information</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.iconBox}><Ionicons name="id-card-outline" size={20} color={COLORS.primary} /></View>
            <View>
              <Text style={styles.infoLabel}>Employee ID</Text>
              <Text style={styles.infoValue}>{worker.empId}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconBox}><Ionicons name="call-outline" size={20} color={COLORS.primary} /></View>
            <View>
              <Text style={styles.infoLabel}>Registered Mobile</Text>
              <Text style={styles.infoValue}>+91 {worker.mobile}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconBox}><Ionicons name="calendar-outline" size={20} color={COLORS.primary} /></View>
            <View>
              <Text style={styles.infoLabel}>Joined CiviCare</Text>
              <Text style={styles.infoValue}>{new Date(worker.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, backgroundColor: COLORS.white, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Profile Header
  profileCard: { alignItems: 'center', marginBottom: 25 },
  avatarWrapper: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.white },
  onlineIndicator: { position: 'absolute', bottom: 5, right: 5, width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: COLORS.white },
  nameText: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  deptText: { fontSize: 14, color: COLORS.textLight, marginTop: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },

  // Cards
  sectionCard: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 20, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 5 },
  sectionSub: { fontSize: 12, color: COLORS.textLight, marginBottom: 15 },
  
  // Status Buttons
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusBtn: { flex: 1, flexDirection: 'column', alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 12, marginHorizontal: 4, backgroundColor: '#fafafa' },
  statusBtnText: { fontSize: 11, fontWeight: 'bold', marginTop: 6 },

  // Info Rows
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fcf8ff', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: COLORS.border },
  infoLabel: { fontSize: 11, color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 15, fontWeight: '600', color: COLORS.textDark, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f2f6', marginVertical: 8 },

  logoutBtn: { flexDirection: 'row', backgroundColor: '#fff5f5', padding: 18, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.danger, marginTop: 10 },
  logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: 'bold', marginLeft: 8 }
});