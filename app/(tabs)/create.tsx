import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { createRoom } from "../../lib/raid";
import { Ionicons } from "@expo/vector-icons";

type Boss = { key: string; name: string; image: string; tier: string; stars: number };

const BOSS_LIST: Boss[] = [
  { key: "mewtwo",   name: "Mewtwo",   image: "https://img.pokemondb.net/artwork/large/mewtwo.jpg",   tier: "Tier 5", stars: 5 },
  { key: "rayquaza", name: "Rayquaza", image: "https://img.pokemondb.net/artwork/large/rayquaza.jpg", tier: "Tier 5", stars: 5 },
  { key: "groudon",  name: "Groudon",  image: "https://img.pokemondb.net/artwork/large/groudon.jpg",  tier: "Tier 5", stars: 5 },
  { key: "kyogre",   name: "Kyogre",   image: "https://img.pokemondb.net/artwork/large/kyogre.jpg",   tier: "Tier 5", stars: 5 },
  { key: "zacian",   name: "Zacian",   image: "https://img.pokemondb.net/artwork/large/zacian-hero-of-many-battles.jpg", tier: "Tier 5", stars: 5 },
  { key: "dialga",   name: "Dialga",   image: "https://img.pokemondb.net/artwork/large/dialga.jpg",   tier: "Tier 5", stars: 5 },
];

const MIN_HOUR = 5;   // 05:00
const MAX_HOUR = 23;  // 23:00
const STEP_MIN = 5;   // สร้างรายการเวลา ทุกๆ 5 นาที

const pad = (n: number) => n.toString().padStart(2, "0");
const formatYmdHms = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;

function ceilToStep(date: Date, stepMin: number) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const m = d.getMinutes();
  const add = (stepMin - (m % stepMin)) % stepMin;
  d.setMinutes(m + add);
  return d;
}

/** สร้างรายการเวลา ตามกติกาในโจทย์ */
function generateTimeSlots(now = new Date()): { label: string; date: Date }[] {
  const slots: { label: string; date: Date }[] = [];
  const fiveLater = new Date(now.getTime() + 5 * 60 * 1000);

  // หา earliest วันนี้: max(ceil(now+5, STEP), today@05:00)
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const earliestToday = new Date(today);
  earliestToday.setHours(MIN_HOUR, 0, 0, 0);

  let start = ceilToStep(fiveLater, STEP_MIN);
  if (start.getHours() < MIN_HOUR) {
    start = new Date(today);
    start.setHours(MIN_HOUR, 0, 0, 0);
  }

  const todayEnd = new Date(today);
  todayEnd.setHours(MAX_HOUR, 0, 0, 0);

  // ถ้าวันนี้เลยช่วง (>=23:00) หรือยังไม่ถึง 05:00 พรุ่งนี้ ให้ทำพรุ่งนี้ 05:00–23:00
  const useTomorrow = start.getTime() > todayEnd.getTime();
  const baseDay = new Date(today);
  if (useTomorrow) baseDay.setDate(baseDay.getDate() + 1);

  const begin = new Date(baseDay);
  // ถ้าเป็นวันพรุ่งนี้ → เริ่ม 05:00; ถ้ายังเป็นวันนี้ → เริ่ม start ที่คำนวณแล้ว
  if (useTomorrow) {
    begin.setHours(MIN_HOUR, 0, 0, 0);
  } else {
    begin.setTime(start.getTime());
  }

  const end = new Date(baseDay);
  end.setHours(MAX_HOUR, 0, 0, 0);

  const cursor = new Date(begin);
  while (cursor.getTime() <= end.getTime()) {
    const hh = pad(cursor.getHours());
    const mm = pad(cursor.getMinutes());
    slots.push({ label: `${hh}:${mm}`, date: new Date(cursor) });
    cursor.setMinutes(cursor.getMinutes() + STEP_MIN);
  }
  return slots;
}

function Stars({ count }: { count: number }) {
  return <Text style={{ color: "#F59E0B", fontWeight: "800" }}>{"★".repeat(count)}</Text>;
}

export default function CreateRoom() {
  const router = useRouter();

  // 1) Boss
  const [bossOpen, setBossOpen] = useState(false);
  const [boss, setBoss] = useState<Boss>(BOSS_LIST[0]);

  // 2) Time
  const [timeOpen, setTimeOpen] = useState(false);
  const [slots, setSlots] = useState<{ label: string; date: Date }[]>([]);
  const [startAt, setStartAt] = useState<Date>(() => {
    const s = generateTimeSlots()[0]?.date ?? new Date(Date.now() + 30 * 60 * 1000);
    s.setSeconds(0, 0);
    return s;
  });

  useEffect(() => {
    setSlots(generateTimeSlots());
  }, []);

  // 3) Max members
  const [peopleOpen, setPeopleOpen] = useState(false);
  const PEOPLE = useMemo(() => Array.from({ length: 19 }, (_, i) => i + 2), []);
  const [max, setMax] = useState<number>(6);

  // 4) Note
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const isPast = startAt.getTime() <= Date.now();
  const canSubmit = !loading && !!boss && !isPast && max >= 2 && max <= 20;

  const refreshTimeSlots = () => {
    const s = generateTimeSlots();
    setSlots(s);
  };

  const onSubmit = async () => {
    if (!canSubmit) {
      Alert.alert("ข้อมูลไม่ครบ", isPast ? "เวลาต้องอยู่ในอนาคต" : "กรุณาเลือกข้อมูลให้ครบ");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        boss: boss.name,
        start_time: formatYmdHms(startAt),
        max_members: max,
        note: note.trim() || undefined,
      };
      const room = await createRoom(payload);
      Alert.alert("สำเร็จ", `สร้างห้อง #${room.id}`);
      router.push(`/rooms/${room.id}`);
    } catch (e: any) {
      Alert.alert("สร้างห้องไม่สำเร็จ", e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>

        {/* Boss dropdown */}
        <View style={styles.card}>
          <Text style={styles.label}>บอส</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setBossOpen(true)}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <Image source={{ uri: boss.image }} style={{ width: 36, height: 36, borderRadius: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "800", color: "#111827" }}>{boss.name}</Text>
                <Text style={{ color: "#6B7280", fontSize: 12 }}>
                  {boss.tier} • <Stars count={boss.stars} />
                </Text>
              </View>
            </View>
            <Text style={{ color: "#6B7280" }}>
              <Ionicons name="chevron-down-sharp" size={20} color="#111827" />
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time dropdown */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.label}>เวลาเริ่ม (วันนี้/พรุ่งนี้ตามเงื่อนไข)</Text>
            <TouchableOpacity onPress={refreshTimeSlots}><Text style={styles.link}>รีเฟรชเวลา</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.dropdown} onPress={() => setTimeOpen(true)}>
            <Text style={{ fontWeight: "800", color: "#111827" }}>
              {startAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
            </Text>
            <Text style={{ color: "#6B7280" }}>
              <Ionicons name="chevron-down-sharp" size={20} color="#111827" />
            </Text>
          </TouchableOpacity>
          {isPast && <Text style={{ color: "#EF4444", marginTop: 8, fontSize: 12 }}>เวลาต้องอยู่ในอนาคต</Text>}
          <Text style={{ color: "#6B7280", marginTop: 6, fontSize: 12 }}>
            วันนี้: จากตอนนี้ +5 นาที จนถึง 23:00 • ถ้าเลยช่วงแล้วจะแสดงของพรุ่งนี้ตั้งแต่ 05:00–23:00
          </Text>
        </View>

        {/* People dropdown */}
        <View style={styles.card}>
          <Text style={styles.label}>จำนวนสมาชิกสูงสุด</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setPeopleOpen(true)}>
            <Text style={{ fontWeight: "800", color: "#111827" }}>{max} คน</Text>
            <Text style={{ color: "#6B7280" }}>
              <Ionicons name="chevron-down-sharp" size={20} color="#111827" />
            </Text>
          </TouchableOpacity>
          <Text style={{ color: "#6B7280", marginTop: 6, fontSize: 12 }}>เลือกได้ 2–20 คน</Text>
        </View>

        {/* Note */}
        <View style={styles.card}>
          <Text style={styles.label}>หมายเหตุ</Text>
          <TextInput
            placeholder="พิมพ์หมายเหตุ เช่น ขอคนมี Remote Pass"
            value={note}
            onChangeText={setNote}
            multiline
            style={styles.textarea}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={onSubmit}
          disabled={!canSubmit}
          style={[styles.submit, !canSubmit && { backgroundColor: "#D1D5DB" }]}
        >
          <Text style={{ color: "#fff", fontWeight: "800", textAlign: "center" }}>
            {loading ? "กำลังสร้าง..." : "สร้างห้อง"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Boss modal */}
      <Modal visible={bossOpen} transparent animationType="fade" onRequestClose={() => setBossOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={{ fontWeight: "800", fontSize: 16, marginBottom: 8 }}>เลือกบอส</Text>
            <FlatList
              data={BOSS_LIST}
              keyExtractor={(x) => x.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { setBoss(item); setBossOpen(false); }}
                  style={styles.itemRow}
                >
                  <Image source={{ uri: item.image }} style={{ width: 48, height: 48, borderRadius: 10, marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "800", color: "#111827" }}>{item.name}</Text>
                    <Text style={{ color: "#6B7280", fontSize: 12 }}>
                      {item.tier} • <Stars count={item.stars} />
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
            <TouchableOpacity onPress={() => setBossOpen(false)} style={[styles.btnOutline, { marginTop: 12 }]}>
              <Text style={styles.btnOutlineText}>
                ปิด
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time modal */}
      <Modal visible={timeOpen} transparent animationType="fade" onRequestClose={() => setTimeOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontWeight: "800", fontSize: 16 }}>เลือกเวลา</Text>
              <TouchableOpacity onPress={() => setTimeOpen(false)}><Text style={styles.link}><Ionicons name="close" size={20} color="#111827" /></Text></TouchableOpacity>
            </View>
            <FlatList
              data={slots}
              keyExtractor={(x) => x.label}
              initialNumToRender={40}
              getItemLayout={(_, index) => ({ length: 48, offset: 48 * index, index })}
              renderItem={({ item }) => {
                const selected = Math.abs(item.date.getTime() - startAt.getTime()) < 60000;
                return (
                  <TouchableOpacity
                    onPress={() => { setStartAt(item.date); setTimeOpen(false); }}
                    style={[styles.listItem, selected && { backgroundColor: "#F3F4F6" }]}
                  >
                    <Text style={{ fontWeight: "700", color: "#111827" }}>{item.label}</Text>
                    {selected ? <Text style={{ color: "#2563EB" }}>✓</Text> : null}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            />
          </View>
        </View>
      </Modal>

      {/* People modal */}
      <Modal visible={peopleOpen} transparent animationType="fade" onRequestClose={() => setPeopleOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontWeight: "800", fontSize: 16 }}>จำนวนสมาชิก</Text>
              <TouchableOpacity onPress={() => setPeopleOpen(false)}><Text style={styles.link}><Ionicons name="close" size={20} color="#111827" /></Text></TouchableOpacity>
            </View>
            <FlatList
              data={PEOPLE}
              keyExtractor={(x) => String(x)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { setMax(item); setPeopleOpen(false); }}
                  style={styles.listItem}
                >
                  <Text style={{ fontWeight: "700", color: "#111827" }}>{item} คน</Text>
                  {item === max ? <Text style={{ color: "#2563EB" }}>✓</Text> : null}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  label: { fontWeight: "800", fontSize: 14, color: "#111827", marginBottom: 8 },
  dropdown: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: "#F9FAFB", flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  textarea: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 12, backgroundColor: "#F9FAFB",
    minHeight: 90, textAlignVertical: "top",
  },
  submit: { backgroundColor: "#111827", paddingVertical: 14, borderRadius: 12, marginTop: 8 },

  link: { color: "#2563EB", fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: "70%" },

  itemRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 8,
    borderWidth: 1, borderColor: "#F3F4F6", borderRadius: 12, paddingHorizontal: 10,
    backgroundColor: "#fff",
  },

  btnOutline: { borderWidth: 1, borderColor: "#111827", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  btnOutlineText: { fontWeight: "800", color: "#111827" },

  listItem: {
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff",
  },
});
