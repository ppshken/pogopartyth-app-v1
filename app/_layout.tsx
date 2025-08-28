import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { registerPushToken } from "../lib/push";

export default function Root() {
  useEffect(() => { registerPushToken(); }, []);
  return (
    <Stack screenOptions={{ headerTitle: "PokoPartyTH" }}>
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/register" options={{ title: "Register" }} />
      <Stack.Screen name="(tabs)/index" options={{ title: "Rooms" }} />
      <Stack.Screen name="(tabs)/rooms/[id]" options={{ title: "Room" }} />
      <Stack.Screen name="(tabs)/rooms/[id]/chat" options={{ title: "Chat" }} />
      <Stack.Screen name="(tabs)/rooms/create" options={{ title: "Create Room" }} />
    </Stack>
  );
}
