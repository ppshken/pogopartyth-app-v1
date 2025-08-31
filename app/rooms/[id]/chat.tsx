import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getMessages, sendMessage, ChatMessage } from "../../../lib/chat";
import { MessageItem } from "../../../components/MessageItem";
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [sinceId, setSinceId] = useState<number>(0);
  const [text, setText] = useState("");
  const timer = useRef<any>(null);

  const load = async () => {
    const res = await getMessages(roomId, sinceId || undefined, 100);
    if (res.items?.length) {
      setItems((prev) => [...prev, ...res.items]);
      setSinceId(res.next_since_id);
    }
  };

  useEffect(() => {
    load();
    timer.current = setInterval(load, 3000);
    return () => clearInterval(timer.current);
  }, [roomId, sinceId]);

  const onSend = async () => {
    if (!text.trim()) return;
    const msg = await sendMessage(roomId, text.trim());
    setItems((prev) => [...prev, msg]);
    setSinceId(Math.max(sinceId, msg.id));
    setText("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={70} // ปรับตาม header ของคุณ
    >
      <View style={{ flex: 1, padding: 16 }}>
        <FlatList
          data={items}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item }) => <MessageItem m={item} />}
          contentContainerStyle={{ paddingBottom: 16 }}
        />

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 24 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="พิมพ์ข้อความ..."
            style={{ flex: 1, borderWidth: 1, borderColor: "#c5c5c5ff", padding: 12, borderRadius: 10 }}
          />
          <TouchableOpacity
            onPress={onSend}
            style={{ marginLeft: 8, backgroundColor: "#2f6fed", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>ส่ง</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

}
