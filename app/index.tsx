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
  StatusBar
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HEADER_MAX_HEIGHT = 280; 
const HEADER_MIN_HEIGHT = 110; 
const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const COLORS = {
  background: '#0F172A', 
  card: '#1E293B',       
  primary: '#F97316',    
  success: '#10B981',    
  textMain: '#F8FAFC',   
  textMuted: '#94A3B8',  
  border: '#334155',     
};

interface PhotoEntry {
  id: string;
  date: string;
  uri: string;
}

export default function App() {
  const [streak, setStreak] = useState<number>(0);
  const [lastWorkoutDate, setLastWorkoutDate] = useState<string | null>(null);
  const [photoHistory, setPhotoHistory] = useState<PhotoEntry[]>([]); 

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadStreakData();
  });

  const loadStreakData = async () => {
    try {
      const savedStreak = await AsyncStorage.getItem('streak');
      const savedDate = await AsyncStorage.getItem('lastWorkoutDate');
      const savedHistory = await AsyncStorage.getItem('photoHistory');

      if (savedStreak) setStreak(parseInt(savedStreak, 10));
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

  const logWorkout = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
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

  const titleFontSize = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [26, 18], 
    extrapolate: 'clamp'
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [0, 5], 
    extrapolate: 'clamp'
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp'
  });

  const largeStreakOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE / 2], 
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });
  
  const largeStreakTranslateY = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE / 2],
    outputRange: [0, -20], 
    extrapolate: 'clamp'
  });

  const smallBadgeOpacity = scrollY.interpolate({
    inputRange: [SCROLL_DISTANCE / 2, SCROLL_DISTANCE], 
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  const smallBadgeTranslateY = scrollY.interpolate({
    inputRange: [SCROLL_DISTANCE / 2, SCROLL_DISTANCE],
    outputRange: [15, 0], 
    extrapolate: 'clamp'
  });

  const buttonWidth = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [200, 65],
    extrapolate: 'clamp'
  });
  
  const buttonRight = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [(SCREEN_WIDTH / 2) - 100, 20],
    extrapolate: 'clamp'
  });
  
  const buttonTextOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });
  
  const buttonTextWidth = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [100, 0],
    extrapolate: 'clamp'
  });

  const renderPhotoItem: ListRenderItem<PhotoEntry> = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-clear-outline" size={18} color={COLORS.textMuted} />
          <Text style={styles.historyDate}>{item.date}</Text>
        </View>
        <View style={styles.successBadge}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
          <Text style={styles.successBadgeText}>Done</Text>
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
        
        {/* FIX APPLIED HERE: adjustsFontSizeToFit aur width check */}
        <Animated.Text 
          style={[
            styles.title, 
            { 
              fontSize: titleFontSize,
              transform: [{ translateY: titleTranslateY }]
            }
          ]}
          numberOfLines={1} 
          adjustsFontSizeToFit={true} // Ye ensure karega ki text shrink ho jaye but cut na ho
        >
          FITNESS<Text style={styles.titleHighlight}> STREAK</Text>
        </Animated.Text>

        {/* SMALL BADGE */}
        <Animated.View style={[
          styles.smallBadgeContainer, 
          { opacity: smallBadgeOpacity, transform: [{ translateY: smallBadgeTranslateY }] }
        ]}>
          <MaterialCommunityIcons name="fire" size={18} color={COLORS.primary} />
          <Text style={styles.smallBadgeText}> {streak} Active</Text>
        </Animated.View>
        
        {/* LARGE STREAK UI */}
        <Animated.View style={[
          styles.largeStreakContainer, 
          { opacity: largeStreakOpacity, transform: [{ translateY: largeStreakTranslateY }] }
        ]}>
          <View style={styles.fireCircle}>
            <MaterialCommunityIcons name="fire" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.largeStreakNumber}>{streak}</Text>
          <Text style={styles.largeStreakLabel}>Current Streak</Text>
        </Animated.View>
      </Animated.View>

      {/* LIST SECTION */}
      {photoHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="dumbbell" size={64} color={COLORS.border} />
          <Text style={styles.emptyText}>No workouts logged yet.</Text>
          <Text style={styles.emptySubText}>Hit the + icon to start your legacy!</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={photoHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderPhotoItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, paddingBottom: 120, alignItems: 'center' }} 
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16} 
        />
      )}

      {/* FLOATING ACTION BUTTON */}
      <Animated.View style={[styles.animatedButtonContainer, { width: buttonWidth, right: buttonRight }]}>
        <TouchableOpacity style={styles.buttonInner} onPress={logWorkout}>
          <MaterialCommunityIcons name="camera-plus" size={24} color="#FFF" />
          <Animated.View style={{ opacity: buttonTextOpacity, width: buttonTextWidth, overflow: 'hidden' }}>
            <Text style={styles.buttonText} numberOfLines={1}>Add Daily Pic</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, 
  },
  absoluteHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: COLORS.card,
    zIndex: 10,
    alignItems: 'center',
    paddingTop: 55, 
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  title: {
    position: 'absolute',
    top: 60,
    left: 20,
    fontWeight: '900',
    color: COLORS.textMain,
    letterSpacing: 1,
    // FIX APPLIED HERE: Width thodi badha di hai so that the whole text fits before shrinking
    width: SCREEN_WIDTH * 0.58, 
  },
  titleHighlight: {
    color: COLORS.primary,
  },
  smallBadgeContainer: {
    position: 'absolute',
    top: 60, 
    right: 20,
    backgroundColor: 'rgba(249, 115, 22, 0.1)', 
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH * 0.35, 
  },
  smallBadgeText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 4,
  },
  largeStreakContainer: {
    position: 'absolute',
    top: 110,
    alignItems: 'center',
    width: '100%',
  },
  fireCircle: {
    width: 60, height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(249, 115, 22, 0.1)', 
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  largeStreakNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: COLORS.primary,
    lineHeight: 60,
  },
  largeStreakLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: HEADER_MAX_HEIGHT,
    paddingHorizontal: 40,
  },
  emptyText: { color: COLORS.textMain, fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: 15 },
  emptySubText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8 },
  
  historyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    width: SCREEN_WIDTH * 0.9,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDate: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  successBadgeText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  historyImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  animatedButtonContainer: {
    position: 'absolute',
    bottom: 30,
    height: 65,
    backgroundColor: COLORS.primary,
    borderRadius: 35,
    elevation: 8,
    zIndex: 20,
    overflow: 'hidden',
    shadowColor: COLORS.primary, 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  buttonInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginLeft: 8,
  },
});