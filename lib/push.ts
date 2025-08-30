// lib/push.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { api } from "./api";


// First, set the handler that will cause the notification
// to show the alert
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function resolveProjectId(): string | undefined {
  // รองรับทั้ง dev build / Expo Go / EAS
  // ลองดึงจากหลายแหล่งเพื่อความชัวร์
  // ใส่ค่า fallback เป็น undefined ถ้าไม่มี
  // แนะนำ: ใส่ projectId ไว้ใน app.json -> extra.eas.projectId
  return (
    // SDK ใหม่ๆ
    (Constants as any).easConfig?.projectId ||
    // ผ่าน app.json -> extra.eas.projectId
    (Constants.expoConfig as any)?.extra?.eas?.projectId ||
    // manifest รูปแบบเก่า (เผื่อไว้)
    (Constants as any).manifest2?.extra?.eas?.projectId ||
    (Constants as any).manifest?.extra?.eas?.projectId
  );
}

export async function registerPushToken() {
  // ต้องเป็นเครื่องจริงเท่านั้น (Simulator จะได้ null)
  if (!Constants.isDevice) return null;

  // ขอสิทธิ์
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  // สำคัญ: ต้องส่ง projectId ให้ getExpoPushTokenAsync
  const projectId = resolveProjectId();
  const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );

  // บันทึก token ไปยัง backend ผูกกับผู้ใช้ที่ล็อกอินอยู่ (ต้องมี Authorization header)
  try {
    await api.post(
      "/api/auth/update_device_token.php",
      { device_token: expoPushToken },
      { validateStatus: () => true }
    );
  } catch (e) {
    // เงียบไว้ก็ได้ แต่ระหว่าง dev แนะนำ console.log
    // console.log("update_device_token error", e);
  }

  // Android: ตั้ง Notification Channel (จำเป็นบน Android 8+)
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return expoPushToken;
}
