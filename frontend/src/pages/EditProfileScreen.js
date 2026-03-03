import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// --- IMPORT YOUR BASE URL ---
import { BASE_URL } from '../../config'; 

const COLORS = {
  primary: '#8e44ad',
  background: '#f8f4fc',
  white: '#ffffff',
  textDark: '#4a235a',
  textLight: '#7f8c8d',
  inputBg: '#ffffff',
  danger: '#c0392b',
  disabled: '#f0f0f0'
};

export default function EditProfileScreen({ navigation }) {
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [location, setLocation] = useState('');
  const [aadhaar, setAadhaar] = useState(''); 
  const [loading, setLoading] = useState(false);

  // 1. Load existing data from storage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('user_data');
        if (storedData) {
          const user = JSON.parse(storedData);
          setUserId(user._id); 
          setName(user.name || '');
          setMobile(user.mobile || '');
          setAadhaar(user.aadhaar || '');
          
          if (user.location && typeof user.location === 'object') {
             setLocation(`Lat: ${user.location.latitude.toFixed(4)}, Lng: ${user.location.longitude.toFixed(4)}`);
          } else {
             setLocation(user.location || '');
          }
        }
      } catch (error) {
        console.log("Error loading data", error);
      }
    };
    loadUserData();
  }, []);

  // 2. Handle Save Button
  const handleSave = async () => {
    if (!name || !mobile || !location) {
      Alert.alert("Missing Fields", "Name, Mobile, and Location are required.");
      return;
    }

    setLoading(true);

    try {
      // Send the update request to the backend including the new location
      const response = await axios.post(`${BASE_URL}/update-profile`, {
        user_id: userId,
        name: name,
        mobile: mobile,
        location: location // <-- Added to payload
      });

      if (response.data.status === "ok") {
        const updatedUserDB = response.data.data;

        // Fetch old storage, merge with new details, and save
        const storedData = await AsyncStorage.getItem('user_data');
        let currentUser = JSON.parse(storedData);
        currentUser.name = updatedUserDB.name;
        currentUser.mobile = updatedUserDB.mobile;
        currentUser.location = updatedUserDB.location; // <-- Save location to local storage

        await AsyncStorage.setItem('user_data', JSON.stringify(currentUser));

        Alert.alert("Success", "Profile details updated successfully!", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert("Error", response.data.data);
      }

    } catch (error) {
      console.log("Update Error:", error);
      Alert.alert("Network Error", "Could not save changes to the database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={COLORS.primary} style={styles.icon} />
            <TextInput 
              style={styles.input} 
              value={name} 
              onChangeText={setName} 
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color={COLORS.primary} style={styles.icon} />
            <TextInput 
              style={styles.input} 
              value={mobile} 
              onChangeText={setMobile} 
              keyboardType="phone-pad"
              placeholder="Enter mobile number"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          {/* UNLOCKED: Users can now freely type their city/location */}
          <Text style={styles.label}>Location / City</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} style={styles.icon} />
            <TextInput 
              style={styles.input} 
              value={location} 
              onChangeText={setLocation} 
              placeholder="E.g., Kochi, Kerala"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <Text style={styles.label}>Aadhaar Number (Locked)</Text>
          <View style={[styles.inputContainer, styles.disabledInput]}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} style={styles.icon} />
            <TextInput 
              style={[styles.input, { color: COLORS.textLight }]} 
              value={aadhaar} 
              editable={false} 
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: COLORS.white, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  formContainer: { padding: 25 },
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 8, marginTop: 15 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 12, paddingHorizontal: 15, paddingVertical: 14, borderWidth: 1,
    borderColor: '#eee', marginBottom: 5
  },
  disabledInput: { backgroundColor: COLORS.disabled, borderColor: '#e0e0e0' },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: COLORS.textDark },
  saveButton: {
    backgroundColor: COLORS.primary, padding: 18, borderRadius: 12, alignItems: 'center',
    marginTop: 40, elevation: 4, shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,
  },
  saveButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' }
});