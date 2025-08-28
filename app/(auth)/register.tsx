import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { register } from "../../lib/auth";
import { useRouter } from "expo-router";
import { useAuth } from "../../store/authStore";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);

  const onRegister = async () => {
    setLoading(true);
    try {
      const { user, token } = await register({ email, username, password });
      await setAuth(user, token);
      router.replace("/(tabs)/index");
    } catch (e: any) {
      Alert.alert("Register failed", e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 16 }}>สมัครสมาชิก</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none"
        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 10, marginBottom: 12 }} />
      <TextInput placeholder="Username" value={username} onChangeText={setUsername}
        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 10, marginBottom: 12 }} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry
        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 10, marginBottom: 12 }} />
      <TouchableOpacity onPress={onRegister} disabled={loading}
        style={{ backgroundColor: "#22bb33", padding: 14, borderRadius: 10, alignItems: "center" }}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>{loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}</Text>
      </TouchableOpacity>
    </View>
  );
}
