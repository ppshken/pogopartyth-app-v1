import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { listRooms } from "../../lib/raid";
import { RoomCardMinimal } from "../../components/RoomCard";
import { useRefetchOnFocus } from "../../hooks/useRefetchOnFocus";


type Room = {
  id: number;
  boss: string;
  start_time: string; // "YYYY-MM-DD HH:mm:ss"
  status: string;
  current_members: number;
  max_members: number;
  note?: string | null;
  owner?: { id: number; username: string; avatar?: string | null } | null;
};

export default function RoomsIndex() {
  const [items, setItems] = useState<Room[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();

  const load = useCallback(async () => {
    
    try {
      const res = await listRooms({ status: "active", page: 1, limit: 100 });
      setItems(res.items || res.rooms || []);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useRefetchOnFocus(load, [load]);

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
          <RoomCardMinimal
            room={item}
            // ⚠️ ปรับ path ให้ตรงกับโครงสร้างโปรเจกต์คุณ:
            // ถ้าอยู่ใต้ (tabs) ให้ใช้ "/(tabs)/rooms/..."
            onPress={() => router.push(`/rooms/${item.id}`)}
          />
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
});
