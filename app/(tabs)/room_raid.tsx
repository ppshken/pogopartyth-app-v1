import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; // Expo มีให้ในตัว
import { listRooms } from "../../lib/raid";

type Room = {
  id: number;
  boss: string;
  start_time: string;          // "YYYY-MM-DD HH:mm:ss"
  status: string;
  current_members: number;
  max_members: number;
  note?: string | null;
  owner?: { id: number; username: string; avatar?: string | null } | null;
};

const BOSS_IMAGES: Record<string, string> = {
  Mewtwo: "https://img.pokemondb.net/artwork/large/mewtwo.jpg",
  Rayquaza: "https://img.pokemondb.net/artwork/large/rayquaza.jpg",
  Groudon: "https://img.pokemondb.net/artwork/large/groudon.jpg",
  Kyogre: "https://img.pokemondb.net/artwork/large/kyogre.jpg",
  Dialga: "https://img.pokemondb.net/artwork/large/dialga.jpg",
  Zacian:
    "https://img.pokemondb.net/artwork/large/zacian-hero-of-many-battles.jpg",
};

const FALLBACK =
  "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1200&auto=format&fit=crop";

function parseStart(s: string): Date {
  const iso = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date(s) : d;
}

function useCountdown(start: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const target = parseStart(start).getTime();
  const diffMs = target - now;
  const expired = diffMs <= 0;

  let label = "หมดเวลา";
  if (!expired) {
    const totalMin = Math.floor(diffMs / 60000);
    const hh = Math.floor(totalMin / 60);
    const mm = totalMin % 60;
    label = `เหลือ ${hh} ชม. ${mm.toString().padStart(2, "0")} นาที`;
  }
  return { label, expired };
}

function RoomListItem({ room, onPress }: { room: Room; onPress?: () => void }) {
  const { label, expired } = useCountdown(room.start_time);
  const cover = BOSS_IMAGES[room.boss] ?? FALLBACK;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* รูปบอส */}
      <Image source={{ uri: cover }} style={styles.thumb} />

      {/* เนื้อหา */}
      <View style={{ flex: 1 }}>
        {/* บรรทัดบน: ชื่อบอส + ชิปนับถอยหลัง */}
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.title}>
            {room.boss}
          </Text>
          <View
            style={[
              styles.chip,
              expired ? { backgroundColor: "#E5E7EB" } : { backgroundColor: "#111827" },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={expired ? "#6B7280" : "#fff"}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.chipText, expired && { color: "#6B7280" }]}>{label}</Text>
          </View>
        </View>

        {/* หัวห้อง */}
        {room.owner?.username ? (
          <Text style={styles.subtle} numberOfLines={1}>
            หัวห้อง: {room.owner.username}
          </Text>
        ) : null}

        {/* บรรทัดล่าง: สมาชิก + สถานะ */}
        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={16} color="#374151" />
          <Text style={styles.metaText}>
            {" "}
            {room.current_members}/{room.max_members}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.metaText}>{room.status === "active" ? "เปิดรับ" : room.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RoomsIndex() {
  const [items, setItems] = useState<Room[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState(""); // ค้นหา
  const router = useRouter();

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await listRooms({ status: "active", page: 1, limit: 100 });
      setItems(res.items || res.rooms || []);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((r) => {
      const boss = (r.boss || "").toLowerCase();
      const owner = (r.owner?.username || "").toLowerCase();
      return boss.includes(s) || owner.includes(s);
    });
  }, [items, q]);

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* แถบค้นหา */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#6B7280" />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="ค้นหาตามชื่อบอส หรือชื่อหัวห้อง"
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
        {q ? (
          <TouchableOpacity onPress={() => setQ("")}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={
          <Text style={{ color: "#9CA3AF", textAlign: "center", marginTop: 24 }}>
            {q ? "ไม่พบห้องที่ตรงกับคำค้นหา" : "ยังไม่มีห้อง"}
          </Text>
        }
        renderItem={({ item }) => (
          <RoomListItem room={item} onPress={() => router.push(`/rooms/${item.id}`)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    marginTop: 12,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchInput: { flex: 1, color: "#111827" },

  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: "#F3F4F6" },
  topRow: { flexDirection: "row", alignItems: "center" },
  title: { flex: 1, fontSize: 16, fontWeight: "800", color: "#111827", marginRight: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
  },
  chipText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  subtle: { marginTop: 2, color: "#6B7280", fontSize: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  metaText: { color: "#374151", fontSize: 12 },
  dot: { color: "#D1D5DB" },

  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});
