import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export function RoomCard({ room, onPress }:{ room:any; onPress:()=>void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding:12, backgroundColor:"#fff", borderRadius:12, marginBottom:10, shadowOpacity:0.05, shadowRadius:4 }}>
      <Text style={{ fontSize:16, fontWeight:"600" }}>{room.boss}</Text>
      <Text style={{ color:"#666", marginTop:4 }}>{room.start_time}</Text>
      <Text style={{ color:"#666" }}>สมาชิก: {room.current_members}/{room.max_members} • สถานะ: {room.status}</Text>
    </TouchableOpacity>
  );
}
