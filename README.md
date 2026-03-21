# 🔥 WorkoutStreakApp

A sleek, offline-first React Native mobile application designed to help users build and maintain their fitness legacy. By combining daily photo logging with a smart streak-calculation algorithm, this app keeps you accountable and motivated.

## ✨ Features

* **Daily Photo Logging:** Seamlessly open your device's camera or gallery to snap a picture of your daily workout.
* **Smart Streak Algorithm:** Automatically calculates consecutive days of activity. If you miss a day, the streak resets. If you already logged today, it protects your current streak from duplicate entries.
* **Persistent Local Storage:** Uses `AsyncStorage` to securely save your streak count, last upload date, and workout photos directly on your device—no internet connection required.
* **Premium Dark UI:** A custom, distraction-free dark theme (`#1E232C`) accented with vibrant motivational orange (`#F97316`).
* **Standalone APK Ready:** Fully configured for cloud building via Expo Application Services (EAS).

## 🛠️ Tech Stack

* **Framework:** React Native / Expo
* **Routing:** Expo Router
* **Package Manager:** Bun
* **Storage:** `@react-native-async-storage/async-storage`
* **Hardware APIs:** `expo-image-picker`
* **Icons:** `@expo/vector-icons` (Ionicons & FontAwesome5)

## 🚀 How to Run Locally

If you want to clone this repository and run the development server, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/WorkoutStreakApp.git](https://github.com/yourusername/WorkoutStreakApp.git)
   cd WorkoutStreakApp
2. **Install dependencies:**
   ```bash
   bun install
3. **Start expo development server:**
   ```bash
   bunx expo start -c
4. **Test on your device: Download the Expo Go app on your iOS or Android device and scan the QR code generated in your terminal.**

   