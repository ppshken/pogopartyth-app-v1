import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

type User = { id:number; email:string; username:string; avatar?:string|null };
type AuthState = {
  user: User|null;
  token: string|null;
  setAuth: (u:User, t:string)=>Promise<void>;
  clear: ()=>Promise<void>;
};

export const useAuth = create<AuthState>((set)=>({
  user: null,
  token: null,
  setAuth: async (user, token) => {
    await AsyncStorage.setItem("token", token);
    set({ user, token });
  },
  clear: async () => {
    await AsyncStorage.removeItem("token");
    set({ user: null, token: null });
  }
}));
