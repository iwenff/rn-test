import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Button, FlatList, Text, View } from "react-native";
import { API_BASE_URL } from "../src/config";
import {
  SessionDetails,
  similarityScore,
  toSequence,
} from "../src/domain/events";

type SimilarRow = {
  id: string;
  score: number;
};

export default function SimilarSessionsScreen() {
  const router = useRouter();

  const [baseSession, setBaseSession] = useState<SessionDetails | null>(null);
  const [candidates, setCandidates] = useState<SessionDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const listRes = await fetch(
        `${API_BASE_URL}/session/list?page=1&limit=20`,
      );
      if (!listRes.ok) {
        throw new Error(`Failed to load sessions (HTTP ${listRes.status})`);
      }
      const listJson = await listRes.json();

      const baseId = listJson.items?.[0]?.id;

      if (!baseId) {
        setError("No sessions available");
        return;
      }

      const baseRes = await fetch(`${API_BASE_URL}/session/${baseId}`);
      if (!baseRes.ok) {
        throw new Error(
          `Failed to load base session ${baseId} (HTTP ${baseRes.status})`,
        );
      }
      const baseJson = await baseRes.json();

      setBaseSession(baseJson);

      const others: SessionDetails[] = [];

      for (let i = 1; i < Math.min(6, listJson.items.length); i++) {
        const id = listJson.items[i].id;
        const r = await fetch(`${API_BASE_URL}/session/${id}`);
        if (!r.ok) {
          throw new Error(
            `Failed to load candidate session ${id} (HTTP ${r.status})`,
          );
        }
        const j = await r.json();
        others.push(j);
      }

      setCandidates(others);
    } catch (e: any) {
      setError(e.message ?? "Failed to load similar sessions");
    } finally {
      setLoading(false);
    }
  }

  const similar = useMemo<SimilarRow[]>(() => {
    if (!baseSession) return [];

    const baseSeq = toSequence(baseSession.events);

    return candidates
      .map((s) => ({
        id: s.id,
        score: similarityScore(baseSeq, toSequence(s.events)),
      }))
      .sort((a, b) => b.score - a.score);
  }, [baseSession, candidates]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {error && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      )}

      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        Similar Sessions (LCS)
      </Text>

      <FlatList
        data={similar}
        keyExtractor={(i) => i.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
            }}
          >
            <Text style={{ fontWeight: "600" }}>{item.id}</Text>

            <Text>Similarity: {(item.score * 100).toFixed(1)}%</Text>

            <Button
              title="Open Diff"
              onPress={() =>
                router.push(`/diff?a=${baseSession?.id}&b=${item.id}`)
              }
            />
          </View>
        )}
      />
    </View>
  );
}
