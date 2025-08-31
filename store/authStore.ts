import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../lib/api";

type User = { id: number; email: string; username: string; avatar?: string | null };
type AuthState = {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => Promise<void>;
  clear: () => Promise<void>;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: async (user, token) => {
        set({ user, token });
        // ตั้ง header เผื่อจุดที่ยังไม่มี interceptor
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));
      },
      clear: async () => {
        set({ user: null, token: null });
        delete api.defaults.headers.common.Authorization;
        await AsyncStorage.multiRemove(["token", "user"]);
      },
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => AsyncStorage),
      // เมื่อ rehydrate เสร็จ ให้เซ็ต header อีกรอบ
      onRehydrateStorage: () => (state) => {
        setTimeout(() => {
          const token = state?.token;
          if (token) {
            api.defaults.headers.common.Authorization = `Bearer ${token}`;
          }
        }, 0);
      },
    }
  )
);
