import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '../../config';

const COLORS = {
  primary: '#2c3e50',
  background: '#f4f6f8',
  cardBg: '#ffffff',
  textDark: '#2c3e50',
  textLight: '#7f8c8d',
  danger: '#e74c3c',
  warningBg: '#fdf2e9',
  warningText: '#e67e22'
};

export default function AdminUserDetailsScreen({ route, navigation }) {
  const { userId } = route.params;
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warningCount, setWarningCount] = useState(0);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/get-profile-data`, { user_id: userId });
      if (response.data.status === "ok") {
        setUserData(response.data.data.user);
        setStats(response.data.data.stats);
        setWarningCount(response.data.data.user.warnings || 0);
      } else {
        Alert.alert("Error", "Could not fetch user details");
      }
    } catch (error) {
      console.log("Fetch user error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWarnUser = () => {
    Alert.alert(
      "Issue Warning",
      "Are you sure you want to issue a warning to this user for providing false information?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Issue Warning",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await axios.post(`${BASE_URL}/warn-user`, { user_id: userId });
              if (res.data.status === "ok") {
                setWarningCount(res.data.warnings);
                Alert.alert("Success", "A warning has been added to this citizen's profile.");
              }
            } catch (error) {
              Alert.alert("Error", "Could not issue warning.");
            }
          }
        }
      ]
    );
  };

  // --- Helper to safely format location ---
  const formatLocation = (loc) => {
    if (!loc) return "Location not set";
    if (typeof loc === 'object' && loc.latitude) {
      return `Lat: ${loc.latitude.toFixed(4)}, Lng: ${loc.longitude.toFixed(4)}`;
    }
    return loc;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.cardBg} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Citizen Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.nameText}>{userData?.name || "Unknown Citizen"}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="call" size={18} color={COLORS.textLight} />
            <Text style={styles.infoText}>{userData?.mobile || "No Mobile"}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="card" size={18} color={COLORS.textLight} />
            <Text style={styles.infoText}>{userData?.aadhaar || "No Aadhaar"}</Text>
          </View>

          {/* --- NEW LOCATION ROW --- */}
          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color={COLORS.textLight} />
            <Text style={styles.infoText}>{formatLocation(userData?.location)}</Text>
          </View>
        </View>

        {/* Stats Summary */}
        <Text style={styles.sectionTitle}>Reporting History</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats?.reported || 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, {color: '#27ae60'}]}>{stats?.solved || 0}</Text>
            <Text style={styles.statLabel}>Solved</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, {color: '#e67e22'}]}>{warningCount}</Text>
            <Text style={styles.statLabel}>Warnings</Text>
          </View>
        </View>

        {/* Warning Button */}
        <TouchableOpacity style={styles.warningButton} onPress={handleWarnUser}>
          <Ionicons name="warning" size={20} color={COLORS.danger} />
          <Text style={styles.warningBtnText}>Issue Warning (False Info)</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 20,
  },
  headerTitle: { color: COLORS.cardBg, fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  
  card: {
    backgroundColor: COLORS.cardBg, padding: 20, borderRadius: 12, alignItems: 'center',
    marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#e8ecef',
    justifyContent: 'center', alignItems: 'center', marginBottom: 15
  },
  nameText: { fontSize: 22, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 16, color: COLORS.textLight, marginLeft: 10 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10, marginTop: 10 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statBox: {
    backgroundColor: COLORS.cardBg, flex: 1, marginHorizontal: 5, padding: 15,
    borderRadius: 12, alignItems: 'center', elevation: 1
  },
  statNum: { fontSize: 24, fontWeight: 'bold', color: COLORS.textDark },
  statLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 5 },

  warningButton: {
    flexDirection: 'row', backgroundColor: '#fdeced', padding: 18, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fadbdc'
  },
  warningBtnText: { color: COLORS.danger, fontWeight: 'bold', fontSize: 16, marginLeft: 10 }
});