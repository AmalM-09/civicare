import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Image, ScrollView, 
  TouchableOpacity, StatusBar, Alert, ActivityIndicator,
  Linking 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import axios from 'axios';
import { BASE_URL } from '../../config';

const COLORS = {
  primary: '#8e44ad',
  background: '#ffffff', // Changed to pure white for a cleaner look
  textDark: '#333333',
  textLight: '#666666',
  white: '#ffffff',
  success: '#27ae60',
  warning: '#f39c12',
  danger: '#c0392b',
  border: '#e0e0e0'
};

export default function WorkerIssueDetailScreen({ route, navigation }) {
  const { issue } = route.params;
  
  const [currentStatus, setCurrentStatus] = useState(issue.status);
  const [completedImage, setCompletedImage] = useState(issue.completed_image || null);
  const [previewImage, setPreviewImage] = useState(null); 
  const [uploading, setUploading] = useState(false);

  const formatDate = (isoDate) => {
    if (!isoDate) return "Date not available";
    return new Date(isoDate).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const openMaps = () => {
    if (issue.coordinates && issue.coordinates.lat && issue.coordinates.long) {
      const url = `https://maps.google.com/?q=${issue.coordinates.lat},${issue.coordinates.long}`;
      Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open Google Maps."));
    } else {
      Alert.alert("Location Error", "Exact GPS coordinates were not provided.");
    }
  };

  const handleCompleteWork = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Camera access is needed to provide proof of work.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPreviewImage(result.assets[0].uri);
    }
  };

  const submitCompletedWork = async () => {
    if (!previewImage) return;
    
    setUploading(true);
    try {
      const base64Img = await FileSystem.readAsStringAsync(previewImage, { encoding: 'base64' });
      const formattedImage = `data:image/jpeg;base64,${base64Img}`;

      const response = await axios.post(`${BASE_URL}/resolve-issue`, {
        issue_id: issue._id,
        completed_image: formattedImage
      });

      if (response.data.status === "ok") {
        setCompletedImage(formattedImage);
        setCurrentStatus("Solved");
        setPreviewImage(null); 
        Alert.alert("Success", "Issue marked as solved!");
      } else {
        Alert.alert("Upload Failed", response.data.data);
      }
    } catch (error) {
      Alert.alert("Network Error", "Could not submit proof. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Standard Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Simple Top Image */}
        <Image 
          source={issue.image ? { uri: issue.image } : { uri: 'https://via.placeholder.com/400x300.png?text=No+Image' }} 
          style={styles.heroImage} 
        />

        <View style={styles.contentPadding}>
          
          {/* Title & Status */}
          <View style={styles.titleRow}>
            <Text style={styles.categoryTitle}>{issue.category}</Text>
            <Text style={[styles.statusText, { color: currentStatus === 'Solved' ? COLORS.success : COLORS.warning }]}>
              • {currentStatus}
            </Text>
          </View>

          {/* Key Details List */}
          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Reported On</Text>
              <Text style={styles.detailValue}>{formatDate(issue.date)}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{issue.locationName || "Not available"}</Text>
            </View>
          </View>

          {/* Simple Map Button */}
          <TouchableOpacity style={styles.mapBtn} onPress={openMaps}>
            <Ionicons name="map-outline" size={20} color={COLORS.primary} />
            <Text style={styles.mapBtnText}>Open in Google Maps</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {issue.description || "No additional details provided."}
          </Text>

          <View style={styles.divider} />

          {/* ACTION AREA */}
          <Text style={styles.sectionTitle}>Proof of Work</Text>

          {currentStatus === 'Solved' ? (
             <View style={styles.solvedContainer}>
               <View style={styles.solvedRow}>
                 <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                 <Text style={styles.solvedText}>Completed & Uploaded</Text>
               </View>
               <Image source={{ uri: completedImage }} style={styles.actionImage} />
             </View>
             
          ) : previewImage ? (
             <View style={styles.previewContainer}>
               <Image source={{ uri: previewImage }} style={styles.actionImage} />
               <View style={styles.buttonRow}>
                 <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPreviewImage(null)} disabled={uploading}>
                   <Text style={styles.secondaryBtnText}>Retake</Text>
                 </TouchableOpacity>

                 <TouchableOpacity style={styles.primaryBtn} onPress={submitCompletedWork} disabled={uploading}>
                   {uploading ? (
                     <ActivityIndicator color={COLORS.white} />
                   ) : (
                     <Text style={styles.primaryBtnText}>Submit Proof</Text>
                   )}
                 </TouchableOpacity>
               </View>
             </View>
             
          ) : (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleCompleteWork}>
              <Ionicons name="camera-outline" size={22} color={COLORS.white} />
              <Text style={styles.primaryBtnText}>Take Completion Photo</Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },

  // Content
  heroImage: { width: '100%', height: 220, backgroundColor: '#eee', resizeMode: 'cover' },
  contentPadding: { padding: 20, paddingBottom: 40 },
  
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  categoryTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textDark, flex: 1 },
  statusText: { fontSize: 16, fontWeight: 'bold' },

  // Details List
  detailsList: { marginBottom: 15 },
  detailItem: { marginBottom: 15 },
  detailLabel: { fontSize: 13, color: COLORS.textLight, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 16, color: COLORS.textDark, lineHeight: 22 },

  // Maps Button
  mapBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  mapBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: '600', marginLeft: 8 },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10 },
  descriptionText: { fontSize: 16, color: COLORS.textDark, lineHeight: 24 },

  // Action Area
  actionImage: { width: '100%', height: 200, borderRadius: 8, resizeMode: 'cover', marginBottom: 15, backgroundColor: '#f0f0f0' },
  
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  
  primaryBtn: { 
    flex: 1, flexDirection: 'row', backgroundColor: COLORS.primary, 
    padding: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' 
  },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  
  secondaryBtn: { 
    flex: 1, backgroundColor: '#f0f0f0', padding: 16, borderRadius: 8, 
    alignItems: 'center', justifyContent: 'center', marginRight: 10 
  },
  secondaryBtnText: { color: COLORS.textDark, fontSize: 16, fontWeight: 'bold' },

  previewContainer: { marginTop: 10 },
  
  solvedContainer: { marginTop: 10 },
  solvedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  solvedText: { fontSize: 16, fontWeight: 'bold', color: COLORS.success, marginLeft: 8 },
});