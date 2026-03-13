// import React, { useState, useCallback, useEffect } from 'react';
// import { BASE_URL } from '../../config';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   TouchableOpacity, 
//   StatusBar,
//   ScrollView,
//   ActivityIndicator,
//   RefreshControl,
//   Vibration, 
//   Alert
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { useFocusEffect } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// const API_URL = `${BASE_URL}/get-issues`; 

// const COLORS = {
//   primary: '#8e44ad',   
//   background: '#f8f4fc',
//   cardBg: '#ffffff',
//   textDark: '#4a235a',   
//   textLight: '#888',
//   white: '#ffffff',
//   successBg: '#e8f5e9',
//   successText: '#27ae60',
//   warningBg: '#fff3e0',
//   warningText: '#f39c12',
//   dangerBg: '#fce4ec',   
//   dangerText: '#c0392b'
// };

// export default function Home({ navigation }) {
//   const [issues, setIssues] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   // --- SILENT WARNING POLLING FOR CITIZEN ---
//   useEffect(() => {
//     let interval;

//     const checkForWarnings = async () => {
//       try {
//         // 1. Get the logged-in user's ID
//         const storedData = await AsyncStorage.getItem('user_data');
//         if (!storedData) return;
//         const user = JSON.parse(storedData);

//         // 2. Fetch their latest profile data from the database
//         const response = await axios.post(`${BASE_URL}/get-profile-data`, { user_id: user._id });
        
//         if (response.data.status === "ok") {
//           const currentWarnings = response.data.data.user.warnings || 0;
          
//           // 3. Get the number of warnings they had the last time they checked
//           const lastSeenWarningsStr = await AsyncStorage.getItem(`last_warnings_${user._id}`);
//           const lastSeenWarnings = lastSeenWarningsStr ? parseInt(lastSeenWarningsStr) : 0;

//           // 4. If the database has MORE warnings than the app remembers, trigger the alert!
//           if (currentWarnings > lastSeenWarnings) {
            
//             // Serious Double Vibration
//             Vibration.vibrate([0, 500, 200, 500]); 
            
//             Alert.alert(
//               "⚠️ OFFICIAL WARNING ⚠️",
//               "You have received a formal warning from the administration for providing false or inappropriate information.\n\nFurther violations may result in account suspension.",
//               [
//                 { 
//                   text: "I Understand", 
//                   style: "destructive",
//                   onPress: async () => {
//                     // 5. Update local storage so we don't alert them again for this specific warning
//                     await AsyncStorage.setItem(`last_warnings_${user._id}`, currentWarnings.toString());
//                   }
//                 }
//               ]
//             );
//           }
//         }
//       } catch (error) {
//         console.log("Warning polling error:", error);
//       }
//     };

//     // Check immediately on load, then check every 15 seconds
//     checkForWarnings();
//     interval = setInterval(checkForWarnings, 15000);

//     return () => clearInterval(interval); // Cleanup when they leave the screen
//   }, []);

//   // --- FETCH DATA FROM DB ---
//   const fetchIssues = async () => {
//     try {
//       const response = await axios.get(API_URL);
//       if (response.data.status === "ok") {
//         setIssues(response.data.data);
//       }
//     } catch (error) {
//       console.log("Error fetching issues:", error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   // Auto-refresh when screen comes into focus
//   useFocusEffect(
//     useCallback(() => {
//       fetchIssues();
//     }, [])
//   );

//   // Manual Pull-to-Refresh
//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchIssues();
//   };

//   // --- FILTER DATA ---
//   const activeIssues = issues.filter(item => item.status !== 'Solved');
//   const solvedIssues = issues.filter(item => item.status === 'Solved');

//   // --- HELPERS ---
//   const formatDate = (isoDate) => {
//     if (!isoDate) return "Just now";
//     const date = new Date(isoDate);
//     return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'Solved': return COLORS.successBg;    
//       case 'Processing': return COLORS.warningBg; 
//       default: return COLORS.dangerBg;          
//     }
//   };

//   const getStatusTextColor = (status) => {
//     switch (status) {
//       case 'Solved': return COLORS.successText;    
//       case 'Processing': return COLORS.warningText; 
//       default: return COLORS.dangerText;          
//     }
//   };

//   const IssueCard = ({ item }) => (
//     <TouchableOpacity 
//       style={styles.card} 
//       activeOpacity={0.8} 
//       onPress={() => navigation.navigate('IssueDetail', { issue: item })}
//     >
//       <View style={styles.cardRow}>
//         <View style={{ flex: 1 }}>
//           <Text style={styles.categoryTitle}>{item.category}</Text>
          
//           <View style={styles.locationContainer}>
//             <Ionicons name="location-sharp" size={14} color={COLORS.primary} />
//             {/* DB sends 'locationName', not 'location' */}
//             <Text style={styles.locationText} numberOfLines={1}>
//                 {item.locationName || "Location not available"}
//             </Text>
//           </View>
//         </View>
        
//         <View style={[styles.statusContainer, { backgroundColor: getStatusColor(item.status) }]}>
//           <Text style={[styles.statusText, { color: getStatusTextColor(item.status) }]}>
//             {item.status}
//           </Text>
//         </View>
//       </View>
//       <Text style={styles.dateText}>Reported: {formatDate(item.date)}</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBg} />

//       <View style={styles.header}>
//         <View>
//           <Text style={styles.appName}>CiviCare</Text>
//           <Text style={styles.greeting}>Welcome back, Citizen</Text>
//         </View>
        
//         <TouchableOpacity style={styles.profileIcon} onPress={() => navigation.navigate('Profile')}>
//            <Ionicons name="person-circle-outline" size={40} color={COLORS.primary} />
//         </TouchableOpacity>
//       </View>

//       {loading ? (
//         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//             <ActivityIndicator size="large" color={COLORS.primary} />
//             <Text style={{marginTop: 10, color: COLORS.textLight}}>Loading Issues...</Text>
//         </View>
//       ) : (
//         <ScrollView 
//             contentContainerStyle={styles.scrollContent} 
//             showsVerticalScrollIndicator={false}
//             refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
//         >
            
//             {/* Active Section */}
//             <View style={styles.sectionHeader}>
//             <View style={styles.headerTitleRow}>
//                 <Ionicons name="time-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
//                 <Text style={styles.sectionTitle}>In Progress</Text>
//             </View>
//             <Text style={styles.sectionCount}>{activeIssues.length} active</Text>
//             </View>

//             {activeIssues.length === 0 ? (
//                 <Text style={styles.emptyText}>No active issues found.</Text>
//             ) : (
//                 activeIssues.map((item) => <IssueCard key={item._id} item={item} />)
//             )}

//             {/* Solved Section */}
//             <View style={[styles.sectionHeader, { marginTop: 25 }]}>
//             <View style={styles.headerTitleRow}>
//                 <Ionicons name="checkmark-done-circle-outline" size={20} color={COLORS.successText} style={{ marginRight: 6 }} />
//                 <Text style={styles.sectionTitle}>Past Resolutions</Text>
//             </View>
//             <Text style={styles.sectionCount}>{solvedIssues.length} solved</Text>
//             </View>

//             {solvedIssues.map((item) => (
//                <IssueCard key={item._id} item={item} />
//             ))}

//         </ScrollView>
//       )}

//       <TouchableOpacity 
//         style={styles.fab} 
//         onPress={() => navigation.navigate("Report")}
//       >
//         <Ionicons name="add" size={32} color={COLORS.white} />
//       </TouchableOpacity>

//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background, 
//   },
//   header: {
//     padding: 20,
//     paddingTop: 10,
//     backgroundColor: COLORS.cardBg,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOpacity: 0.05,
//     shadowRadius: 5,
//   },
//   appName: {
//     fontSize: 22,
//     fontWeight: '900',
//     color: COLORS.primary, 
//     letterSpacing: 0.5,
//   },
//   greeting: {
//     fontSize: 14,
//     color: COLORS.textLight,
//   },
//   scrollContent: {
//     padding: 20,
//     paddingBottom: 100,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   headerTitleRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: COLORS.textDark, 
//   },
//   sectionCount: {
//     fontSize: 12,
//     color: COLORS.primary,
//     backgroundColor: '#ede7f6', 
//     paddingHorizontal: 10,
//     paddingVertical: 3,
//     borderRadius: 12,
//     fontWeight: '600',
//   },
//   card: {
//     backgroundColor: COLORS.cardBg,
//     borderRadius: 15, 
//     padding: 18,
//     marginBottom: 12,
//     elevation: 2, 
//     shadowColor: COLORS.primary, 
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   cardRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//   },
//   categoryTitle: {
//     fontSize: 17,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 6,
//   },
//   locationContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     maxWidth: '85%' 
//   },
//   locationText: {
//     fontSize: 13,
//     color: '#7f8c8d',
//     marginLeft: 4,
//   },
//   dateText: {
//     fontSize: 11,
//     color: '#bdc3c7',
//     marginTop: 12,
//     textAlign: 'right'
//   },
//   statusContainer: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 8,
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   emptyText: {
//     color: COLORS.textLight,
//     fontStyle: 'italic',
//     marginTop: 10,
//     marginBottom: 20,
//   },
//   fab: {
//     position: 'absolute',
//     bottom: 30,
//     right: 30,
//     backgroundColor: COLORS.primary, 
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 8,
//     shadowColor: COLORS.primary,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.4,
//     shadowRadius: 6,
//   },
// });

import React, { useState, useCallback, useEffect } from 'react';
import { BASE_URL } from '../../config';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Vibration, 
  Alert,
  Dimensions // <-- NEW: Needed for chart width
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LineChart } from 'react-native-chart-kit'; // <-- NEW: Chart component

const API_URL = `${BASE_URL}/get-issues`; 
const screenWidth = Dimensions.get("window").width;

const COLORS = {
  primary: '#8e44ad',   
  background: '#f8f4fc', 
  cardBg: '#ffffff',
  textDark: '#4a235a',   
  textLight: '#888',
  white: '#ffffff',
  success: '#27ae60',
  warning: '#f39c12',
  danger: '#c0392b',
  border: '#e1bee7'      
};

export default function Home({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("Citizen");
  
  const [activeTab, setActiveTab] = useState('Active'); 

  // --- SILENT WARNING POLLING FOR CITIZEN ---
  useEffect(() => {
    let interval;
    const checkForWarnings = async () => {
      try {
        const storedData = await AsyncStorage.getItem('user_data');
        if (!storedData) return;
        const user = JSON.parse(storedData);
        if (user.name) setUserName(user.name); 

        const response = await axios.post(`${BASE_URL}/get-profile-data`, { user_id: user._id });
        if (response.data.status === "ok") {
          const currentWarnings = response.data.data.user.warnings || 0;
          const lastSeenWarningsStr = await AsyncStorage.getItem(`last_warnings_${user._id}`);
          const lastSeenWarnings = lastSeenWarningsStr ? parseInt(lastSeenWarningsStr) : 0;

          if (currentWarnings > lastSeenWarnings) {
            Vibration.vibrate([0, 500, 200, 500]); 
            Alert.alert(
              "⚠️ OFFICIAL WARNING ⚠️",
              "You have received a formal warning from the administration for providing false or inappropriate information.\n\nFurther violations may result in account suspension.",
              [{ 
                  text: "I Understand", 
                  style: "destructive",
                  onPress: async () => await AsyncStorage.setItem(`last_warnings_${user._id}`, currentWarnings.toString())
              }]
            );
          }
        }
      } catch (error) {
        console.log("Warning polling error:", error);
      }
    };
    checkForWarnings();
    interval = setInterval(checkForWarnings, 15000);
    return () => clearInterval(interval);
  }, []);

  // --- FETCH DATA ---
  const fetchIssues = async () => {
    try {
      const response = await axios.get(API_URL);
      if (response.data.status === "ok") {
        setIssues(response.data.data);
      }
    } catch (error) {
      console.log("Error fetching issues:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchIssues(); }, []));

  const onRefresh = () => {
    setRefreshing(true);
    fetchIssues();
  };

  const displayIssues = issues.filter(item => 
    activeTab === 'Active' ? item.status !== 'Solved' : item.status === 'Solved'
  );

  // ✨ CHART DATA PROCESSING LOGIC ✨
  const getChartData = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const labels = [];
    const counts = [0, 0, 0, 0, 0, 0];
    const today = new Date();

    // Generate labels for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const pastDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      labels.push(monthNames[pastDate.getMonth()]);
    }

    // Count issues per month
    issues.forEach(issue => {
      if (!issue.date) return;
      const issueDate = new Date(issue.date);
      const monthDiff = (today.getFullYear() - issueDate.getFullYear()) * 12 + (today.getMonth() - issueDate.getMonth());
      
      if (monthDiff >= 0 && monthDiff < 6) {
        counts[5 - monthDiff]++;
      }
    });

    // If there is no data at all, provide a dummy array so the chart doesn't crash
    const safeData = counts.every(c => c === 0) ? [0, 0, 0, 0, 0, 0] : counts;

    return {
      labels: labels,
      datasets: [{ data: safeData }]
    };
  };

  const chartConfig = {
    backgroundGradientFrom: COLORS.cardBg,
    backgroundGradientTo: COLORS.cardBg,
    color: (opacity = 1) => `rgba(142, 68, 173, ${opacity})`, // COLORS.primary with opacity
    labelColor: (opacity = 1) => `rgba(127, 140, 141, ${opacity})`, // COLORS.textLight
    strokeWidth: 3, 
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: COLORS.primary
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "Just now";
    return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status) => {
    if (status === 'Solved') return COLORS.success;
    if (status === 'Processing') return COLORS.warning;
    return COLORS.danger; 
  };

  const getCategoryIcon = (category) => {
    const cat = category.toLowerCase();
    if (cat.includes('pothole') || cat.includes('road')) return 'car';
    if (cat.includes('water') || cat.includes('leak') || cat.includes('drainage')) return 'water';
    if (cat.includes('light')) return 'bulb';
    if (cat.includes('garbage')) return 'trash';
    if (cat.includes('tree')) return 'leaf';
    return 'alert-circle';
  };

  const CompactIssueCard = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <TouchableOpacity 
        style={styles.compactCard} 
        activeOpacity={0.7} 
        onPress={() => navigation.navigate('IssueDetail', { issue: item })}
      >
        <View style={styles.cardIconBlock}>
          <Ionicons name={getCategoryIcon(item.category)} size={24} color={COLORS.primary} />
        </View>

        <View style={styles.cardDetailsBlock}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardCategory} numberOfLines={1}>{item.category}</Text>
            <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
          </View>

          <Text style={styles.cardLocation} numberOfLines={1}>
            <Ionicons name="location" size={11} color={COLORS.textLight} /> {item.locationName || "Unknown"}
          </Text>

          <View style={styles.cardFooterRow}>
            <View style={[styles.miniBadge, { backgroundColor: statusColor + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.miniBadgeText, { color: statusColor }]}>{item.status}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeaderGrid = () => (
    <View style={styles.headerGridContainer}>
      <View style={styles.topNav}>
        <View>
          <Text style={styles.greetingTitle}>Hello, {userName.split(' ')[0]}</Text>
          <Text style={styles.greetingSubtitle}>Ready to make an impact?</Text>
        </View>
        <TouchableOpacity style={styles.profileAvatar} onPress={() => navigation.navigate('Profile')}>
           <Ionicons name="person" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.bentoPrimaryAction} 
        activeOpacity={0.9} 
        onPress={() => navigation.navigate("Report")}
      >
        <View>
          <Text style={styles.bentoActionTitle}>Report an Issue</Text>
          <Text style={styles.bentoActionSub}>Camera, GPS, and AI ready.</Text>
        </View>
        <View style={styles.bentoActionIcon}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </View>
      </TouchableOpacity>

      {/* ✨ GRAPH BENTO BOX ✨ */}
      <TouchableOpacity 
        style={styles.chartCard} 
        activeOpacity={0.8}
        onPress={() => Alert.alert("Activity Insight", `You have reported a total of ${issues.length} issues to date.`)}
      >
        <Text style={styles.chartTitle}>Reporting Trend (Last 6 Months)</Text>
        <LineChart
          data={getChartData()}
          width={screenWidth - 64} // Responsive width accounting for padding
          height={160}
          chartConfig={chartConfig}
          bezier // Makes the line curved and smooth
          style={styles.chartStyle}
          withHorizontalLines={false} // Removes noisy background grid lines
          withVerticalLines={false}
        />
      </TouchableOpacity>

      <View style={styles.segmentedControl}>
        <TouchableOpacity 
          style={[styles.segmentBtn, activeTab === 'Active' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('Active')}
        >
          <Text style={[styles.segmentText, activeTab === 'Active' && styles.segmentTextActive]}>In Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.segmentBtn, activeTab === 'Resolved' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('Resolved')}
        >
          <Text style={[styles.segmentText, activeTab === 'Resolved' && styles.segmentTextActive]}>Resolved</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {loading ? (
        <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Syncing city data...</Text>
        </View>
      ) : (
        <FlatList 
          data={displayIssues}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderHeaderGrid}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          renderItem={({ item }) => <CompactIssueCard item={item} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="leaf-outline" size={40} color={COLORS.border} />
              <Text style={styles.emptyText}>All clear here. No reports found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.textLight, fontSize: 13, fontWeight: '500' },

  headerGridContainer: { paddingHorizontal: 16, paddingTop: 5, paddingBottom: 10 },
  
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetingTitle: { fontSize: 24, fontWeight: '900', color: COLORS.textDark, letterSpacing: -0.5 },
  greetingSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  profileAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ebdcf2', justifyContent: 'center', alignItems: 'center' },

  bentoPrimaryAction: {
    backgroundColor: COLORS.primary,
    borderRadius: 16, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, elevation: 2,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5,
  },
  bentoActionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, marginBottom: 4 },
  bentoActionSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  bentoActionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },

  // --- NEW GRAPH CARD STYLES ---
  chartCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginBottom: 10,
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  chartStyle: {
    borderRadius: 16,
    paddingRight: 10,
  },

  segmentedControl: {
    flexDirection: 'row', backgroundColor: '#ede7f6', borderRadius: 10, padding: 4, marginBottom: 8 
  },
  segmentBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: COLORS.cardBg, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  segmentText: { fontSize: 13, fontWeight: '600', color: COLORS.textLight },
  segmentTextActive: { color: COLORS.textDark, fontWeight: 'bold' },

  listContent: { paddingBottom: 40 }, 
  
  compactCard: {
    flexDirection: 'row', backgroundColor: COLORS.cardBg,
    marginHorizontal: 16, marginBottom: 10, padding: 10, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, 
    alignItems: 'center'
  },
  cardIconBlock: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#f4ebf9',
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  cardDetailsBlock: { flex: 1, justifyContent: 'center' },
  
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  cardCategory: { fontSize: 15, fontWeight: 'bold', color: COLORS.textDark, flex: 1 },
  cardDate: { fontSize: 10, color: COLORS.textLight, fontWeight: '500' },
  
  cardLocation: { fontSize: 12, color: COLORS.textLight, marginBottom: 6 },
  
  cardFooterRow: { flexDirection: 'row' },
  miniBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5, marginRight: 4 },
  miniBadgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },

  emptyContainer: { alignItems: 'center', marginTop: 30, paddingHorizontal: 40 },
  emptyText: { color: COLORS.textLight, fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 20 },
});