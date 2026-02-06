import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Sessions" }} />
        <Stack.Screen
          name="session/[id]"
          options={{ title: "Session Details" }}
        />
        <Stack.Screen name="similar" options={{ title: "Similar Sessions" }} />
        <Stack.Screen name="diff" options={{ title: "Diff" }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
