import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getRoom, joinRoom, leaveRoom } from "../../../lib/raid";

export default function RoomDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await getRoom(Number(id));
    setData(res);
  };

  useEffect(() => { load(); }, [id]);

  if (!data) return <View style={{ flex: 1, padding: 16 }}><Text>กำลังโหลด...</Text></View>;

  const { room, you } = data;
  const isMember = you?.is_member;
  const isOwner = you?.is_owner;

  const onJoinLeave = async () => {
    try {
      setLoading(true);
      if (isMember && !isOwner) {
        await leaveRoom(room.id);
      } else if (!isMember) {
        await joinRoom(room.id);
      }
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message || "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>{room.boss}</Text>
      <Text style={{ color: "#666", marginBottom: 6 }}>{room.start_time}</Text>
      <Text>สมาชิก: {room.current_members}/{room.max_members} • สถานะ: {room.status}</Text>

      <View style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>ผู้เข้าร่วม:</Text>
        {data.members?.length ? (
          data.members.map((m: any) => (
            <View key={m.user_id}
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, padding: 8, borderWidth: 1, borderColor: "#eee", borderRadius: 8 }}>
              {/* Avatar (ถ้ามี) */}
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#ddd", marginRight: 8, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontWeight: "700" }}>
                  {m.username ? m.username.charAt(0).toUpperCase() : "?"}
                </Text>
              </View>

              {/* ชื่อ + role */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600" }}>
                  {m.username || `User#${m.user_id}`}
                </Text>
                <Text style={{ fontSize: 12, color: "#666" }}>
                  {m.role === "owner" ? "เจ้าของห้อง" : "สมาชิก"} • {new Date(m.joined_at).toLocaleString("th-TH")}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ color: "#999" }}>ยังไม่มีสมาชิก</Text>
        )}
      </View>


      <TouchableOpacity onPress={() => router.push(`/(tabs)/rooms/${room.id}/chat`)}
        style={{ marginTop: 16, backgroundColor: "#333", padding: 12, borderRadius: 10 }}>
        <Text style={{ color: "#fff", textAlign: "center" }}>เข้าแชท</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onJoinLeave} disabled={loading}
        style={{ marginTop: 10, backgroundColor: isMember && !isOwner ? "#e74c3c" : "#2ecc71", padding: 12, borderRadius: 10 }}>
        <Text style={{ color: "#fff", textAlign: "center" }}>{isMember && !isOwner ? "ออกจากห้อง" : "เข้าร่วมห้อง"}</Text>
      </TouchableOpacity>
    </View>
  );
}
