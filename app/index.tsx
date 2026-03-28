import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ListRenderItem,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
  ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HEADER_MAX_HEIGHT = 260; 
const HEADER_MIN_HEIGHT = 110; 
const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const COLORS = {
  background: '#0F172A', 
  card: '#1E293B',       
  primary: '#F97316',    
  success: '#10B981', 
  danger: '#EF4444',   
  textMain: '#F8FAFC',   
  textMuted: '#94A3B8',  
  border: '#334155',  
};

const BADGES = [
  { id: '1', title: 'Getting Started', req: 3, icon: 'seedling', desc: 'Hit a 3-day streak' },
  { id: '2', title: 'One Week Warrior', req: 7, icon: 'sword-cross', desc: 'Hit a 7-day streak' },
  { id: '3', title: 'Commitment', req: 14, icon: 'shield-star', desc: 'Hit a 14-day streak' },
  { id: '4', title: 'Unstoppable', req: 30, icon: 'crown', desc: 'Hit a 30-day streak' },
];

interface PhotoEntry {
  id: string;
  date: string; 
  uri: string;
}

const formatDateForCalendar = (dateObj: Date) => {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function App() {
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [lastWorkoutDate, setLastWorkoutDate] = useState<string | null>(null);
  const [photoHistory, setPhotoHistory] = useState<PhotoEntry[]>([]); 
  
  const [showBadges, setShowBadges] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<PhotoEntry | null>(null);

  // Animation Refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const fabAnim = useRef(new Animated.Value(1)).current; // 1 = expanded (center), 0 = collapsed (corner)
  const lastScrollY = useRef(0);
  const isFabExpanded = useRef(true);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      const savedStreak = await AsyncStorage.getItem('streak');
      const savedMaxStreak = await AsyncStorage.getItem('maxStreak');
      const savedDate = await AsyncStorage.getItem('lastWorkoutDate');
      const savedHistory = await AsyncStorage.getItem('photoHistory');

      if (savedStreak) setStreak(parseInt(savedStreak, 10));
      if (savedMaxStreak) setMaxStreak(parseInt(savedMaxStreak, 10));
      if (savedDate) setLastWorkoutDate(savedDate);
      if (savedHistory) setPhotoHistory(JSON.parse(savedHistory) as PhotoEntry[]); 

      checkStreakStatus(savedDate);
    } catch (e) {
      console.log("Data load error", e);
    }
  };

  const checkStreakStatus = async (lastDate: string | null) => {
    if (!lastDate) return;
    const today = new Date().toDateString();
    const lastWorkout = new Date(lastDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastWorkout.toDateString() !== today && lastWorkout.toDateString() !== yesterday.toDateString()) {
      setStreak(0);
      await AsyncStorage.setItem('streak', '0');
    }
  };

  const handleScroll = (e: any) => {
    const currentY = e.nativeEvent.contentOffset.y;
    scrollY.setValue(currentY);

    const dy = currentY - lastScrollY.current;

    if (dy > 12 && currentY > 50 && isFabExpanded.current) {
      isFabExpanded.current = false;
      // Decreased duration to 200 for snappier collapse
      Animated.timing(fabAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    } else if ((dy < -12 || currentY <= 50) && !isFabExpanded.current) {
      isFabExpanded.current = true;
      // Decreased duration to 200 for snappier expand
      Animated.timing(fabAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    }

    lastScrollY.current = currentY;
  };

  const logWorkout = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera access is needed!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const photoUri = result.assets[0].uri;
      const today = new Date().toDateString();
      let newStreak = streak;

      if (lastWorkoutDate !== today) {
        newStreak = streak + 1;
        setStreak(newStreak);
        setLastWorkoutDate(today);
        await AsyncStorage.setItem('streak', newStreak.toString());
        await AsyncStorage.setItem('lastWorkoutDate', today);

        if (newStreak > maxStreak) {
            setMaxStreak(newStreak);
            await AsyncStorage.setItem('maxStreak', newStreak.toString());
        }
      }

      const newPhotoEntry: PhotoEntry = {
        id: Date.now().toString(),
        date: today,
        uri: photoUri
      };

      const updatedHistory = [newPhotoEntry, ...photoHistory];
      setPhotoHistory(updatedHistory);
      await AsyncStorage.setItem('photoHistory', JSON.stringify(updatedHistory));
    }
  };

  const handleDeletePhoto = (id: string) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this log? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            const updatedHistory = photoHistory.filter(item => item.id !== id);
            setPhotoHistory(updatedHistory);
            await AsyncStorage.setItem('photoHistory', JSON.stringify(updatedHistory));
          } 
        }
      ]
    );
  };

  const getMarkedDates = () => {
    const marks: any = {};
    photoHistory.forEach(item => {
      const formattedDate = formatDateForCalendar(new Date(item.date));
      marks[formattedDate] = { marked: true, selected: true, selectedColor: 'rgba(249, 115, 22, 0.2)', dotColor: COLORS.primary };
    });
    return marks;
  };

  const handleDayPress = (day: any) => {
    const clickedDateString = day.dateString;
    const foundPhoto = photoHistory.find(item => formatDateForCalendar(new Date(item.date)) === clickedDateString);
    if (foundPhoto) setSelectedPhotoModal(foundPhoto);
    else Alert.alert("No Workout", "You didn't log a workout on this date.");
  };

  // --- HEADER ANIMATIONS ---
  const headerHeight = scrollY.interpolate({ inputRange: [0, SCROLL_DISTANCE], outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT], extrapolate: 'clamp' });
  const titleFontSize = scrollY.interpolate({ inputRange: [0, SCROLL_DISTANCE], outputRange: [26, 18], extrapolate: 'clamp' });
  const titleTranslateY = scrollY.interpolate({ inputRange: [0, SCROLL_DISTANCE], outputRange: [0, 5], extrapolate: 'clamp' });
  const largeStreakOpacity = scrollY.interpolate({ inputRange: [0, SCROLL_DISTANCE / 2], outputRange: [1, 0], extrapolate: 'clamp' });
  const largeStreakTranslateY = scrollY.interpolate({ inputRange: [0, SCROLL_DISTANCE / 2], outputRange: [0, -20], extrapolate: 'clamp' });
  const smallStreakOpacity = scrollY.interpolate({ inputRange: [SCROLL_DISTANCE / 2, SCROLL_DISTANCE], outputRange: [0, 1], extrapolate: 'clamp' });
  
  // --- FAB ANIMATIONS (Center to Corner Transition) ---
  const buttonWidth = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 160] });
  const buttonTextOpacity = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const textMaxWidth = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 95] });
  
  // Interpolates position from the corner (20) to exact screen center
  const buttonRight = fabAnim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [20, (SCREEN_WIDTH / 2) - 80] // 80 is half of the expanded width (160)
  });

  const renderListHeader = () => (
    <View style={styles.feedHeaderContainer}>
      <TouchableOpacity style={styles.calendarToggle} onPress={() => setIsCalendarExpanded(!isCalendarExpanded)} activeOpacity={0.7}>
        <Text style={styles.calendarToggleText}>{isCalendarExpanded ? 'Collapse Calendar' : 'View Calendar'}</Text>
        <Ionicons name={isCalendarExpanded ? "chevron-up" : "chevron-down"} size={20} color={COLORS.primary} />
      </TouchableOpacity>
      {isCalendarExpanded && (
        <View style={styles.calendarWrapper}>
          <Calendar markedDates={getMarkedDates()} onDayPress={handleDayPress} theme={{
              backgroundColor: COLORS.background, calendarBackground: COLORS.background,
              textSectionTitleColor: COLORS.textMuted, selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: '#ffffff', todayTextColor: COLORS.primary, dayTextColor: COLORS.textMain,
              textDisabledColor: COLORS.border, monthTextColor: COLORS.textMain, arrowColor: COLORS.primary,
            }} />
        </View>
      )}
    </View>
  );

  const renderPhotoItem: ListRenderItem<PhotoEntry> = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-clear-outline" size={18} color={COLORS.textMuted} />
          <Text style={styles.historyDate}>{item.date}</Text>
        </View>
        <View style={styles.cardActions}>
          <View style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.successBadgeText}>Done</Text>
          </View>
          <TouchableOpacity onPress={() => handleDeletePhoto(item.id)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
      <Image source={{ uri: item.uri }} style={styles.historyImage} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <Animated.View style={[styles.absoluteHeader, { height: headerHeight }]}>
        <Animated.Text style={[styles.title, { fontSize: titleFontSize, transform: [{ translateY: titleTranslateY }] }]} numberOfLines={1} adjustsFontSizeToFit>
          FITNESS<Text style={styles.titleHighlight}> STREAK</Text>
        </Animated.Text>

        <Animated.View style={[styles.smallStreakContainer, { opacity: smallStreakOpacity }]}>
          <MaterialCommunityIcons name="fire" size={18} color={COLORS.primary} />
          <Text style={styles.smallStreakText}>{streak}</Text>
        </Animated.View>

        <TouchableOpacity style={styles.badgeIconButton} onPress={() => setShowBadges(true)}>
          <MaterialCommunityIcons name="medal-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        
        <Animated.View style={[styles.largeStreakContainer, { opacity: largeStreakOpacity, transform: [{ translateY: largeStreakTranslateY }] }]}>
          <View style={styles.fireCircle}>
            <MaterialCommunityIcons name="fire" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.largeStreakNumber}>{streak}</Text>
          <Text style={styles.largeStreakLabel}>Current Streak</Text>
        </Animated.View>
      </Animated.View>

      {/* MAIN FEED */}
      <Animated.FlatList
        data={photoHistory}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        renderItem={renderPhotoItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, paddingBottom: 120, alignItems: 'center' }} 
        onScroll={handleScroll}
        scrollEventThrottle={16} 
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="dumbbell" size={64} color={COLORS.border} />
            <Text style={styles.emptyText}>No workouts logged yet.</Text>
            <Text style={styles.emptySubText}>Hit the camera icon to start your legacy!</Text>
          </View>
        }
      />

      {/* ANIMATED FLOATING ACTION BUTTON */}
      <Animated.View style={[styles.animatedButtonContainer, { width: buttonWidth, right: buttonRight }]}>
        <TouchableOpacity style={styles.buttonInner} onPress={logWorkout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="camera-plus" size={24} color={COLORS.primary} />
          <Animated.View style={{ opacity: buttonTextOpacity, width: textMaxWidth, overflow: 'hidden' }}>
            <Text style={styles.buttonText} numberOfLines={1}>Add Photo</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* PHOTO MODAL */}
      <Modal visible={!!selectedPhotoModal} animationType="fade" transparent={true}>
        <View style={styles.fullScreenModalOverlay}>
          <TouchableOpacity style={styles.fullScreenCloseArea} onPress={() => setSelectedPhotoModal(null)} />
          {selectedPhotoModal && (
            <View style={styles.fullScreenImageContainer}>
              <View style={styles.fullScreenImageHeader}>
                <Text style={styles.fullScreenImageDate}>{selectedPhotoModal.date}</Text>
                <TouchableOpacity onPress={() => setSelectedPhotoModal(null)}>
                  <Ionicons name="close-circle" size={32} color={COLORS.textMain} />
                </TouchableOpacity>
              </View>
              <Image source={{ uri: selectedPhotoModal.uri }} style={styles.fullScreenImage} resizeMode="contain" />
            </View>
          )}
        </View>
      </Modal>

      {/* BADGES MODAL */}
      <Modal visible={showBadges} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Achievements</Text>
              <TouchableOpacity onPress={() => setShowBadges(false)}>
                <Ionicons name="close-circle" size={28} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.maxStreakText}>All-Time Best: <Text style={{color: COLORS.primary}}>{maxStreak} Days</Text></Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {BADGES.map((badge) => {
                const isUnlocked = maxStreak >= badge.req;
                return (
                  <View key={badge.id} style={[styles.badgeCard, !isUnlocked && styles.badgeCardLocked]}>
                    <View style={[styles.badgeIconBox, isUnlocked ? {backgroundColor: 'rgba(249, 115, 22, 0.1)'} : {backgroundColor: COLORS.border}]}>
                      <MaterialCommunityIcons 
                        name={isUnlocked ? (badge.icon as keyof typeof MaterialCommunityIcons.glyphMap) : 'lock'} 
                        size={32} 
                        color={isUnlocked ? COLORS.primary : COLORS.textMuted} 
                      />
                    </View>
                    <View style={styles.badgeInfo}>
                      <Text style={[styles.badgeTitle, !isUnlocked && {color: COLORS.textMuted}]}>{badge.title}</Text>
                      <Text style={styles.badgeDesc}>{badge.desc}</Text>
                    </View>
                    {isUnlocked && <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  absoluteHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: COLORS.card, zIndex: 10, alignItems: 'center',
    paddingTop: 55, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },
  title: { position: 'absolute', top: 60, left: 20, fontWeight: '900', color: COLORS.textMain, letterSpacing: 1, width: SCREEN_WIDTH * 0.58 },
  titleHighlight: { color: COLORS.primary },
  
  badgeIconButton: {
    position: 'absolute', top: 52, right: 20,
    backgroundColor: 'rgba(249, 115, 22, 0.1)', padding: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.2)'
  },
  smallStreakContainer: {
    position: 'absolute', top: 52, right: 75, 
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.1)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.2)'
  },
  smallStreakText: { color: COLORS.primary, fontWeight: '800', fontSize: 16, marginLeft: 4 },

  largeStreakContainer: { position: 'absolute', top: 100, alignItems: 'center', width: '100%' },
  fireCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(249, 115, 22, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 5, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.2)' },
  largeStreakNumber: { fontSize: 56, fontWeight: '900', color: COLORS.primary, lineHeight: 60 },
  largeStreakLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
  
  feedHeaderContainer: { width: SCREEN_WIDTH * 0.9, marginBottom: 20 },
  calendarToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  calendarToggleText: { color: COLORS.textMain, fontSize: 16, fontWeight: 'bold' },
  calendarWrapper: { backgroundColor: COLORS.card, borderRadius: 16, padding: 10, borderWidth: 1, borderColor: COLORS.border },

  emptyContainer: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: COLORS.textMain, fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: 15 },
  emptySubText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8 },
  
  historyCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 15, marginBottom: 20, width: SCREEN_WIDTH * 0.9, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  historyDate: { color: COLORS.textMain, fontSize: 15, fontWeight: '600', marginLeft: 6 },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  successBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginRight: 10 },
  successBadgeText: { color: COLORS.success, fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  deleteButton: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 6, borderRadius: 10 },
  historyImage: { width: '100%', height: 300, borderRadius: 12 },
  
  // REMOVED alignSelf: 'center' so dynamic `right` animation controls positioning
  animatedButtonContainer: {
    position: 'absolute', bottom: 30, height: 60, 
    backgroundColor: COLORS.card, 
    borderWidth: 1.5, borderColor: 'rgba(249, 115, 22, 0.5)', 
    borderRadius: 30, elevation: 8, zIndex: 20, overflow: 'hidden', 
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10,
  },
  buttonInner: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' 
  },
  buttonText: { 
    color: COLORS.textMain, fontSize: 16, fontWeight: '700', paddingLeft: 8, width: 100 
  },

  fullScreenModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullScreenCloseArea: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  fullScreenImageContainer: { width: '90%', height: '80%', backgroundColor: COLORS.card, borderRadius: 20, overflow: 'hidden', paddingBottom: 20 },
  fullScreenImageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  fullScreenImageDate: { color: COLORS.textMain, fontSize: 18, fontWeight: 'bold' },
  fullScreenImage: { width: '100%', flex: 1, borderRadius: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textMain },
  maxStreakText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600', marginBottom: 20 },
  badgeCard: { flexDirection: 'row', backgroundColor: COLORS.card, padding: 15, borderRadius: 16, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary },
  badgeCardLocked: { borderColor: COLORS.border, opacity: 0.6 },
  badgeIconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  badgeInfo: { flex: 1 },
  badgeTitle: { color: COLORS.textMain, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  badgeDesc: { color: COLORS.textMuted, fontSize: 14 }
});