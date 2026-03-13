import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from '@expo/vector-icons';
import axios from "axios";
import { BASE_URL } from "../../../config"; 

// THEME COLORS (Violet & Pink)
const COLORS = {
  primary: '#8e44ad',
  primaryLight: '#9b59b6',
  background: '#f8f4fc',
  cardBg: '#ffffff',
  textDark: '#2d3436',
  textLight: '#636e72',
  border: '#fce4ec',
  white: '#ffffff',
  success: '#27ae60'
};

const RegisterScreen = ({ navigation }) => {
  // --- COMMON STATE ---
  const [role, setRole] = useState("Citizen"); // Citizen, Worker, Admin
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // --- CITIZEN STATE ---
  const [aadhaar, setAadhaar] = useState("");
  const [location, setLocation] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // --- WORKER STATE ---
  const [department, setDepartment] = useState("");
  const [empId, setEmpId] = useState("");


  // Fetch Location for Citizens
  useEffect(() => {
    if (role === "Citizen" && !location) {
      (async () => {
        setFetchingLocation(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location is required for Citizens.");
          setFetchingLocation(false);
          return;
        }
        try {
          let currentLocation = await Location.getCurrentPositionAsync({});
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude
          });
        } catch (error) {
          Alert.alert("Error", "Could not fetch location.");
        } finally {
          setFetchingLocation(false);
        }
      })();
    }
  }, [role]);

  const handleRegister = async () => {
    // 1. Common Validation
    if (!name || !phone || !password) {
      return Alert.alert("Missing Fields", "Please fill in your Name, Phone, and Password.");
    }
    if (phone.length !== 10) {
      return Alert.alert("Invalid Phone", "Phone number must be exactly 10 digits.");
    }

    // 2. Base Payload
    let userData = {
      role: role, 
      name: name,
      mobile: phone,
      password: password,
    };

    // 3. Role-Specific Validation & Payload
    if (role === "Citizen") {
      if (!aadhaar || aadhaar.length !== 12) return Alert.alert("Error", "Valid 12-digit Aadhaar is required.");
      userData.aadhaar = aadhaar;
      userData.location = location || { latitude: 0, longitude: 0 };
    } 
    else if (role === "Worker") {
      if (!department || !empId) return Alert.alert("Error", "Department and Employee ID are required.");
      userData.department = department; // Must map perfectly to backend schema
      userData.empId = empId;           
    } 
    else if (role === "Admin") {
      if (!adminSecret) return Alert.alert("Error", "Admin Secret Key is required.");
      userData.adminSecret = adminSecret; 
    }

    // 4. API Request
    setLoading(true);
    try {
      // ✅ FIXED: Everyone goes to the exact same endpoint now!
      const FINAL_API_URL = `${BASE_URL}/register`;

      const res = await axios.post(FINAL_API_URL, userData);
      
      if (res.data.status === "ok") {
        Alert.alert("Success!", `${role} account created successfully!`);
        navigation.navigate("Login");
      } else {
        // Displays error from backend (e.g., "Worker already exists!")
        Alert.alert("Registration Failed", res.data.data); 
      }
    } catch (error) {
      console.log("Network Error:", error);
      Alert.alert("Error", "Could not connect to server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: COLORS.background }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Join CiviCare</Text>
          <Text style={styles.subtitle}>Select your role to get started</Text>
        </View>

        {/* Role Selector */}
        <View style={styles.roleSelector}>
          {["Citizen", "Worker"].map((r) => (
            <TouchableOpacity 
              key={r}
              style={[styles.roleBtn, role === r && styles.roleBtnActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputBox}>
            <Ionicons name="person-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Enter your full name" value={name} onChangeText={setName} />
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputBox}>
            <Ionicons name="call-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="10-digit mobile" keyboardType="numeric" maxLength={10} value={phone} onChangeText={setPhone} />
          </View>

          {/* DYNAMIC FIELDS: CITIZEN */}
          {role === "Citizen" && (
            <>
              <Text style={styles.label}>Aadhaar Number</Text>
              <View style={styles.inputBox}>
                <Ionicons name="card-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="12-digit Aadhaar" keyboardType="numeric" maxLength={12} value={aadhaar} onChangeText={setAadhaar} />
              </View>

              <View style={styles.locationBox}>
                {fetchingLocation ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons name={location ? "location" : "location-outline"} size={22} color={location ? COLORS.success : COLORS.textLight} />
                )}
                <Text style={[styles.locationText, location && { color: COLORS.success, fontWeight: 'bold' }]}>
                  {fetchingLocation ? " Fetching GPS..." : location ? " Location Captured" : " Location Required"}
                </Text>
              </View>
            </>
          )}

          {/* DYNAMIC FIELDS: WORKER */}
          {role === "Worker" &&(
            <>
              <Text style={styles.label}>Department</Text>
              <View style={styles.inputBox}>
                <Ionicons name="business-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="e.g. Water Authority, KSEB" value={department} onChangeText={setDepartment} />
              </View>

              <Text style={styles.label}>Employee ID</Text>
              <View style={styles.inputBox}>
                <Ionicons name="id-card-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter your Worker ID" value={empId} onChangeText={setEmpId} />
              </View>
            </>
          )}

          {/* COMMON: PASSWORD */}
          <Text style={styles.label}>Create Password</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Secure password" secureTextEntry value={password} onChangeText={setPassword} />
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create {role} Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")} style={{ marginTop: 15 }}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.boldLink}>Login here</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  headerContainer: { alignItems: "center", marginBottom: 25 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 28, fontWeight: "900", color: COLORS.primary, marginBottom: 5 },
  subtitle: { fontSize: 15, color: COLORS.textLight, fontWeight: '500' },
  
  // Segmented Control
  roleSelector: { flexDirection: 'row', backgroundColor: '#eaddf0', borderRadius: 15, padding: 5, marginBottom: 25 },
  roleBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  roleBtnActive: { backgroundColor: COLORS.cardBg, elevation: 3, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  roleBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.textLight },
  roleBtnTextActive: { color: COLORS.primary, fontWeight: '900' },

  // Form
  formContainer: { backgroundColor: COLORS.cardBg, padding: 25, borderRadius: 25, elevation: 5, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 15 },
  label: { fontSize: 12, color: COLORS.primary, marginBottom: 6, fontWeight: "800", textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 5 },
  
  // Inputs with Icons
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#f9f9f9", borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: "#f1f2f6" },
  inputIcon: { paddingHorizontal: 15 },
  input: { flex: 1, paddingVertical: 15, paddingRight: 15, fontSize: 15, color: COLORS.textDark, fontWeight: '500' },
  
  locationBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#dcfce7' },
  locationText: { marginLeft: 10, fontSize: 14, color: COLORS.textLight },

  button: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: "center", marginTop: 10, elevation: 3, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 5 },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: "bold" },
  linkText: { textAlign: "center", color: COLORS.textLight, fontSize: 14, fontWeight: '500' },
  boldLink: { color: COLORS.primary, fontWeight: "800" },
});