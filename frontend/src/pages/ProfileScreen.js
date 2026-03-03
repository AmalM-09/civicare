import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { BASE_URL } from '../../config';

const COLORS = {
  primary: '#8e44ad',
  primaryDark: '#5e2d73',
  background: '#f8f4fc',
  white: '#ffffff',
  textDark: '#4a235a',
  textLight: '#7f8c8d',
  cardBg: '#ffffff',
  danger: '#c0392b'
};

const ProfileScreen = ({ navigation }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Default empty states
  const [user, setUser] = useState({
    name: "Loading...",
    mobile: "...",
    aadhaar: "...",
    location: "Kochi, Kerala",
  });
  const [stats, setStats] = useState({ reported: 0, solved: 0, pending: 0 });

  useFocusEffect(
    useCallback(() => {
      const fetchProfileData = async () => {
        try {
          // 1. Get the actual logged-in user's ID from local storage
          const storedData = await AsyncStorage.getItem('user_data');
          if (!storedData) return;
          
          const parsedUser = JSON.parse(storedData);
          const actualUserId = parsedUser._id;

          // 2. Load Profile Image from local storage
          const savedImage = await AsyncStorage.getItem('profile_image');
          if (savedImage) setProfileImage(savedImage);

          // 3. Ask Backend for fresh User Details & Stats
          const response = await axios.post(`${BASE_URL}/get-profile-data`, {
             user_id: actualUserId
          });

          if (response.data.status === "ok") {
             const dbData = response.data.data;
             
             // --- NEW: Format the location object into a string ---
             let displayLocation = "Location not set";
             if (parsedUser.location) {
                 if (typeof parsedUser.location === 'object' && parsedUser.location.latitude) {
                     // If it's an object, format it nicely
                     displayLocation = `Lat: ${parsedUser.location.latitude.toFixed(4)}, Lng: ${parsedUser.location.longitude.toFixed(4)}`;
                 } else if (typeof parsedUser.location === 'string') {
                     // If it's already a string, just use it
                     displayLocation = parsedUser.location;
                 }
             }
             // ----------------------------------------------------

             // Update UI with real Database Data
             setUser({
               name: dbData.user.name,
               mobile: dbData.user.mobile,
               aadhaar: dbData.user.aadhaar,
               location: displayLocation, // <-- Now passing a safe string!
             });
             
             setStats(dbData.stats);
          }

        } catch (error) {
          console.log("Profile Fetch Error:", error);
          Alert.alert("Error", "Could not load profile data from the server.");
        } finally {
          setLoading(false);
        }
      };

      fetchProfileData();
    }, [])
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "We need access to your gallery to change the photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      const newImageUri = result.assets[0].uri;
      setProfileImage(newImageUri);
      await AsyncStorage.setItem('profile_image', newImageUri);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* HEADER SECTION */}
      <View style={styles.headerBackground}>
        <SafeAreaView>
          <View style={styles.headerNav}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
               <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Profile</Text>
            <View style={{width: 24}} /> 
          </View>

          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
               <Image 
                 source={profileImage ? { uri: profileImage } : { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
                 style={styles.avatar} 
               />
               <View style={styles.editBadge}>
                 <Ionicons name="camera" size={12} color={COLORS.white} />
               </View>
            </TouchableOpacity>
            
            {loading ? <ActivityIndicator color="#fff" style={{marginTop: 5}}/> : <Text style={styles.userName}>{user.name}</Text>}
          </View>
        </SafeAreaView>
      </View>

      {/* SCROLLABLE CONTENT */}
      <ScrollView 
        style={styles.contentContainer} 
        contentContainerStyle={{ paddingBottom: 50 }} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Stats Card */}
        <View style={styles.statsCard}>
           <View style={styles.statItem}>
             <Text style={styles.statNumber}>{stats.reported}</Text>
             <Text style={styles.statLabel}>Reported</Text>
           </View>
           <View style={styles.divider} />
           <View style={styles.statItem}>
             <Text style={[styles.statNumber, {color: COLORS.successText}]}>{stats.solved}</Text>
             <Text style={styles.statLabel}>Solved</Text>
           </View>
           <View style={styles.divider} />
           <View style={styles.statItem}>
             <Text style={[styles.statNumber, {color: '#f39c12'}]}>{stats.pending}</Text>
             <Text style={styles.statLabel}>Pending</Text>
           </View>
        </View>

        {/* Details Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Personal Details</Text>
          <InfoRow icon="call-outline" label="Mobile Number" value={user.mobile} />
          <InfoRow icon="card-outline" label="Aadhaar Number" value={user.aadhaar} />
          <InfoRow icon="location-outline" label="Location" value={user.location} />
        </View>

        {/* Action Buttons */}
        <View style={{ marginTop: 20 }}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EditProfile')}>
             <Text style={styles.actionText}>Edit Profile Details</Text>
             <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('History')}>
             <Text style={styles.actionText}>History</Text>
             <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
           <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
           <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerBackground: {
    backgroundColor: COLORS.primary,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 5,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  profileHeader: { alignItems: 'center', marginTop: 10 }, 
  avatarContainer: { position: 'relative', marginBottom: 5 },
  avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' }, 
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: COLORS.primaryDark,
    padding: 4, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.white
  },
  userName: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  contentContainer: { flex: 1, paddingHorizontal: 20 },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginTop: 7, 
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  statLabel: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  divider: { width: 1, height: '70%', backgroundColor: '#eee' },
  sectionContainer: { marginTop: 15 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 10, borderRadius: 10, marginBottom: 8,
    borderWidth: 1, borderColor: '#f0f0f0'
  },
  iconBox: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#f3e5f5',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12
  },
  infoLabel: { fontSize: 10, color: COLORS.textLight },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  actionButton: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, padding: 15, borderRadius: 12, marginBottom: 10,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05
  },
  actionText: { fontSize: 15, fontWeight: '500', color: COLORS.textDark },
  logoutButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 10, padding: 15,
    borderWidth: 1, borderColor: COLORS.danger, borderRadius: 12,
    backgroundColor: '#fff5f5'
  },
  logoutText: { color: COLORS.danger, fontWeight: 'bold', fontSize: 15, marginLeft: 8 }
});