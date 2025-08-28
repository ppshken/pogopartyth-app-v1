import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { registerPushToken } from "../lib/push";

export default function Root() {
  useEffect(() => { registerPushToken(); }, []);
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: "Back" }}>
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/register" options={{ title: "Register" }} />
      <Stack.Screen name="index" options={{ title: "Rooms" }} />
      <Stack.Screen name="rooms/[id]" options={{ title: "Room", headerShown: true }} />
      <Stack.Screen name="rooms/[id]/chat" options={{ title: "Chat", headerShown: true }} />
      <Stack.Screen name="rooms/create" options={{ title: "Create Room", headerShown: true }} />
    </Stack>
  );
}
