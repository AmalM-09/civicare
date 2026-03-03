import React, { useState, useEffect } from "react";
import { BASE_URL } from "../../../config";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView 
} from "react-native";
import * as Location from "expo-location";
import axios from "axios";

const API_URL = `${BASE_URL}/register`; 

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location is required to register.");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
    })();
  }, []);

  const handleRegister = async () => {
    // Validation
    if (!name || !phone || !aadhaar || !password) {
      return Alert.alert("Missing Fields", "Please fill in all details.");
    }
    if (phone.length !== 10) {
      return Alert.alert("Invalid Phone", "Phone number must be 10 digits.");
    }

    const userData = {
      name: name,
      mobile: phone,
      aadhaar: aadhaar,
      password: password,
      location: {
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
      },
    };

    try {
      console.log("Sending Data:", userData); 

      const res = await axios.post(API_URL, userData);
      
      console.log("Server Response:", res.data); 

      if (res.data.status === "ok") {
        Alert.alert("Success", "Account created successfully!");
        navigation.navigate("Login");
      } else {
        Alert.alert("Registration Failed", res.data.data);
      }
    } catch (error) {
      console.log("Network Error:", error);
      Alert.alert("Error", "Could not connect to server. Check IP Address.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        keyboardType="numeric"
        maxLength={10}
        value={phone}
        onChangeText={setPhone}
      />

      <TextInput
        style={styles.input}
        placeholder="Aadhaar Number"
        keyboardType="numeric"
        maxLength={12}
        value={aadhaar}
        onChangeText={setAadhaar}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.locationText}>
        {location ? "✅ Location Captured" : "📍 Fetching Location..."}
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f2f2f2",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    elevation: 2, 
  },
  locationText: {
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
    fontWeight: "500"
  },
  button: {
    backgroundColor: "#8e44ad", 
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    textAlign: "center",
    color: "#8e44ad",
    fontSize: 16,
    marginTop: 10
  },
});