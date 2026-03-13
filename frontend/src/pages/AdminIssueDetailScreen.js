import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, ScrollView, 
  TouchableOpacity, StatusBar, Alert, ActivityIndicator, Linking, Modal, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '../../config';

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
  border: '#e1e8ed',
  white: '#ffffff'
};

export default function AdminIssueDetailScreen({ route, navigation }) {
  const { issue } = route.params;
  
  const [currentStatus, setCurrentStatus] = useState(issue.status);
  const [assignedWorker, setAssignedWorker] = useState(issue.assigned_worker_name || null);
  const [completedImage, setCompletedImage] = useState(issue.completed_image || null);
  
  const [updating, setUpdating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // ✨ NEW: State for Dynamic Workers
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  // ✨ NEW: Fetch workers from Database
  useEffect(() => {
    const fetchWorkers = async () => {
      setLoadingWorkers(true);
      try {
        const response = await axios.get(`${BASE_URL}/get-workers`);
        if (response.data.status === "ok") {
          setAvailableWorkers(response.data.data);
        }
      } catch (error) {
        console.log("Error fetching workers:", error);
      } finally {
        setLoadingWorkers(false);
      }
    };

    fetchWorkers();
  }, []);

  const formatDetailedDateTime = (isoDate) => {
    if (!isoDate) return "Date not recorded";
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Solved': return COLORS.success;    
      case 'Processing': return COLORS.warning; 
      default: return COLORS.danger;          
    }
  };

  const openMaps = () => {
    if (issue.coordinates && issue.coordinates.lat) {
      const url = `https://www.google.com/maps/search/?api=1&query=${issue.coordinates.lat},${issue.coordinates.long}`;
      Linking.openURL(url);
    } else {
      Alert.alert("Error", "GPS Coordinates not available.");
    }
  };

  const assignIssueToWorker = async (worker) => {
    setModalVisible(false);
    setUpdating(true);
    try {
      const response = await axios.post(`${BASE_URL}/assign-issue`, {
        // Updated to use MongoDB _id
        issue_id: issue._id, worker_id: worker._id, worker_name: worker.name
      });
      if (response.data.status === "ok") {
        setAssignedWorker(worker.name);
        setCurrentStatus('Processing'); 
        Alert.alert("Success", `Issue assigned to ${worker.name}`);
      } else {
        Alert.alert("Error", "Could not assign worker.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Failed to reach the server.");
    } finally {
      setUpdating(false);
    }
  };

  const changeStatus = async (newStatus) => {
    if (currentStatus === newStatus) return;
    Alert.alert("Confirm Action", `Mark this issue as ${newStatus}?`, [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Update", 
          onPress: async () => {
            setUpdating(true);
            try {
              const response = await axios.post(`${BASE_URL}/update-issue-status`, { issue_id: issue._id, status: newStatus });
              if (response.data.status === "ok") {
                setCurrentStatus(newStatus);
                Alert.alert("Success", `Issue marked as ${newStatus}`);
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

  const handleRejectResolution = () => {
    Alert.alert(
      "Reject Work?",
      "This will delete the proof photo and send the task back to 'Processing'.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Reject", 
          style: "destructive",
          onPress: async () => {
            setUpdating(true);
            try {
              const response = await axios.post(`${BASE_URL}/reject-issue-resolution`, { issue_id: issue._id });
              if (response.data.status === "ok") {
                setCurrentStatus("Processing");
                setCompletedImage(null); 
                Alert.alert("Rejected", "The issue has been reopened and sent back to Processing.");
              } else {
                Alert.alert("Error", response.data.data);
              }
            } catch (error) {
              Alert.alert("Network Error", "Could not reach the server.");
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

      {/* WORKER SELECTION MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Worker</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>
            
            {loadingWorkers ? (
               <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 30 }} />
            ) : (
               <FlatList
                 data={availableWorkers}
                 keyExtractor={(item) => item._id} // Fixed to use MongoDB _id
                 renderItem={({ item }) => (
                   <TouchableOpacity style={styles.workerItem} onPress={() => assignIssueToWorker(item)}>
                     <View style={styles.workerAvatar}>
                       <Ionicons name="person" size={20} color={COLORS.primary} />
                     </View>
                     <View style={{ flex: 1, marginLeft: 15 }}>
                       <Text style={styles.workerName}>{item.name}</Text>
                       {/* Fixed to match the schema field 'department' */}
                       <Text style={styles.workerDept}>{item.department}</Text>
                     </View>
                     <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                   </TouchableOpacity>
                 )}
                 ListEmptyComponent={
                    <Text style={{ textAlign: 'center', marginTop: 20, color: COLORS.textLight }}>
                      No workers available right now.
                    </Text>
                 }
               />
            )}
          </View>
        </View>
      </Modal>

      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.cardBg} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Overview</Text>
        <View style={{ width: 24 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.imageWrapper}>
          <Image 
            source={issue.image ? { uri: issue.image } : { uri: 'https://via.placeholder.com/600x400.png?text=No+Image' }} 
            style={styles.heroImage} 
          />
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentStatus) }]}>
            <Text style={styles.statusBadgeText}>{currentStatus}</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          
          <Text style={styles.categoryTitle}>{issue.category}</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={styles.dateTimeText}>{formatDetailedDateTime(issue.date)}</Text>
          </View>

          {/* ASSIGNMENT BOX */}
          <View style={styles.assignmentBox}>
            <View style={{flex: 1}}>
              <Text style={styles.boxLabel}>Assigned Worker</Text>
              <Text style={styles.assignedName}>{assignedWorker || "Unassigned"}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.assignBtn, currentStatus === 'Solved' && { backgroundColor: COLORS.border }]} 
              onPress={() => setModalVisible(true)}
              disabled={updating || currentStatus === 'Solved'} 
            >
              <Text style={[styles.assignBtnText, currentStatus === 'Solved' && { color: COLORS.textLight }]}>
                {currentStatus === 'Solved' ? "Locked" : (assignedWorker ? "Reassign" : "Assign Worker")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ADMIN REVIEW CARD */}
          {currentStatus === 'Solved' && completedImage && (
            <View style={styles.resolutionCard}>
              <View style={styles.resolutionHeaderRow}>
                <Ionicons name="shield-checkmark" size={22} color={COLORS.success} />
                <Text style={styles.resolutionTitle}>Worker Submitted Proof</Text>
              </View>
              <Image source={{ uri: completedImage }} style={styles.completedImg} />
              <TouchableOpacity style={styles.rejectBtn} onPress={handleRejectResolution} disabled={updating}>
                <Ionicons name="close-circle-outline" size={20} color={COLORS.white} />
                <Text style={styles.rejectBtnText}>Reject & Re-open Issue</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Location Box */}
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={22} color={COLORS.accent} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.boxLabel}>Exact Location</Text>
                <Text style={styles.boxValue}>{issue.locationName || "Not Provided"}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.mapButton} onPress={openMaps}>
              <Text style={styles.mapButtonText}>View on Maps</Text>
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

          {/* User Button */}
          <TouchableOpacity style={styles.userButton} onPress={() => navigation.navigate('AdminUserDetails', { userId: issue.user_id })}>
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
        <Text style={styles.adminPanelTitle}>Manual Overrides</Text>
        
        {updating ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 10 }} />
        ) : (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: (currentStatus === 'Processing' || currentStatus === 'Solved') ? '#e0e0e0' : COLORS.warning }]}
              disabled={currentStatus === 'Processing' || currentStatus === 'Solved'}
              onPress={() => changeStatus('Processing')}
            >
              <Text style={[styles.actionBtnText, (currentStatus === 'Processing' || currentStatus === 'Solved') && { color: '#999' }]}>Processing</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: currentStatus === 'Solved' ? '#e0e0e0' : COLORS.success }]}
              disabled={currentStatus === 'Solved'}
              onPress={() => changeStatus('Solved')}
            >
              <Text style={[styles.actionBtnText, currentStatus === 'Solved' && { color: '#999' }]}>Solved</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15 },
  backButton: { padding: 5 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  scrollContent: { paddingBottom: 120 }, 

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  workerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  workerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e8f4fd', justifyContent: 'center', alignItems: 'center' },
  workerName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  workerDept: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },

  imageWrapper: { position: 'relative', width: '100%', height: 320, backgroundColor: '#000' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  statusBadge: { position: 'absolute', bottom: 15, right: 15, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, elevation: 5 },
  statusBadgeText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },

  detailsContainer: { padding: 20 },
  categoryTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textDark },
  dateTimeText: { fontSize: 14, color: COLORS.textLight, fontWeight: '500', marginTop: 5 },

  assignmentBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ebf5fb', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#d6eaf8' },
  assignedName: { fontSize: 18, fontWeight: 'bold', color: COLORS.accent, marginTop: 4 },
  assignBtn: { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  assignBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 13 },

  resolutionCard: { backgroundColor: '#f9fdfa', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 2, borderColor: '#c8e6c9' },
  resolutionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  resolutionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.success, marginLeft: 8 },
  completedImg: { width: '100%', height: 200, borderRadius: 8, resizeMode: 'cover', marginBottom: 15, backgroundColor: '#eee' },
  rejectBtn: { flexDirection: 'row', backgroundColor: COLORS.danger, padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rejectBtnText: { color: COLORS.white, fontSize: 15, fontWeight: 'bold', marginLeft: 8 },

  infoBox: { backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border },
  infoRow: { flexDirection: 'row' },
  boxLabel: { fontSize: 12, color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  boxValue: { fontSize: 16, color: COLORS.textDark, fontWeight: '600', lineHeight: 22 },
  descriptionText: { fontSize: 15, color: COLORS.textDark, lineHeight: 24 },
  
  mapButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  mapButtonText: { color: COLORS.accent, fontWeight: 'bold', fontSize: 14 },

  userButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border, elevation: 1 },
  userIconWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e8f4fd', justifyContent: 'center', alignItems: 'center' },
  userNameText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },

  adminPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.cardBg, padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border, elevation: 10 },
  adminPanelTitle: { fontSize: 12, fontWeight: 'bold', color: COLORS.textLight, marginBottom: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10, marginHorizontal: 5 },
  actionBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 13, marginLeft: 6 },
});