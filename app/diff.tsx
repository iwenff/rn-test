import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { API_BASE_URL } from "../src/config";
import { SessionDetails, buildDiff, toSequence } from "../src/domain/events";

export default function DiffScreen() {
  const params = useLocalSearchParams();

  const a = Array.isArray(params.a)
    ? params.a[0]
    : (params.a as string | undefined);

  const b = Array.isArray(params.b)
    ? params.b[0]
    : (params.b as string | undefined);

  const [left, setLeft] = useState<SessionDetails | null>(null);
  const [right, setRight] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!a || !b) {
      setLoading(false);
      return;
    }

    load();
  }, [a, b]);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const r1 = await fetch(`${API_BASE_URL}/session/${a}`);
      if (!r1.ok) {
        throw new Error(`Failed to load session ${a} (HTTP ${r1.status})`);
      }
      const j1 = await r1.json();

      const r2 = await fetch(`${API_BASE_URL}/session/${b}`);
      if (!r2.ok) {
        throw new Error(`Failed to load session ${b} (HTTP ${r2.status})`);
      }
      const j2 = await r2.json();

      setLeft(j1);
      setRight(j2);
    } catch (e: any) {
      setError(e.message ?? "Failed to load diff data");
    } finally {
      setLoading(false);
    }
  }

  const diff = useMemo(() => {
    if (!left || !right) return [];

    return buildDiff(toSequence(left.events), toSequence(right.events));
  }, [left, right]);

  if (!a || !b) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text>Missing diff params</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          padding: 12,
          borderBottomWidth: 1,
          borderColor: "#ddd",
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          Diff
        </Text>
        <Text>
          {left?.id} ↔ {right?.id}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 12,
        }}
      >
        {diff.map((row, idx) => (
          <View
            key={idx}
            style={{
              flexDirection: "row",
              marginBottom: 6,
            }}
          >
            <View
              style={{
                flex: 1,
                padding: 6,
                backgroundColor: row.same
                  ? "#dcfce7"
                  : row.a
                    ? "#fee2e2"
                    : "#eee",
              }}
            >
              <Text>{row.a ?? "—"}</Text>
            </View>

            <View
              style={{
                width: 6,
              }}
            />

            <View
              style={{
                flex: 1,
                padding: 6,
                backgroundColor: row.same
                  ? "#dcfce7"
                  : row.b
                    ? "#dbeafe"
                    : "#eee",
              }}
            >
              <Text>{row.b ?? "—"}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
