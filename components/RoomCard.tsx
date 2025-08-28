import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";

type Room = {
  id: number;
  boss: string;
  start_time: string;          // "YYYY-MM-DD HH:mm:ss"
  status: string;              // active | closed | canceled ...
  current_members: number;
  max_members: number;
  note?: string | null;
  owner?: { id: number; username: string; avatar?: string | null } | null;
  is_full?: boolean;
};

const BOSS_IMAGES: Record<string, string> = {
  Mewtwo: "https://img.pokemondb.net/artwork/large/mewtwo.jpg",
  Groudon: "https://img.pokemondb.net/artwork/large/groudon.jpg",
  Kyogre:  "https://img.pokemondb.net/artwork/large/kyogre.jpg",
  Rayquaza:"https://img.pokemondb.net/artwork/large/rayquaza.jpg",
  // เพิ่มได้ตามต้องการ
};

function parseStart(s: string): Date {
  const iso = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date(s) : d;
}

function useCountdown(start: string) {
  const target = useMemo(() => parseStart(start), [start]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = target.getTime() - now;
  const expired = diff <= 0;

  let label = "หมดเวลา";
  if (!expired) {
    const totalMin = Math.floor(diff / 60000);
    const hh = Math.floor(totalMin / 60);
    const mm = totalMin % 60;
    label = `เหลือ ${hh} ชม. ${mm.toString().padStart(2, "0")} นาที`;
  }
  return { label, expired };
}

export function RoomCardMinimal({ room, onPress }: { room: Room; onPress?: () => void }) {
  const { label, expired } = useCountdown(room.start_time);
  const cover =
    BOSS_IMAGES[room.boss] ??
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1200&auto=format&fit=crop";

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {/* Thumbnail */}
      <Image source={{ uri: cover }} style={styles.thumb} />

      {/* Content */}
      <View style={{ flex: 1 }}>
        {/* Top row: Title + countdown chip */}
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.title}>{room.boss}</Text>
          <View
            style={[
              styles.chip,
              expired ? { backgroundColor: "#E5E7EB" } : { backgroundColor: "#111827" },
            ]}
          >
            <Text style={[styles.chipText, expired && { color: "#6B7280" }]}>
              {expired ? "หมดเวลา" : label}
            </Text>
          </View>
        </View>

        {/* Sub info */}
        {room.owner?.username ? (
          <Text numberOfLines={1} style={styles.subtle}>หัวห้อง: {room.owner.username}</Text>
        ) : null}

        {/* Meta row */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            สมาชิก {room.current_members}/{room.max_members}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.metaText}>
            {room.status === "active" ? "เปิดรับ" : room.status}
          </Text>
          {room.is_full ? (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={[styles.metaText, { color: "#EF4444" }]}>ห้องเต็ม</Text>
            </>
          ) : null}
        </View>

        {/* Note (optional) */}
        {room.note ? (
          <Text numberOfLines={2} style={styles.note}>{room.note}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  pressed: {
    opacity: 0.9,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginRight: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  subtle: {
    marginTop: 2,
    color: "#6B7280",
    fontSize: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  metaText: {
    color: "#374151",
    fontSize: 12,
  },
  dot: {
    color: "#D1D5DB",
  },
  note: {
    marginTop: 6,
    color: "#4B5563",
    fontSize: 12,
  },
});
