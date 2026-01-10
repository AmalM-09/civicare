import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import axios from "axios";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location required");
        return;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
    })();
  }, []);

 const handleRegister = async () => {
  if (!name || !phone || !aadhaar || !password) {
    Alert.alert("Error", "Fill all fields");
    return;
  }

  if (phone.length !== 10) {
    Alert.alert("Error", "Phone must be 10 digits");
    return;
  }

  if (aadhaar.length !== 12) {
    Alert.alert("Error", "Aadhaar must be 12 digits");
    return;
  }

  const userData = {
    name,
    mobile: phone, 
    aadhaar,
    password,
    location: {
      latitude: location?.latitude,
      longitude: location?.longitude,
    },
  };

  try {
    const res = await axios.post(
      "http://10.100.173.99:8001/register",
      userData
    );

    Alert.alert("Success", res.data.message || "Account created");
    navigation.navigate("Login");
  } catch (error) {
    Alert.alert(
      "Error",
      error.response?.data?.message || "Registration failed"
    );
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

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
        {location ? "📍 Location Captured" : "📍 Fetching Location..."}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f2f2f2",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  locationText: {
    textAlign: "center",
    marginBottom: 15,
    color: "#555",
  },
  button: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    textAlign: "center",
    color: "#007BFF",
    fontSize: 16,
  },
});
