import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '../../config';

// --- ADMIN THEME COLORS ---
const COLORS = {
  primary: '#2c3e50', 
  accent: '#3498db',
  background: '#f4f6f8',
  cardBg: '#ffffff',
  textDark: '#2c3e50',
  textLight: '#7f8c8d',
  success: '#27ae60',
  warning: '#f39c12',
  danger: '#e74c3c',
  border: '#e1e8ed'
};

export default function AdminIssueDetailScreen({ route, navigation }) {
  const { issue } = route.params;
  
  // Local state to instantly update the UI when the admin changes the status
  const [currentStatus, setCurrentStatus] = useState(issue.status);
  const [updating, setUpdating] = useState(false);

  // --- FORMATTERS ---
  const formatDetailedDateTime = (isoDate) => {
    if (!isoDate) return "Date not recorded";
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Solved': return COLORS.success;    
      case 'Processing': return COLORS.warning; 
      default: return COLORS.danger;          
    }
  };

  // --- ACTIONS ---
  const openMaps = () => {
    if (issue.coordinates && issue.coordinates.lat) {
      const url = `https://www.google.com/maps/search/?api=1&query=${issue.coordinates.lat},${issue.coordinates.long}`;
      Linking.openURL(url);
    } else {
      Alert.alert("Error", "GPS Coordinates not available for this issue.");
    }
  };

  const handleUserClick = () => {
    navigation.navigate('AdminUserDetails', { userId: issue.user_id });
  };

  const changeStatus = async (newStatus) => {
    if (currentStatus === newStatus) return;

    Alert.alert(
      "Confirm Action",
      `Mark this issue as ${newStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Update", 
          onPress: async () => {
            setUpdating(true);
            try {
              const response = await axios.post(`${BASE_URL}/update-issue-status`, {
                issue_id: issue._id,
                status: newStatus
              });

              if (response.data.status === "ok") {
                setCurrentStatus(newStatus);
                Alert.alert("Success", `Issue marked as ${newStatus}`);
              } else {
                Alert.alert("Error", "Could not update status.");
              }
            } catch (error) {
              Alert.alert("Network Error", "Failed to reach the server.");
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* FIXED HEADER */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.cardBg} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Details</Text>
        <View style={{ width: 24 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* LARGER HERO IMAGE */}
        <View style={styles.imageWrapper}>
          <Image 
            source={issue.image ? { uri: issue.image } : { uri: 'https://via.placeholder.com/600x400.png?text=No+Image' }} 
            style={styles.heroImage} 
          />
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentStatus) }]}>
            <Text style={styles.statusBadgeText}>{currentStatus}</Text>
          </View>
        </View>

        {/* DETAILS SECTION */}
        <View style={styles.detailsContainer}>
          
          <Text style={styles.categoryTitle}>{issue.category}</Text>
          <Text style={styles.dateTimeText}>{formatDetailedDateTime(issue.date)}</Text>

          {/* Detailed Location Box */}
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={22} color={COLORS.accent} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.boxLabel}>Exact Location</Text>
                <Text style={styles.boxValue}>{issue.locationName || "Not Provided"}</Text>
                {issue.coordinates?.lat && (
                  <Text style={styles.coordsText}>
                    Lat: {issue.coordinates.lat.toFixed(6)}, Lng: {issue.coordinates.long.toFixed(6)}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.mapButton} onPress={openMaps}>
              <Text style={styles.mapButtonText}>View on Maps</Text>
              <Ionicons name="map-outline" size={16} color={COLORS.accent} style={{marginLeft: 5}}/>
            </TouchableOpacity>
          </View>

          {/* Description Box */}
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Ionicons name="document-text" size={22} color={COLORS.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.boxLabel}>Description</Text>
                <Text style={styles.descriptionText}>{issue.description || "No description provided."}</Text>
              </View>
            </View>
          </View>

          {/* User Button (Clickable Box) */}
          <TouchableOpacity style={styles.userButton} onPress={handleUserClick} activeOpacity={0.7}>
            <View style={styles.userIconWrapper}>
              <Ionicons name="person" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.boxLabel}>Reported By</Text>
              <Text style={styles.userNameText}>{issue.user_name || "Citizen"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* ADMIN ACTIONS BOTTOM PANEL */}
      <View style={styles.adminPanel}>
        <Text style={styles.adminPanelTitle}>Admin Actions</Text>
        
        {updating ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 10 }} />
        ) : (
          <View style={styles.actionButtonsRow}>
            
            {/* Processing Button */}
            <TouchableOpacity 
              style={[
                styles.actionBtn, 
                { backgroundColor: currentStatus === 'Processing' ? '#e0e0e0' : COLORS.warning }
              ]}
              disabled={currentStatus === 'Processing'}
              onPress={() => changeStatus('Processing')}
            >
              <Ionicons name="cog" size={20} color={currentStatus === 'Processing' ? '#999' : COLORS.cardBg} />
              <Text style={[
                styles.actionBtnText, 
                currentStatus === 'Processing' && { color: '#999' }
              ]}>Processing</Text>
            </TouchableOpacity>

            {/* Solved Button */}
            <TouchableOpacity 
              style={[
                styles.actionBtn, 
                { backgroundColor: currentStatus === 'Solved' ? '#e0e0e0' : COLORS.success }
              ]}
              disabled={currentStatus === 'Solved'}
              onPress={() => changeStatus('Solved')}
            >
              <Ionicons name="checkmark-circle" size={20} color={currentStatus === 'Solved' ? '#999' : COLORS.cardBg} />
              <Text style={[
                styles.actionBtnText, 
                currentStatus === 'Solved' && { color: '#999' }
              ]}>Solved</Text>
            </TouchableOpacity>

          </View>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Header
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: { padding: 5 },
  headerTitle: { color: COLORS.cardBg, fontSize: 18, fontWeight: 'bold' },

  scrollContent: { paddingBottom: 120 }, // Leave room for fixed bottom panel

  // Hero Image (Larger)
  imageWrapper: { position: 'relative', width: '100%', height: 350, backgroundColor: '#000' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  statusBadge: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3,
  },
  statusBadgeText: { color: COLORS.cardBg, fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },

  // Details
  detailsContainer: { padding: 20 },
  categoryTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textDark },
  dateTimeText: { fontSize: 14, color: COLORS.textLight, marginTop: 5, marginBottom: 20, fontWeight: '500' },

  // Info Boxes
  infoBox: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1, borderColor: COLORS.border,
  },
  infoRow: { flexDirection: 'row' },
  boxLabel: { fontSize: 12, color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  boxValue: { fontSize: 16, color: COLORS.textDark, fontWeight: '600', lineHeight: 22 },
  coordsText: { fontSize: 12, color: COLORS.accent, marginTop: 4, fontFamily: 'monospace' },
  descriptionText: { fontSize: 15, color: COLORS.textDark, lineHeight: 24 },
  
  mapButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 15, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  mapButtonText: { color: COLORS.accent, fontWeight: 'bold', fontSize: 14 },

  // User Button
  userButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1, borderColor: COLORS.border,
    elevation: 1,
  },
  userIconWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e8f4fd', justifyContent: 'center', alignItems: 'center' },
  userNameText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },

  // Admin Actions Panel (Fixed at bottom)
  adminPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.cardBg,
    padding: 20,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5,
  },
  adminPanelTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 15, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 10, marginHorizontal: 5,
  },
  actionBtnText: { color: COLORS.cardBg, fontWeight: 'bold', fontSize: 15, marginLeft: 8 },
});