import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { calculateSeverity } from "../src/domain/severity";
import { API_BASE_URL } from "../src/config";

type SessionStats = {
  jsErrors?: number;
  consoleErrors?: number;
  failedRequests?: number;
  pendingRequests?: number;
  rageClicks?: number;
  deadClicks?: number;
};

type SessionItem = {
  id: string;
  startedAt?: number;
  durationMs?: number;
  entryUrl?: string;
  lastRoute?: string;
  stats?: SessionStats;
  flags?: {
    corrupted?: boolean;
  };
};

export default function SessionsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [filterCorrupted, setFilterCorrupted] = useState(false);
  const [filterJsErrors, setFilterJsErrors] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<"startedAt" | "severity">("severity");

  const loadPage = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${API_BASE_URL}/session/list?page=${page}&limit=20`,
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      const items: SessionItem[] = Array.isArray(json.items) ? json.items : [];

      setSessions((prev) => [...prev, ...items]);
      setPage((prev) => prev + 1);

      if (items.length === 0) {
        setHasMore(false);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const visibleSessions = useMemo(() => {
    let list = [...sessions];

    if (filterCorrupted) {
      list = list.filter((s) => s.flags?.corrupted);
    }

    if (filterJsErrors) {
      list = list.filter((s) => (s.stats?.jsErrors ?? 0) > 0);
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (s) =>
          s.entryUrl?.toLowerCase().includes(q) ||
          s.lastRoute?.toLowerCase().includes(q),
      );
    }

    if (sortBy === "severity") {
      list.sort(
        (a, b) =>
          calculateSeverity(b.stats, b.flags?.corrupted) -
          calculateSeverity(a.stats, a.flags?.corrupted),
      );
    }

    if (sortBy === "startedAt") {
      list.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
    }

    return list;
  }, [sessions, filterCorrupted, filterJsErrors, searchText, sortBy]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
        Sessions List
      </Text>

      <View
        style={{
          marginBottom: 12,
          gap: 8,
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#ddd",
        }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => setFilterCorrupted((v) => !v)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 6,
              backgroundColor: filterCorrupted ? "#fee2e2" : "#eee",
            }}
          >
            <Text>Corrupted</Text>
          </Pressable>

          <Pressable
            onPress={() => setFilterJsErrors((v) => !v)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 6,
              backgroundColor: filterJsErrors ? "#fde68a" : "#eee",
            }}
          >
            <Text>JS Errors</Text>
          </Pressable>
        </View>

        <TextInput
          placeholder="Search entry / last route"
          value={searchText}
          onChangeText={setSearchText}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 6,
            padding: 8,
          }}
        />

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => setSortBy("severity")}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 6,
              backgroundColor: sortBy === "severity" ? "#bfdbfe" : "#eee",
            }}
          >
            <Text>Sort: Severity</Text>
          </Pressable>

          <Pressable
            onPress={() => setSortBy("startedAt")}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 6,
              backgroundColor: sortBy === "startedAt" ? "#bfdbfe" : "#eee",
            }}
          >
            <Text>Sort: Started</Text>
          </Pressable>
        </View>
      </View>

      {error && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: "red" }}>Error: {error}</Text>
          <Button title="Retry" onPress={loadPage} />
        </View>
      )}

      <FlatList
        data={visibleSessions}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReached={loadPage}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? <ActivityIndicator size="small" /> : null
        }
        renderItem={({ item }) => {
          const severity = calculateSeverity(item.stats, item.flags?.corrupted);
          const severityColor =
            severity >= 10 ? "red" : severity >= 5 ? "orange" : "green";

          return (
            <View
              style={{
                padding: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#ddd",
              }}
            >
              <Text style={{ fontWeight: "600", marginBottom: 4 }}>
                {item.id}
              </Text>

              <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                {item.entryUrl ?? "-"} → {item.lastRoute ?? "-"}
              </Text>

              <Text style={{ color: severityColor, marginBottom: 8 }}>
                Severity: {severity}
              </Text>

              <Link href={`/session/${item.id}`} asChild>
                <Button title="Open" />
              </Link>
            </View>
          );
        }}
      />

      <View style={{ marginTop: 20, gap: 10 }}>
        <Link href="/similar" asChild>
          <Button title="Go to Similar Sessions" />
        </Link>

        <Button
          title="Go to Diff Screen"
          onPress={() => {
            if (visibleSessions.length < 2) {
              Alert.alert(
                "Not enough sessions",
                "Need at least two sessions to show diff.",
              );
              return;
            }

            const a = visibleSessions[0].id;
            const b = visibleSessions[1].id;

            router.push(
              `/diff?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`,
            );
          }}
        />
      </View>
    </View>
  );
}
