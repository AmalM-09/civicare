import { BASE_URL } from '../../config';
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = `${BASE_URL}/create-issue`; 
const GET_ISSUES_URL = `${BASE_URL}/get-issues`; 

const COLORS = {
  primary: '#8e44ad',
  background: '#f8f4fc',
  cardBg: '#ffffff',
  textDark: '#4a235a',
  placeholder: '#a090b0',
  white: '#ffffff',
  grey: '#bdc3c7',
  error: '#c0392b'
};

const CATEGORIES = ['Pothole', 'Street Light', 'Garbage', 'Water Leak', 'Other'];

export default function ReportIssueScreen({ navigation }) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(null);
  const [image, setImage] = useState(null);
  const [locationData, setLocationData] = useState(null); 
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [submitting, setSubmitting] = useState(false); 

  // 1. Take Photo
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Camera access is needed to take evidence.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 2. Get Location
  const getLocation = async () => {
    setLoadingLoc(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Location access is required.");
      setLoadingLoc(false);
      return;
    }

    try {
      let currentPos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest, 
      });
      
      const { latitude, longitude } = currentPos.coords;
      let addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      let addressName = "Unknown Location";
      if (addressResponse.length > 0) {
        const addr = addressResponse[0];
        const addressParts = [
          addr.name, addr.street, addr.district || addr.subregion, addr.city, addr.postalCode
        ];
        addressName = addressParts.filter(part => part && part !== 'null').join(', '); 
      }

      if (!addressName || addressName.trim() === "") {
        addressName = `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`;
      }

      setLocationData({ name: addressName, latitude, longitude });

    } catch (error) {
      Alert.alert("Error", "Could not fetch location details.");
    } finally {
      setLoadingLoc(false);
    }
  };

  // 3. Submit to Database
  const handleSubmit = async () => {
    // --- VALIDATION ---
    if (!image) return Alert.alert("Missing Photo", "Please take a photo of the issue.");
    if (!locationData) return Alert.alert("Missing Location", "Please click 'Get My Live Location'.");
    if (!category) return Alert.alert("Missing Category", "Please select an issue category.");
    if (!description.trim()) return Alert.alert("Missing Description", "Please add a brief description.");

    setSubmitting(true);

    try {
        // --- FETCH REAL USER ID ---
        const storedUser = await AsyncStorage.getItem('user_data');
        if (!storedUser) {
            Alert.alert("Error", "You must be logged in to report an issue.");
            setSubmitting(false);
            return;
        }
        
        const user = JSON.parse(storedUser);
        const actualUserId = user._id; 

        // --- DUPLICATE CHECK ---
        try {
            const checkRes = await axios.get(GET_ISSUES_URL);
            if (checkRes.data.status === "ok") {
                const existingIssues = checkRes.data.data;
                
                // We only check for duplicates if the category is NOT "Other"
                const isDuplicate = existingIssues.some(
                    issue => category !== 'Other' && 
                             issue.category === category && 
                             issue.locationName === locationData.name &&
                             issue.status !== "Solved" 
                );

                if (isDuplicate) {
                    Alert.alert(
                        "Already Reported", 
                        "An active issue for this category at this exact location has already been reported by a citizen.",
                        [{ 
                            text: "OK", 
                            onPress: () => navigation.goBack() // Returns to Home instantly
                        }]
                    );
                    setSubmitting(false);
                    return; // Stop the submission here
                }
            }
        } catch (checkError) {
            console.log("Duplicate check failed, proceeding with submission...", checkError);
        }
        // -----------------------------

        // A. Convert Image to Base64 String
        const base64Img = await FileSystem.readAsStringAsync(image, {
            encoding: 'base64', 
        });
        const formattedImage = `data:image/jpeg;base64,${base64Img}`;

        // B. Prepare Data Payload
        const issueData = {
            category: category,
            description: description,
            locationName: locationData.name,
            coordinates: {
                lat: locationData.latitude,
                long: locationData.longitude
            },
            image: formattedImage, 
            user_id: actualUserId, 
        };

        // C. Send to Backend
        const response = await axios.post(API_URL, issueData);

        if (response.data.status === "ok") {
            Alert.alert("Success", "Issue Reported Successfully!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } else {
            Alert.alert("Server Error", response.data.data || "Could not save report.");
        }

    } catch (error) {
        console.log("Upload Error:", error);
        Alert.alert("Error", "Failed to connect to server. Check your internet or IP address.");
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Report</Text>
          <View style={{width: 24}} /> 
        </View>

        {/* 1. Camera Section */}
        <Text style={styles.label}>1. Evidence Photo *</Text>
        <TouchableOpacity style={styles.imageContainer} onPress={takePhoto}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Ionicons name="camera" size={40} color={COLORS.primary} />
              <Text style={styles.cameraText}>Tap to take photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 2. Location Section */}
        <Text style={styles.label}>2. Location *</Text>
        <TouchableOpacity style={styles.locationButton} onPress={getLocation}>
          {loadingLoc ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : locationData ? (
             <View style={styles.locationResult}>
                <Ionicons name="location-sharp" size={24} color={COLORS.primary} />
                <View style={{marginLeft: 10, flex: 1}}>
                  <Text style={styles.locationName}>{locationData.name}</Text>
                  <Text style={styles.locationCoords}>
                    {locationData.latitude.toFixed(5)}, {locationData.longitude.toFixed(5)}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
             </View>
          ) : (
            <View style={styles.locationPlaceholder}>
              <Ionicons name="locate" size={20} color={COLORS.white} />
              <Text style={styles.locationBtnText}>Get My Live Location</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 3. Category Section */}
        <Text style={styles.label}>3. Category *</Text>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              style={[
                styles.categoryChip, 
                category === cat && styles.categoryChipSelected
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[
                styles.categoryText, 
                category === cat && styles.categoryTextSelected
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. Description Section */}
        <Text style={styles.label}>4. Description *</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe the issue..."
          placeholderTextColor={COLORS.placeholder}
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
        />

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, submitting && { backgroundColor: COLORS.grey }]} 
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
             <ActivityIndicator color="#fff" />
          ) : (
             <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  label: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginTop: 20, marginBottom: 8 },
  
  // Camera
  imageContainer: {
    height: 200,
    backgroundColor: '#ede7f6',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#d1c4e9',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholder: { alignItems: 'center' },
  cameraText: { color: COLORS.primary, marginTop: 8, fontWeight: '600' },
  previewImage: { width: '100%', height: '100%' },

  // Location
  locationButton: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 1,
  },
  locationPlaceholder: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  locationBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
  
  locationResult: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  locationName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  locationCoords: { fontSize: 12, color: COLORS.grey, marginTop: 2 },

  // Category
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 25,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  categoryChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryText: { color: '#7f8c8d', fontWeight: '500' },
  categoryTextSelected: { color: '#fff', fontWeight: 'bold' },

  // Input
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#eee',
    color: COLORS.textDark,
    fontSize: 16
  },

  // Submit
  submitButton: {
    marginTop: 40,
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
});