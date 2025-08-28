import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { listRooms } from "../../lib/raid";
import { RoomCard } from "../../components/RoomCard";

export default function RoomsIndex() {
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const load = async () => {
    setRefreshing(true);
    try {
      const res = await listRooms({ status: "active", page: 1, limit: 50 });
      setItems(res.items || []);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(()=>{ load(); }, []);

  return (
    <View style={{ flex:1, padding:16 }}>
      <FlatList
        data={items}
        keyExtractor={(it)=>String(it.id)}
        renderItem={({ item }) => (
          <RoomCard room={item} onPress={()=>router.push(`/(tabs)/rooms/${item.id}`)} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load}/>}
        ListEmptyComponent={<Text style={{ color:"#999" }}>ยังไม่มีห้อง</Text>}
      />
      <TouchableOpacity onPress={()=>router.push("/(tabs)/rooms/create")}
        style={{ position:"absolute", right:16, bottom:16, backgroundColor:"#2f6fed",
          paddingHorizontal:18, paddingVertical:14, borderRadius:25 }}>
        <Text style={{ color:"#fff", fontWeight:"700" }}>+ สร้างห้อง</Text>
      </TouchableOpacity>
    </View>
  );
}
