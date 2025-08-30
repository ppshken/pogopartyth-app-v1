import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useAuth } from "../../store/authStore";
import { useRefetchOnFocus } from "../../hooks/useRefetchOnFocus";

type MyRoom = {
  id: number;
  boss: string;
  start_time: string;              // "YYYY-MM-DD HH:mm:ss"
  status: "active" | "closed" | "canceled" | "invited" | string;
  max_members: number;
  current_members?: number;
  is_full?: boolean;
  note?: string | null;
  owner_id?: number;
  role?: "owner" | "member";       // แนะนำให้ my_rooms.php ส่งมาด้วย
  owner?: { id: number; username: string; avatar?: string | null } | null;
};

const BOSS_IMAGES: Record<string, string> = {
  Mewtwo: "https://img.pokemondb.net/artwork/large/mewtwo.jpg",
  Rayquaza: "https://img.pokemondb.net/artwork/large/rayquaza.jpg",
  Groudon: "https://img.pokemondb.net/artwork/large/groudon.jpg",
  Kyogre: "https://img.pokemondb.net/artwork/large/kyogre.jpg",
};
const FALLBACK =
  "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1200&auto=format&fit=crop";

// ------- utils -------
const pad2 = (n: number) => n.toString().padStart(2, "0");
function parseStart(s: string): Date {
  const iso = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date(s) : d;
}
function useCountdown(start: string) {
  const target = useMemo(() => parseStart(start).getTime(), [start]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  

  const diffMs = target - now;
  const expired = diffMs <= 0;
  if (expired) return { expired: true, label: "หมดเวลา" };

  const totalSec = Math.floor(diffMs / 1000);
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;

  let label = "";
  if (hh > 0) label = `เหลือ ${hh} ชม. ${pad2(mm)} นาที ${pad2(ss)} วินาที`;
  else if (mm > 0) label = `เหลือ ${mm} นาที ${pad2(ss)} วินาที`;
  else label = `เหลือ ${ss} วินาที`;

  return { expired: false, label };
}

// ------- Card -------
function MyRoomCard({ room, onPress }: { room: MyRoom; onPress?: () => void }) {
  const { label, expired } = useCountdown(room.start_time);
  const cover = BOSS_IMAGES[room.boss] ?? FALLBACK;

  const isFull = room.is_full ?? ((room.current_members ?? 0) >= room.max_members);
  const statusBg =
    room.status === "invited" ? "#2563EB" :
    expired ? "#9CA3AF" :
    isFull ? "#EF4444" :
    room.status === "active" ? "#10B981" : "#111827";

  const statusText =
    room.status === "invited" ? "เชิญแล้ว" :
    expired ? "หมดเวลา" :
    isFull ? "เต็ม" :
    room.status === "active" ? "เปิดรับ" : room.status;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: cover }} style={styles.thumb} />
      <View style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.title}>{room.boss}</Text>
          <View style={[styles.badge, { backgroundColor: statusBg }]}>
            <Text style={styles.badgeText}>{statusText}</Text>
          </View>
        </View>

        {/* owner (ถ้ามี) */}
        {room.owner?.username ? (
          <Text numberOfLines={1} style={styles.subtle}>หัวห้อง: {room.owner.username}</Text>
        ) : null}

        {/* countdown */}
        <View style={styles.metaRow}>
          <View style={styles.chipDark}>
            <Ionicons name="time-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.chipDarkText}>{label}</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="people-outline" size={16} color="#374151" />
            <Text style={styles.metaText}>
              {" "}{room.current_members ?? "-"} / {room.max_members}
            </Text>
          </View>
        </View>

        {/* note (ถ้ามี) */}
        {room.note ? (
          <Text numberOfLines={2} style={styles.note}>{room.note}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ------- Screen -------
export default function MyRaid() {
  const [rooms, setRooms] = useState<MyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const me = useAuth((s) => s.user);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/raid/my_rooms.php", { validateStatus: () => true });
      if (data?.success) {
        const arr: MyRoom[] = data.data?.rooms || data.data?.items || [];
        setRooms(arr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useRefetchOnFocus(load, [load]);

  const { created, joined } = useMemo(() => {
    const isCreated = (r: MyRoom) =>
      r.role === "owner" || (!!me?.id && r.owner_id === me.id);

    const createdList = rooms.filter(isCreated);
    const joinedList  = rooms.filter((r) => !isCreated(r));

    // เรียงเวลาใกล้เริ่มก่อน
    const byTimeAsc = (a: MyRoom, b: MyRoom) =>
      parseStart(a.start_time).getTime() - parseStart(b.start_time).getTime();

    return {
      created: [...createdList].sort(byTimeAsc),
      joined:  [...joinedList].sort(byTimeAsc),
    };
  }, [rooms, me?.id]);

  if (loading && !rooms.length) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <Ionicons name="sync" size={20} />
        <Text style={{ marginTop:8 }}>กำลังโหลดห้องของฉัน...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      data={[{ type: "created" }, { type: "joined" }]}
      keyExtractor={(it) => it.type}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      renderItem={({ item }) => {
        const isCreatedSection = item.type === "created";
        const data = isCreatedSection ? created : joined;
        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isCreatedSection ? "ห้องที่ฉันสร้าง" : "ห้องที่ฉันเข้าร่วม"}
              </Text>
            </View>

            {data.length === 0 ? (
              <Text style={{ color: "#9CA3AF", paddingVertical: 8 }}>
                {isCreatedSection ? "ยังไม่มีห้องที่คุณสร้าง" : "ยังไม่มีห้องที่คุณเข้าร่วม"}
              </Text>
            ) : (
              data.map((r) => (
                <MyRoomCard
                  key={r.id}
                  room={r}
                  onPress={() => router.push(`/rooms/${r.id}`)}
                />
              ))
            )}
          </View>
        );
      }}
    />
  );
}

// ------- styles -------
const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: "800", color: "#111827" },
  sectionCount: {
    backgroundColor: "#000000ff",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionCountText: { color: "#fff", fontWeight: "800", fontSize: 12 },

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

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start" },
  badgeText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  subtle: { marginTop: 2, color: "#6B7280", fontSize: 12 },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8, justifyContent: "space-between" },
  metaText: { color: "#374151", fontSize: 12 },

  chipDark: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#111827",
    flexDirection: "row",
    alignItems: "center",
  },
  chipDarkText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  note: { marginTop: 6, color: "#4B5563", fontSize: 12 },
});
