import { View, Text, Button } from "react-native";
import { Link } from "expo-router";

export default function SessionRootScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "600" }}>Session Root</Text>
      <Text>Pick a concrete session by id.</Text>

      <Link href="/session/s_00000001" asChild>
        <Button title="Open demo session" />
      </Link>
    </View>
  );
}
