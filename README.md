# 🔥 WorkoutStreakApp

A sleek, offline-first React Native mobile application designed to help users build and maintain their fitness legacy. By combining daily photo logging with a smart streak-calculation algorithm, this app keeps you accountable and motivated.

## 📥 Download the App (Android)

Want to skip the code and just use the app? You can download the latest Android APK directly to your phone:

**[⬇️ Download WorkoutStreakApp v1.1.0 APK](https://github.com/rishipatel83/WorkoutStreakApp/releases/tag/v1.1.0)**

*Note: Since this app is not on the Google Play Store, your phone may ask you to "Allow installation from unknown sources" when opening the file.*

---

## ✨ Features

* **Strict Daily Logging:** Launch the camera directly from the app to snap your post-workout photo. No gallery uploads allowed—keeping your streak 100% authentic.
* **Smart Calendar Feed:** Visually track your history with an integrated, collapsible calendar dashboard. Tap any highlighted date to open a full-screen view of that day's workout photo.
* **Achievement Badges:** Unlock visual medals by pushing your "All-Time Best" max streak to 3, 7, 14, and 30 days.
* **Smart Streak Algorithm:** Automatically calculates consecutive days of activity. If you miss a day, the active streak resets, but your all-time high is safely stored.
* **Fluid UI & Animations:** Features a premium dark theme (`#1E293B`), a scroll-aware Floating Action Button (FAB) that smartly transitions from the center to the corner, and smooth header fades.
* **Full Data Control:** Easily delete past logs if you make a mistake.
* **Persistent Local Storage:** Uses `AsyncStorage` to securely save your streak count, max streak, and photo history directly on your device—no internet connection required.

## 🛠️ Tech Stack

* **Framework:** React Native / Expo
* **Routing:** Expo Router
* **Package Manager:** Bun
* **Storage:** `@react-native-async-storage/async-storage`
* **Hardware APIs:** `expo-image-picker`
* **UI Components:** `react-native-calendars`
* **Icons:** `@expo/vector-icons` (Ionicons & MaterialCommunityIcons)

## 🚀 For Developers: How to Run Locally

If you want to clone this repository and run the development server, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/rishipatel83/WorkoutStreakApp.git](https://github.com/rishipatel83/WorkoutStreakApp.git)
   cd WorkoutStreakApp
2. **Install dependencies:**
   ```bash
   bun install
3. **Start expo development server:**
   ```bash
   bunx expo start -c
4. **Test on your device: Download the Expo Go app on your iOS or Android device and scan the QR code generated in your terminal.**

   