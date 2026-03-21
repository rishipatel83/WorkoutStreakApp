import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      {/* This specifically targets your index.tsx file and hides its header */}
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
}