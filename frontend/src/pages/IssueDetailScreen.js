import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// --- THEME COLORS ---
const COLORS = {
  primary: '#8e44ad',
  background: '#f8f4fc',
  cardBg: '#ffffff',
  textDark: '#4a235a',
  textLight: '#7f8c8d',
  white: '#ffffff',
  successBg: '#e8f5e9',
  successText: '#27ae60',
  warningBg: '#fff3e0',
  warningText: '#f39c12',
  dangerBg: '#fce4ec',
  dangerText: '#c0392b'
};

export default function IssueDetailScreen({ route, navigation }) {
  // 1. Receive the specific issue data passed from Home
  const { issue } = route.params;

  // Helper: Format MongoDB Date (ISO String) to Readable Date
  const formatDate = (isoDate) => {
    if (!isoDate) return "Just now";
    const date = new Date(isoDate);
    return date.toDateString(); // e.g., "Mon Oct 24 2025"
  };

  // Helper: Status Colors
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
console.log("WHAT IS USER ID?", issue.user_id);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Hero Image Section */}
      <View style={styles.imageContainer}>
        <Image 
          // DB FIELD NAME IS "image" (Base64 string)
          source={issue.image ? { uri: issue.image } : { uri: 'https://via.placeholder.com/400x300.png?text=No+Image' }} 
          style={styles.image} 
        />
        
        {/* Back Button Overlay */}
        <SafeAreaView style={styles.backButtonSafeArea}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {/* Content Container */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        
        {/* Title & Status Row */}
        <View style={styles.headerRow}>
          <Text style={styles.categoryTitle}>{issue.category}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(issue.status) }]}>
            <Text style={[styles.statusText, { color: getStatusTextColor(issue.status) }]}>
              {issue.status}
            </Text>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Ionicons name="location-sharp" size={20} color={COLORS.primary} />
            <Text style={styles.sectionLabel}>Location</Text>
          </View>
          {/* DB FIELD NAME IS "locationName" */}
          <Text style={styles.bodyText}>{issue.locationName || "Location not available"}</Text>
        </View>

        {/* Date Section */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionLabel}>Date Reported</Text>
          </View>
          <Text style={styles.bodyText}>{formatDate(issue.date)}</Text>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
           <Text style={styles.sectionHeader}>Description</Text>
           <Text style={styles.descriptionText}>
             {issue.description || "No additional details provided for this issue."}
           </Text>
        </View>

        {/* Reporter Section */}
    {/* Reporter Section */}
        <View style={styles.reporterCard}>
           <Ionicons name="person-circle" size={40} color={COLORS.primary} />
           <View style={{marginLeft: 12}}>
              <Text style={styles.reporterLabel}>Reported by</Text>
              
              <Text style={styles.reporterName}>
                {/* Just read the newly attached user_name! */}
                {issue.user_name || "Citizen"}
              </Text> 
              
           </View>
        </View>

      </ScrollView>
    </View>
  );
  
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Image Styles
  imageContainer: { height: 300, width: '100%' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  backButtonSafeArea: { position: 'absolute', top: 10, left: 20 },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 8,
    borderRadius: 20,
  },

  // Content Styles
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: -20, 
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  categoryTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.textDark },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontWeight: 'bold', fontSize: 14 },

  section: { marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.textLight, marginLeft: 8 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 8 },
  
  bodyText: { fontSize: 16, color: COLORS.textDark, marginLeft: 28, lineHeight: 22 },
  descriptionText: { fontSize: 16, color: '#555', lineHeight: 24 },

  reporterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 15,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#eee'
  },
  reporterLabel: { fontSize: 12, color: COLORS.textLight },
  reporterName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
});