import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";

type RaidRoom = {
  id: number;
  boss: string;
  start_time: string;
  status: string;
  current_members: number;
  max_members: number;
  is_owner?: boolean;
};

export default function MyRaid() {
  const [rooms, setRooms] = useState<RaidRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const normalize = (payload: any): RaidRoom[] => {
    // รองรับทั้ง data.items และ data.rooms
    const list = payload?.items ?? payload?.rooms ?? [];
    return Array.isArray(list) ? list : [];
  };

  const load = async () => {
    try {
      setLoading(true);
      // ถ้าฝั่ง PHP รองรับ filter: /my_rooms.php?status=active&page=1&limit=50
      const { data } = await api.get("/api/raid/my_rooms.php");
      if (data?.success) {
        setRooms(navigateTimeSafe(normalize(data.data)));
      } else {
        setRooms([]);
      }
    } catch (e) {
      console.error("Load my raids error", e);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const { data } = await api.get("/api/raid/my_rooms.php");
      if (data?.success) {
        setRooms(navigateTimeSafe(normalize(data.data)));
      }
    } catch (e) {
      console.error("Refresh my raids error", e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // helper: (ถ้าต้องการแค่โชว์เวลาแบบสั้นใน list—ตัวอย่างนี้เราเก็บเดิมไว้)
  const formatDateTime = (s: string) => {
    const d = new Date(s.replace(" ", "T")); // เผื่อสตริงเป็น "YYYY-MM-DD HH:mm:ss"
    if (isNaN(d.getTime())) return s;
    return d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
  };

  // เผื่ออยากแปลงเวลาไว้ล่วงหน้า (ไม่จำเป็น แต่ทำให้ง่ายตอน render)
  function navigateTimeSafe(arr: RaidRoom[]): RaidRoom[] {
    return arr.map((r) => ({ ...r, start_time: r.start_time }));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2f6fed" />
        <Text style={{ marginTop: 8 }}>กำลังโหลดห้องของฉัน...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 16 }}>
        ห้อง Raid ของฉัน
      </Text>

      <FlatList
        data={rooms}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={{ color: "#999" }}>ยังไม่มีห้องที่คุณเข้าร่วมหรือสร้างเอง</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/rooms/${item.id}`)}
            style={{
              backgroundColor: "#fff",
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600" }}>{item.boss}</Text>
            <Text style={{ color: "#666", marginTop: 4 }}>
              {formatDateTime(item.start_time)}
            </Text>
            <Text style={{ color: "#444", marginTop: 4 }}>
              สมาชิก {item.current_members}/{item.max_members} • สถานะ: {item.status}
              {item.is_owner ? " • เจ้าของห้อง" : ""}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
