import React from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useAuth } from "../../store/authStore";
import { useRouter } from "expo-router";


export default function Profile() {
  const user = useAuth((s) => s.user);
  const clear = useAuth((s) => s.clear);
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const onLogout = async () => {
    setLoading(true);
    setTimeout(async () => {
      setLoading(false);
      router.replace("/(auth)/login");
      await clear();
    }, 1000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb", padding: 20 }}>
      {/* Header */}
      <Text style={{ fontSize: 26, fontWeight: "700", marginBottom: 20 }}>
        โปรไฟล์ของฉัน
      </Text>

      {/* User Card */}
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 20,
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Avatar */}
        {user?.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 12 }}
          />
        ) : (
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              marginBottom: 12,
              backgroundColor: "#e5e7eb",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 36, fontWeight: "700", color: "#374151" }}>
              {user?.username ? user.username.charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
        )}

        {/* Username */}
        <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 4 }}>
          {user?.username || "ไม่ระบุชื่อ"}
        </Text>

        {/* Email */}
        <Text style={{ fontSize: 14, color: "#6b7280" }}>
          {user?.email || "-"}
        </Text>
      </View>

      {/* Info Section */}
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 16,
          marginTop: 20,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
          ข้อมูลเพิ่มเติม
        </Text>
        <Text style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>
          📌 Friend Code: {user?.friend_code || "-"}
        </Text>
        <Text style={{ fontSize: 14, color: "#374151" }}>
          🕒 เข้าร่วมเมื่อ: {user?.created_at || "-"}
        </Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={onLogout}
        style={{
          backgroundColor: "#ef4444",
          padding: 14,
          borderRadius: 12,
          marginTop: 30,
          alignItems: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            ออกจากระบบ
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
