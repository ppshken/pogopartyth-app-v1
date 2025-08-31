// app/(tabs)/rooms/[id].tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  StatusBar
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import {
  getRoom,
  joinRoom,
  leaveRoom,
  getFriendReadyStatus,
  setFriendReady,
  updateStatus,   // invited / closed
  reviewRoom,     // rating 1-5 + comment (ใช้ comment ใส่เหตุผลตอนไม่สำเร็จ)
} from "../../lib/raid";

const topPad = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 8 : 0;

type Member = {
  user_id: number;
  role: "owner" | "member";
  joined_at: string;
  username: string;
  avatar?: string | null;
  friend_code?: string | null;
  friend_ready?: 0 | 1;
};

type RoomOwner = {
  id: number;
  username: string;
  avatar?: string | null;
  friend_code?: string | null;
};

type RoomPayload = {
  room: {
    id: number;
    raid_boss_id: number;
    pokemon_image: string;
    boss: string;
    start_time: string;
    status: "active" | "closed" | "canceled" | "invited" | string;
    current_members: number;
    max_members: number;
    is_full?: boolean;
    note?: string | null;
    owner: RoomOwner;
  };
  members: Member[];
  you: {
    user_id: number;
    is_member: boolean;
    is_owner: boolean;
    role: "owner" | "member";
  };
  // ⬇️ ถ้าแบ็กเอนด์มีเมตารีวิว ให้ใช้ได้เลย (optional)
  meta?: {
    total_members?: number;
    review_done_count?: number;
    review_pending_count?: number;
  };
};

const pad2 = (n: number) => n.toString().padStart(2, "0");
const toYmdHms = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

function parseStart(s: string): Date {
  const iso = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date(s) : d;
}

/** >1ชม = ชม.นาทีวินาที, <1ชม = นาทีวินาที, <1นาที = วินาที */
function useCountdown(start: string) {
  const target = useMemo(() => parseStart(start).getTime(), [start]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diffMs = target - now;
  const expired = diffMs <= 0;
  if (expired) return { expired: true, label: "หมดเวลา" };

  const totalSec = Math.floor(diffMs / 1000);
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;

  let label = "";
  if (hh > 0) label = `เหลือ ${hh} ชม. ${pad2(mm)} นาที ${pad2(ss)} วินาที`;
  else if (mm > 0) label = `เหลือ ${mm} นาที ${pad2(ss)} วินาที`;
  else label = `เหลือ ${ss} วินาที`;

  return { expired: false, label };
}

export default function RoomDetail() {
  // ⬇️ hooks ทั้งหมด “บนสุด” ของคอมโพเนนต์
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const router = useRouter();

  const [data, setData] = useState<RoomPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // สถานะ “เพิ่มเพื่อนแล้ว”
  const [friendAdded, setFriendAdded] = useState<Record<number, boolean>>({});

  // โมดัลผลลัพธ์/รีวิว
  const [resultModal, setResultModal] = useState(false);   // เลือก สำเร็จ/ไม่สำเร็จ
  const [ratingModal, setRatingModal] = useState(false);   // ให้คะแนน 1-5
  const [failureModal, setFailureModal] = useState(false); // กรอกเหตุผลไม่สำเร็จ
  const [rating, setRating] = useState<number>(5);
  const [failReason, setFailReason] = useState("");

  // ป้องกันสั่งปิดห้องซ้ำ
  const closingRef = useRef(false);

  // โหลดข้อมูลห้อง
  const load = useCallback(async () => {
    const res = await getRoom(roomId);
    setData(res as RoomPayload);

    // โหลด ready-status ของเพื่อนเฉพาะตอนเราเป็นสมาชิก
    if (res?.you?.is_member) {
      try {
        const st = await getFriendReadyStatus(roomId);
        const map: Record<number, boolean> = {};
        (st.members as Member[]).forEach((m) => {
          if (m.role !== "owner") map[m.user_id] = !!m.friend_ready;
        });
        setFriendAdded(map);
      } catch {
        // เงียบไว้ได้
      }
    } else {
      setFriendAdded({});
    }
  }, [roomId]);

  // เริ่มโหลดครั้งแรก
  useEffect(() => { load(); }, [load]);

  // โพลลิ่งทุก 3 วินาที (รีเฟรชหน้าจออัตโนมัติ)
  useEffect(() => {
    const t = setInterval(() => load(), 3000);
    return () => clearInterval(t);
  }, [load]);

  // เคาน์ดาวน์: ต้องเรียกทุกครั้ง (ใส่ fallback เมื่อ data ยังไม่มา)
  const startForCountdown =
    data?.room?.start_time ?? toYmdHms(new Date(Date.now() + 60_000));
  const { label: countdownLabel, expired } = useCountdown(startForCountdown);

  // ถ้ามีเมตารีวิวครบแล้ว (หลังเชิญ) → ปิดห้องอัตโนมัติ (ฝั่ง server ควรตรวจให้ชัวร์ด้วย)
  useEffect(() => {
    if (!data) return;
    if (data.room.status !== "invited") return;

    const total =
      data.meta?.total_members ?? (data.members?.length ?? 0);
    const done =
      data.meta?.review_done_count ??
      (typeof data.meta?.review_pending_count === "number"
        ? total - (data.meta!.review_pending_count as number)
        : 0);

    if (total > 0 && done >= total && !closingRef.current) {
      closingRef.current = true;
      (async () => {
        try {
          await updateStatus(data.room.id, "closed");
          await load();
          Alert.alert("ปิดห้องแล้ว", "รีวิวครบทุกคน ระบบปิดห้องให้เรียบร้อย");
        } catch {
          // ถ้าเซิร์ฟเวอร์ยังไม่พร้อม/ไม่ยอมปิด ก็ไม่ลูปซ้ำ
        } finally {
          closingRef.current = false;
        }
      })();
    }
  }, [data, load]);

  // ก่อนมี data
  if (!data) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>กำลังโหลด...</Text>
      </View>
    );
  }

  // --- ตัวแปรช่วย ---
  const { room, you } = data;
  const isMember = you?.is_member;
  const isOwner = you?.is_owner;

  const members = data.members;
  const nonOwnerMembers = members.filter((m) => m.role !== "owner");
  const allAdded =
    nonOwnerMembers.length > 0 &&
    nonOwnerMembers.every((m) => friendAdded[m.user_id]);

  // สี/ข้อความสถานะ
  const statusBg =
    room.status === "invited" ? "#2563EB" :
    expired ? "#9CA3AF" :
    room.is_full || room.current_members >= room.max_members ? "#EF4444" :
    room.status === "active" ? "#10B981" : "#111827";

  const statusText =
    room.status === "invited" ? "เชิญแล้ว" :
    expired ? "หมดเวลา" :
    room.is_full || room.current_members >= room.max_members ? "เต็ม" :
    room.status === "active" ? "เปิดรับ" : room.status;

  // --- handlers ---
  const onJoinLeave = async () => {
    try {
      setLoading(true);
      if (isMember && !isOwner) await leaveRoom(room.id);
      else if (!isMember) await joinRoom(room.id);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message || "failed");
    } finally {
      setLoading(false);
    }
  };

  const copyUsernames = async () => {
    try {
      const names = members
        .filter((m) => m.role !== "owner")
        .map((m) => m.username || `User#${m.user_id}`);
      await Clipboard.setStringAsync(names.join(", "));
      Alert.alert("คัดลอกแล้ว", "คัดลอกชื่อผู้เล่นเรียบร้อย");
    } catch {
      Alert.alert("คัดลอกไม่สำเร็จ", "ลองใหม่อีกครั้ง");
    }
  };

  const copyFriendCode = async () => {
    const code = room.owner?.friend_code?.trim();
    if (!code) return Alert.alert("ไม่พบรหัส", "หัวห้องยังไม่ระบุ Friend Code");
    await Clipboard.setStringAsync(code);
    Alert.alert("คัดลอกแล้ว", "คัดลอกรหัสเพื่อนของหัวห้อง");
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  };

  const toggleFriend = async (uid: number) => {
    const prev = friendAdded[uid] || false;
    const next = !prev;
    setFriendAdded((m) => ({ ...m, [uid]: next })); // optimistic
    try {
      await setFriendReady(room.id, next, isOwner && uid !== you.user_id ? uid : undefined);
    } catch (e: any) {
      setFriendAdded((m) => ({ ...m, [uid]: prev })); // revert
      Alert.alert("อัปเดตไม่สำเร็จ", e.message || "เกิดข้อผิดพลาด");
    }
  };

  // เชิญในเกม → เปลี่ยนสถานะเป็น invited
  const onInvite = async () => {
    try {
      setLoading(true);
      await updateStatus(room.id, "invited");
      Alert.alert("เชิญในเกมแล้ว", "ได้ส่งเชิญไปยังสมาชิกเรียบร้อย — หลังจากนี้ทุกคนจะสามารถรีวิวได้");
      await load();
    } catch (e: any) {
      Alert.alert("เชิญไม่สำเร็จ", e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  // เปิด modal “ตีบอสเสร็จ”
  const onBattleFinished = () => setResultModal(true);

  // ผล “สำเร็จ” ⇒ ให้ทุกคนรีวิว (รวม Owner ด้วย)
  const onResultSuccess = () => {
    setResultModal(false);
    setRating(5);
    setRatingModal(true);
  };

  // ส่งคะแนนรีวิว (ทุกคน)
  const onSubmitRating = async () => {
    try {
      setLoading(true);
      await reviewRoom(room.id, rating, "Raid success");
      setRatingModal(false);
      Alert.alert("ขอบคุณ", "บันทึกรีวิวเรียบร้อย");
      await load();
      router.back();
    } catch (e: any) {
      Alert.alert("รีวิวไม่สำเร็จ", e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  // ผล “ไม่สำเร็จ”
  const onResultFail = () => {
    setResultModal(false);
    setFailReason("");
    setFailureModal(true);
  };

  // ส่งเหตุผลไม่สำเร็จ (ให้คะแนน 1 พร้อมเหตุผล)
  const onSubmitFailReason = async () => {
    if (!failReason.trim()) return Alert.alert("กรอกเหตุผล", "โปรดระบุสาเหตุที่ไม่สำเร็จ");
    try {
      setLoading(true);
      await reviewRoom(room.id, 1, `FAILED: ${failReason.trim()}`);
      setFailureModal(false);
      Alert.alert("บันทึกแล้ว", "บันทึกเหตุผลเรียบร้อย");
      await load();
      router.back();
    } catch (e: any) {
      Alert.alert("บันทึกไม่สำเร็จ", e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.headerCard}>
        <Image source={{ uri: room.pokemon_image }} style={styles.cover} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.title}>{room.boss}</Text>
            <View style={[styles.badge, { backgroundColor: statusBg }]}>
              <Text style={styles.badgeText}>{statusText}</Text>
            </View>
          </View>

          <View style={styles.lineRow}>
            <Ionicons name="time-outline" size={16} color="#374151" />
            <Text style={styles.lineText}>{countdownLabel}</Text>
          </View>
          <View style={styles.lineRow}>
            <Ionicons name="people-outline" size={16} color="#374151" />
            <Text style={styles.lineText}>
              สมาชิก {room.current_members}/{room.max_members}
            </Text>
          </View>

          {room.status === "invited" ? (
            <View style={[styles.noteBox, { backgroundColor: "#EFF6FF", borderColor: "#93C5FD", borderWidth: 1 }]}>
              <Text style={[styles.noteText, { color: "#1E3A8A", fontWeight: "700" }]}>
                เชิญในเกมแล้ว — โปรดรีวิวหลังจบการตีบอส
              </Text>
            </View>
          ) : room.note ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{room.note}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Friend code เจ้าของ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>รหัสเพิ่มเพื่อนหัวห้อง</Text>
        <View style={styles.friendRow}>
          <Ionicons name="person-circle-outline" size={18} color="#374151" />
          <View style={{flexDirection: "row"}}>
            <Text style={styles.friendText}>
              {room.owner?.username || "-"} • Friend Code: 
            </Text>
            {isMember ? (
            <Text style={styles.friendText}>
              {room.owner?.friend_code || "-"}
            </Text>
            ) : null}
          </View>
        </View>

        {/* สมาชิก (ไม่ใช่เจ้าของ) -> คัดลอกรหัสหัวห้อง */}
        {isMember && !isOwner ? (
          <TouchableOpacity onPress={copyFriendCode} style={styles.outlineBtn}>
            <Ionicons name="copy-outline" size={16} color="#111827" />
            <Text style={styles.outlineBtnText}>คัดลอกรหัสหัวห้อง</Text>
          </TouchableOpacity>
        ) : null}

        {/* เจ้าของ -> คัดลอกชื่อผู้เล่น */}
        {isOwner && allAdded ? (
          <TouchableOpacity onPress={copyUsernames} style={styles.outlineBtn}>
            <Ionicons name="copy-outline" size={16} color="#111827" />
            <Text style={styles.outlineBtnText}>คัดลอกชื่อผู้เล่น</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* รายชื่อผู้เข้าร่วม */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ผู้เข้าร่วม</Text>
        {members.length ? (
          members.map((m) => {
            const isOwnerRow = m.role === "owner";
            const iAmThisMember = m.user_id === data.you?.user_id;
            const canToggle = (!isOwnerRow && iAmThisMember) || (isOwner && !isOwnerRow);
            const added = friendAdded[m.user_id] || false;

            return (
              <View key={m.user_id} style={styles.memberItem}>
                {m.avatar ? (
                  <Image source={{ uri: m.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarEmpty}>
                    <Text style={{ color: "#fff", fontWeight: "800" }}>
                      {m.username ? m.username.charAt(0).toUpperCase() : "?"}
                    </Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }} numberOfLines={1}>
                    {m.username || `User#${m.user_id}`}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>
                    {isOwnerRow ? "เจ้าของห้อง" : "สมาชิก"} •{" "}
                    {new Date(m.joined_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>

                {/* ปุ่ม “เพิ่มเพื่อนแล้ว” */}
                {!isOwnerRow && canToggle ? (
                  <TouchableOpacity
                    disabled={!iAmThisMember}
                    onPress={() => toggleFriend(m.user_id)}
                    style={[
                      styles.smallBtn,
                      added ? styles.smallBtnDone : styles.smallBtnIdle,
                    ]}
                  >
                    <Ionicons
                      name={added ? "checkmark-circle" : "person-add-outline"}
                      size={16}
                      color={added ? "#fff" : "#111827"}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.smallBtnText, added && { color: "#fff" }]}>
                      เพิ่มเพื่อนแล้ว
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })
        ) : (
          <Text style={{ color: "#9CA3AF" }}>ยังไม่มีสมาชิก</Text>
        )}
      </View>

      {/* ปุ่มการทำงาน */}
      <View style={{ marginTop: 8 }}>
        {isMember ? (
          <TouchableOpacity
            onPress={() => router.push(`/rooms/${room.id}/chat`)}
            style={[styles.primaryBtn, { backgroundColor: "#111827" }]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>เข้าแชท</Text>
          </TouchableOpacity>
        ) : null}

        {/* Owner เชิญในเกม (ต้อง allAdded และยังไม่ invited) */}
        {isOwner && allAdded && room.status !== "invited" ? (
          <TouchableOpacity onPress={onInvite} style={[styles.primaryBtn, { backgroundColor: "#2563EB" }]}>
            <Ionicons name="send-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>เชิญในเกม</Text>
          </TouchableOpacity>
        ) : null}

        {/* หลังเชิญแล้ว → ทุกคนเห็นปุ่ม “ตีบอสเสร็จ กด” เพื่อรีวิว */}
        {room.status === "invited" ? (
          <TouchableOpacity onPress={onBattleFinished} style={[styles.primaryBtn, { backgroundColor: "#10B981" }]}>
            <Ionicons name="flag-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>ตีบอสเสร็จ กด (รีวิว)</Text>
          </TouchableOpacity>
        ) : null}

        {/* เข้าร่วมห้อง/ออกจากห้อง (ซ่อนเมื่อ invited) */}
        {!isOwner && room.status !== "invited" ? (
          <TouchableOpacity
            onPress={onJoinLeave}
            disabled={loading || expired}
            style={[
              styles.primaryBtn,
              { backgroundColor: isMember ? "#EF4444" : "#10B981", opacity: expired ? 0.6 : 1 },
            ]}
          >
            <Ionicons name={isMember ? "log-out-outline" : "log-in-outline"} size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>{isMember ? "ออกจากห้อง" : "เข้าร่วมห้อง"}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Modal: เลือกผลลัพธ์ */}
      <Modal visible={resultModal} transparent animationType="fade" onRequestClose={() => setResultModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>ผลการตีบอส</Text>
            <TouchableOpacity onPress={onResultSuccess} style={[styles.modalBtn, { backgroundColor: "#10B981" }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.modalBtnText}>สำเร็จ (ให้คะแนน)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onResultFail} style={[styles.modalBtn, { backgroundColor: "#EF4444" }]}>
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={styles.modalBtnText}>ไม่สำเร็จ (ใส่เหตุผล)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setResultModal(false)} style={[styles.modalBtn, styles.modalCancel]}>
              <Text style={[styles.modalBtnText, { color: "#111827" }]}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: ให้คะแนน */}
      <Modal visible={ratingModal} transparent animationType="fade" onRequestClose={() => setRatingModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>ให้คะแนนห้องบอส (1-5)</Text>
            <View style={{ flexDirection: "row", justifyContent: "center", marginVertical: 8 }}>
              {[1,2,3,4,5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setRating(n)} style={{ marginHorizontal: 6 }}>
                  <Ionicons name={n <= rating ? "star" : "star-outline"} size={28} color="#F59E0B" />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={onSubmitRating} style={[styles.modalBtn, { backgroundColor: "#111827" }]}>
              <Text style={styles.modalBtnText}>บันทึก</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRatingModal(false)} style={[styles.modalBtn, styles.modalCancel]}>
              <Text style={[styles.modalBtnText, { color: "#111827" }]}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: เหตุผลไม่สำเร็จ */}
      <Modal visible={failureModal} transparent animationType="fade" onRequestClose={() => setFailureModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>เหตุผลที่ไม่สำเร็จ</Text>
            <TextInput
              value={failReason}
              onChangeText={setFailReason}
              placeholder="เช่น คนไม่ครบ / หลุดเน็ต / บอสแข็งมาก ฯลฯ"
              placeholderTextColor="#9CA3AF"
              multiline
              style={styles.textArea}
            />
            <TouchableOpacity onPress={onSubmitFailReason} style={[styles.modalBtn, { backgroundColor: "#111827" }]}>
              <Text style={styles.modalBtnText}>บันทึก</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFailureModal(false)} style={[styles.modalBtn, styles.modalCancel]}>
              <Text style={[styles.modalBtnText, { color: "#111827" }]}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    marginBottom: 12,
  },
  cover: { width: 92, height: 92, borderRadius: 12, marginRight: 12, backgroundColor: "#F3F4F6" },
  title: { flex: 1, fontSize: 20, fontWeight: "800", color: "#111827", marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start" },
  badgeText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  lineRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  lineText: { color: "#374151", fontSize: 14, marginLeft: 6 },

  noteBox: { backgroundColor: "#F3F4F6", padding: 8, borderRadius: 10, marginTop: 8 },
  noteText: { color: "#4B5563", fontSize: 12 },

  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 8 },
  friendRow: { flexDirection: "row", alignItems: "center" },
  friendText: { color: "#374151", marginLeft: 6 },

  outlineBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#111827",
    backgroundColor: "#fff",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  outlineBtnText: { color: "#111827", fontWeight: "800" },

  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 8,
  },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  avatarEmpty: {
    width: 32, height: 32, borderRadius: 16, marginRight: 8,
    backgroundColor: "#9CA3AF", justifyContent: "center", alignItems: "center",
  },

  smallBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  smallBtnIdle: { backgroundColor: "#fff", borderColor: "#111827" },
  smallBtnDone: { backgroundColor: "#10B981", borderColor: "#10B981" },
  smallBtnText: { fontSize: 12, fontWeight: "800", color: "#111827" },

  primaryBtn: {
    marginTop: 10, paddingVertical: 12, borderRadius: 12,
    alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", marginLeft: 8 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center", alignItems: "center", padding: 16,
  },
  modalCard: {
    width: "100%", maxWidth: 420, backgroundColor: "#fff",
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E5E7EB",
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 12, textAlign: "center" },
  modalBtn: {
    marginTop: 8, paddingVertical: 12, borderRadius: 12,
    alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
  },
  modalBtnText: { color: "#fff", fontWeight: "800" },
  modalCancel: { backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB" },

  textArea: {
    minHeight: 90, borderWidth: 1, borderColor: "#E5E7EB",
    borderRadius: 12, padding: 12, color: "#111827", backgroundColor: "#F9FAFB",
  },
});
