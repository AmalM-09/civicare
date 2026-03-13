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
  const { issue } = route.params;

  const formatDate = (isoDate) => {
    if (!isoDate) return "Just now";
    const date = new Date(isoDate);
    return date.toDateString(); 
  };

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Hero Image Section (Original Photo) */}
      <View style={styles.imageContainer}>
        <Image 
          source={issue.image ? { uri: issue.image } : { uri: 'https://via.placeholder.com/400x300.png?text=No+Image' }} 
          style={styles.image} 
        />
        
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

        {/* ✨ NEW: RESOLUTION PROOF SECTION ✨ */}
        {issue.status === 'Solved' && issue.completed_image && (
          <View style={styles.resolutionCard}>
            <View style={styles.resolutionHeaderRow}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.successText} />
              <Text style={styles.resolutionTitle}>Resolution Proof</Text>
            </View>
            <Image 
              source={{ uri: issue.completed_image }} 
              style={styles.completedImage} 
            />
            {/* Show resolved date if you added it to the DB schema, otherwise omit */}
            {issue.resolved_date && (
              <Text style={styles.resolvedDateText}>
                Resolved on {formatDate(issue.resolved_date)}
              </Text>
            )}
          </View>
        )}

        {/* Reporter Section */}
        <View style={styles.reporterCard}>
           <Ionicons name="person-circle" size={40} color={COLORS.primary} />
           <View style={{marginLeft: 12}}>
              <Text style={styles.reporterLabel}>Reported by</Text>
              <Text style={styles.reporterName}>
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
  categoryTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.textDark, flex: 1, marginRight: 10 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontWeight: 'bold', fontSize: 14 },

  section: { marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.textLight, marginLeft: 8 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 8 },
  
  bodyText: { fontSize: 16, color: COLORS.textDark, marginLeft: 28, lineHeight: 22 },
  descriptionText: { fontSize: 16, color: '#555', lineHeight: 24 },

  // ✨ Resolution Proof Card Styles ✨
  resolutionCard: {
    backgroundColor: COLORS.successBg,
    padding: 18,
    borderRadius: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#c8e6c9', // light green border
  },
  resolutionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resolutionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.successText,
    marginLeft: 8,
  },
  completedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  resolvedDateText: {
    fontSize: 13,
    color: COLORS.successText,
    marginTop: 10,
    fontWeight: '500',
    textAlign: 'center'
  },

  reporterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 15,
    borderRadius: 15,
    marginTop: 5,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#eee'
  },
  reporterLabel: { fontSize: 12, color: COLORS.textLight },
  reporterName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
});