import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { createRoom } from "../../../lib/raid";

export default function CreateRoom() {
  const [boss, setBoss] = useState("Mewtwo");
  const [start, setStart] = useState("2025-09-01 20:00:00");
  const [max, setMax] = useState("6");
  const [note, setNote] = useState("");
  const router = useRouter();

  const onSubmit = async () => {
    try {
      const room = await createRoom({ boss, start_time: start, max_members: Number(max), note });
      Alert.alert("สำเร็จ", `สร้างห้อง #${room.id}`);
      router.replace(`/(tabs)/rooms/${room.id}`);
    } catch (e:any) {
      Alert.alert("Error", e.message || "failed");
    }
  };

  return (
    <View style={{ flex:1, padding:16 }}>
      <Text style={{ fontSize:20, fontWeight:"700" }}>สร้างห้อง</Text>
      <TextInput placeholder="ชื่อบอส" value={boss} onChangeText={setBoss}
        style={{ borderWidth:1, borderColor:"#ddd", padding:12, borderRadius:10, marginTop:12 }} />
      <TextInput placeholder="เวลาเริ่ม (YYYY-MM-DD HH:MM:SS)" value={start} onChangeText={setStart}
        style={{ borderWidth:1, borderColor:"#ddd", padding:12, borderRadius:10, marginTop:12 }} />
      <TextInput placeholder="จำนวนสูงสุด" value={max} onChangeText={setMax} keyboardType="number-pad"
        style={{ borderWidth:1, borderColor:"#ddd", padding:12, borderRadius:10, marginTop:12 }} />
      <TextInput placeholder="หมายเหตุ" value={note} onChangeText={setNote}
        style={{ borderWidth:1, borderColor:"#ddd", padding:12, borderRadius:10, marginTop:12 }} />
      <TouchableOpacity onPress={onSubmit} style={{ backgroundColor:"#2ecc71", padding:14, borderRadius:10, marginTop:16 }}>
        <Text style={{ color:"#fff", fontWeight:"700", textAlign:"center" }}>สร้าง</Text>
      </TouchableOpacity>
    </View>
  );
}
