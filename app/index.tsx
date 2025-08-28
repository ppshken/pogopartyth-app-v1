// app/index.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";

export default function Index() {
  const [ready, setReady] = useState(false);
  const [href, setHref] = useState<string>("/(auth)/login"); // ดีฟอลต์ไป login

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        setHref(token ? "/(tabs)/room_raid" : "/(auth)/login"); // ✅ มี token → raid_boss
      } catch {
        setHref("/(auth)/login");
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={href} />;
}
