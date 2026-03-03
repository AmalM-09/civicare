import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  Image 
} from "react-native";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from "../../../config"; // Import Global IP

const LoginScreen = ({ navigation }) => {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!mobile || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/login-user`, {
        mobile,
        password,
      });

      if (response.data.status === "ok") {
        const userData = response.data.data;
        
        // 1. Save User Data for Profile Page
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        await AsyncStorage.setItem('isLoggedIn', 'true');

        // 2. Go to Home
        Alert.alert("Login Successful", `Welcome back, ${userData.name}!`);
        navigation.replace("Home"); // 'replace' prevents going back to login
      } 


      
      else {
        navigation.replace("AdminHome")
      }





    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Network Error. Check your IP Config.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Login to continue CiviCare</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter 10-digit mobile"
          keyboardType="numeric"
          maxLength={10}
          value={mobile}
          onChangeText={setMobile}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.boldLink}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f8f4fc",
    justifyContent: "center",
    padding: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#8e44ad",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  formContainer: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  label: {
    fontSize: 14,
    color: "#4a235a",
    marginBottom: 8,
    fontWeight: "600"
  },
  input: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  button: {
    backgroundColor: "#8e44ad",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    textAlign: "center",
    color: "#7f8c8d",
    fontSize: 15,
  },
  boldLink: {
    color: "#8e44ad",
    fontWeight: "bold",
  },
});