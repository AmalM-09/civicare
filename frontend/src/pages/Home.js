import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';


const COLORS = {
  primary: '#8e44ad',   
  background: '#f8f4fc',
  cardBg: '#ffffff',
  textDark: '#4a235a',   
  textLight: '#888',
  white: '#ffffff',

  successBg: '#e8f5e9',
  successText: '#27ae60',
  warningBg: '#fff3e0',
  warningText: '#f39c12',
  dangerBg: '#fce4ec',   
  dangerText: '#c0392b'
};

const MOCK_ISSUES = [
  { id: '1', category: 'Pothole', location: 'Main Street, near Bank', status: 'Pending', date: 'Today' },
  { id: '2', category: 'Street Light', location: '4th Avenue Park', status: 'Processing', date: 'Yesterday' },
  { id: '3', category: 'Garbage Dump', location: 'Market Road', status: 'Solved', date: 'Oct 24' },
  { id: '4', category: 'Water Leakage', location: 'Sector 5', status: 'Solved', date: 'Oct 20' },
  { id: '5', category: 'Broken Bench', location: 'City Center', status: 'Pending', date: 'Today' },
];

export default function Home({ navigation }) {

  const activeIssues = MOCK_ISSUES.filter(item => item.status !== 'Solved');
  const solvedIssues = MOCK_ISSUES.filter(item => item.status === 'Solved');

  const getStatusColor = (status) => {
    switch (status) {
      case 'Solved': return COLORS.successBg;    
      case 'Processing': return COLORS.warningBg; 
      default: return COLORS.dangerBg;          
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'Solved': return COLORS.successText;    
      case 'Processing': return COLORS.warningText; 
      default: return COLORS.dangerText;          
    }
  };

  const IssueCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.categoryTitle}>{item.category}</Text>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location-sharp" size={14} color={COLORS.primary} />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        </View>
        
        <View style={[styles.statusContainer, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusTextColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.dateText}>Reported: {item.date}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBg} />

      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>CiviCare</Text>
          <Text style={styles.greeting}>Welcome back, Citizen</Text>
        </View>
        
        <TouchableOpacity style={styles.profileIcon}>
           <Ionicons name="person-circle-outline" size={40} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.sectionHeader}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>In Progress</Text>
          </View>
          <Text style={styles.sectionCount}>{activeIssues.length} active</Text>
        </View>

        {activeIssues.map((item) => (
          <IssueCard key={item.id} item={item} />
        ))}

        <View style={[styles.sectionHeader, { marginTop: 25 }]}>
          <View style={styles.headerTitleRow}>
             <Ionicons name="checkmark-done-circle-outline" size={20} color={COLORS.successText} style={{ marginRight: 6 }} />
             <Text style={styles.sectionTitle}>Past Resolutions</Text>
          </View>
          <Text style={styles.sectionCount}>{solvedIssues.length} solved</Text>
        </View>

        {solvedIssues.map((item) => (
          <IssueCard key={item.id} item={item} />
        ))}

      </ScrollView>

     
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => console.log("Go to Report Page")}
      >
        <Ionicons name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, 
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: COLORS.cardBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  appName: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary, 
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark, 
  },
  sectionCount: {
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: '#ede7f6', 
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 15, 
    padding: 18,
    marginBottom: 12,
    elevation: 2, 
    shadowColor: COLORS.primary, 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#bdc3c7',
    marginTop: 12,
    textAlign: 'right'
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: COLORS.primary, 
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
});