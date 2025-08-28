import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../../store/authStore";

export default function Profile() {
  const user = useAuth((s) => s.user);
  const clear = useAuth((s) => s.clear);

  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
      <Text style={{ fontSize:20, fontWeight:"700" }}>โปรไฟล์</Text>
      {user ? (
        <>
          <Text style={{ marginTop:8 }}>👤 {user.username}</Text>
          <Text style={{ marginTop:4 }}>📧 {user.email}</Text>
          <TouchableOpacity
            onPress={clear}
            style={{ marginTop:20, backgroundColor:"red", padding:12, borderRadius:8 }}
          >
            <Text style={{ color:"#fff" }}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text>ยังไม่ได้ล็อกอิน</Text>
      )}
    </View>
  );
}
