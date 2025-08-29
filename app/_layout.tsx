import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { registerPushToken } from "../lib/push";

export default function Root() {
  useEffect(() => { registerPushToken(); }, []);
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: "กลับ" }}>
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/register" options={{ title: "สมัครสมาชิก", headerShown: true }} />
      <Stack.Screen name="index" options={{ title: "ห้องบอส" }} />
      <Stack.Screen name="rooms/[id]" options={{ title: "ห้องบอส", headerShown: true }} />
      <Stack.Screen name="rooms/[id]/chat" options={{ title: "แชท", headerShown: true }} />
      <Stack.Screen name="rooms/create" options={{ title: "สร้างห้องบอส", headerShown: true }} />
      <Stack.Screen name="settings/profile-edit" options={{ title: "แก้ไขโปรไฟล์", headerShown: true }} />
    </Stack>
  );
}
