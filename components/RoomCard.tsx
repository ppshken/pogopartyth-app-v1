import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Room = {
  id: number;
  boss: string;
  start_time: string;
  status: string;
  current_members: number;
  max_members: number;
  note?: string | null;
  owner?: { id: number; username: string; avatar?: string | null } | null;
  is_full?: boolean;
};

const BOSS_IMAGES: Record<string, string> = {
  Mewtwo: "https://th.portal-pokemon.com/play/resources/pokedex/img/pm/ad7ffb53f984a6623c53f01cfbc06fc8565ecbd4.png",
  Groudon: "https://img.pokemondb.net/artwork/large/groudon.jpg",
  Kyogre: "https://img.pokemondb.net/artwork/large/kyogre.jpg",
  Rayquaza: "https://th.portal-pokemon.com/play/resources/pokedex/img/pm/f6a02199446c37509259046601ee6ac55542e97f.png",
};
const FALLBACK =
  "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1200&auto=format&fit=crop";

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
  const pad = (n: number) => n.toString().padStart(2, "0");

  let label = "";
  if (hh > 0) label = `เหลือ ${hh} ชม. ${pad(mm)} นาที ${pad(ss)} วินาที`;
  else if (mm > 0) label = `เหลือ ${mm} นาที ${pad(ss)} วินาที`;
  else label = `เหลือ ${ss} วินาที`;

  return { expired: false, label };
}

export function RoomCardMinimal({
  room,
  onPress,
}: {
  room: Room;
  onPress?: () => void;
}) {
  const { label, expired } = useCountdown(room.start_time);
  const cover = BOSS_IMAGES[room.boss] ?? FALLBACK;

  const isFull = room.is_full ?? room.current_members >= room.max_members;

  // ใช้ “ค่าสีเป็นสตริง” เพื่อเลี่ยง TS งอ
  const statusBg = expired
    ? "#9CA3AF"
    : isFull
    ? "#EF4444"
    : room.status === "active"
    ? "#10B981"
    : "#111827";
  const statusText = expired
    ? "หมดเวลา"
    : isFull
    ? "เต็ม"
    : room.status === "active"
    ? "เปิดรับ"
    : room.status;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
        <Image source={{ uri: cover }} style={styles.thumb} />

      <View style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.title}>
            {room.boss}
          </Text>
          <View
            style={[
              styles.countChip,
              { backgroundColor: expired ? "#E5E7EB" : "#111827" },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={expired ? "#6B7280" : "#fff"}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.countText, expired && { color: "#6B7280" }]}>
              {label}
            </Text>
          </View>
        </View>

        {room.owner?.username ? (
          <Text numberOfLines={1} style={styles.owner}>
            หัวห้อง: {room.owner.username}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.people}>
            <Ionicons name="person" size={14} color="#374151" />
            <Text style={styles.metaText}>
              {" "}
              {room.current_members}/{room.max_members}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        {room.note ? (
          <Text numberOfLines={2} style={styles.note}>
            {room.note}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    // ถ้า RN เวอร์ชันคุณไม่รองรับ gap ให้ลบออก แล้วใช้ marginRight/Left แทน
    // gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  pressed: { opacity: 0.9 },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: "#F3F4F6", marginRight: 12 },
  topRow: { flexDirection: "row", alignItems: "center" },
  title: { flex: 1, fontSize: 16, fontWeight: "800", color: "#111827", marginRight: 8 },

  countChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  countText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },

  owner: { marginTop: 2, color: "#111827", fontSize: 12, fontWeight: "700" },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    // gap: 10,
    marginTop: 8,
    justifyContent: "space-between",
  },
  people: { flexDirection: "row", alignItems: "center" },
  metaText: { color: "#374151", fontSize: 16 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: "#fff", fontWeight: "800", fontSize: 12, letterSpacing: 0.2 },

  note: { marginTop: 6, color: "#4B5563", fontSize: 14 },
});
