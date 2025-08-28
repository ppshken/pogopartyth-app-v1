import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { login } from "../../lib/auth";
import { useRouter } from "expo-router";
import { useAuth } from "../../store/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuth((s)=>s.setAuth);

  const onLogin = async () => {
    setLoading(true);
    try {
      const { user, token } = await login({ email, password });
      await setAuth(user, token);
      router.replace("/room_raid");
    } catch (e:any) {
      Alert.alert("Login failed" , e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex:1, padding:16, justifyContent:"center" }}>
      <Text style={{ fontSize:24, fontWeight:"700", marginBottom:16 }}>เข้าสู่ระบบ</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none"
        style={{ borderWidth:1, borderColor:"#ddd", padding:12, borderRadius:10, marginBottom:12 }} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry
        style={{ borderWidth:1, borderColor:"#ddd", padding:12, borderRadius:10, marginBottom:12 }} />
      <TouchableOpacity onPress={onLogin} disabled={loading}
        style={{ backgroundColor:"#2f6fed", padding:14, borderRadius:10, alignItems:"center" }}>
        <Text style={{ color:"#fff", fontWeight:"700" }}>{loading? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</Text>
      </TouchableOpacity>
      <View style={{ marginTop:24, flexDirection:"row", justifyContent:"center", gap:8 }}>
      <Text>ยังไม่มีบัญชี?</Text>
        <TouchableOpacity onPress={()=>router.push("/(auth)/register")} style={{alignItems:"center" }}>
          <Text style={{textDecorationLine: "underline"}}>สมัครสมาชิก</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
