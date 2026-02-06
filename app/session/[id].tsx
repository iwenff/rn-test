import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { calculateSeverity } from "../../src/domain/severity";

const API_BASE_URL = "http://81.163.27.191:8000";

type EventItem = {
  id?: string;
  type: string;
  ts: number;
  data?: any;
};

type SessionDetails = {
  id: string;
  startedAt?: number;
  durationMs?: number;
  stats?: Record<string, number>;
  flags?: {
    corrupted?: boolean;
  };
  events?: EventItem[];
};

function detectPendingRequests(events: EventItem[] = []) {
  const pending = new Map<string, EventItem>();

  for (const e of events) {
    const rid = e.data?.requestId;

    if (e.type === "net.request" && rid) {
      pending.set(rid, e);
    }

    if (["net.response", "net.error", "net.abort"].includes(e.type) && rid) {
      pending.delete(rid);
    }
  }

  return [...pending.values()];
}

export default function SessionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [details, setDetails] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<FlatList<EventItem>>(null);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/session/${id}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      setDetails(json);
    } catch (e: any) {
      setError(e.message ?? "Failed to load session");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !details) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: "red", marginBottom: 12 }}>Error: {error}</Text>
        <Button title="Retry" onPress={load} />
      </View>
    );
  }

  const severity = calculateSeverity(
    details.stats as any,
    details.flags?.corrupted,
  );

  const pending = detectPendingRequests(details.events);

  function scrollToNext(predicate: (e: EventItem) => boolean) {
    const idx = details?.events?.findIndex(predicate) ?? -1;

    if (idx >= 0) {
      listRef.current?.scrollToIndex({
        index: idx,
        animated: true,
      });
    }
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
        <Text style={{ fontSize: 18, fontWeight: "700" }}>{details.id}</Text>

        <Text>Severity: {severity}</Text>
        <Text>Corrupted: {details.flags?.corrupted ? "yes" : "no"}</Text>
        <Text>Duration: {details.durationMs} ms</Text>

        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginTop: 8,
          }}
        >
          <Pressable
            onPress={() => scrollToNext((e) => e.type.startsWith("error"))}
            style={{
              padding: 6,
              backgroundColor: "#fee2e2",
              borderRadius: 6,
            }}
          >
            <Text>Next Error</Text>
          </Pressable>

          <Pressable
            onPress={() => scrollToNext((e) => pending.includes(e))}
            style={{
              padding: 6,
              backgroundColor: "#fde68a",
              borderRadius: 6,
            }}
          >
            <Text>Next Pending</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={details.events ?? []}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => {
          const color = item.type.startsWith("error")
            ? "#fee2e2"
            : item.type.startsWith("net")
              ? "#dbeafe"
              : item.type.startsWith("ui")
                ? "#dcfce7"
                : "#eee";

          return (
            <View
              style={{
                padding: 10,
                borderBottomWidth: 1,
                borderColor: "#eee",
                backgroundColor: color,
              }}
            >
              <Text style={{ fontWeight: "600" }}>{item.type}</Text>

              <Text style={{ fontSize: 12 }}>{item.ts}</Text>

              <Text numberOfLines={2} style={{ fontSize: 11 }}>
                {JSON.stringify(item.data)}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}
