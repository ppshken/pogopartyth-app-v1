import { api } from "./api";

export async function login(payload: { email?: string; username?: string; password: string; }) {
  const { data } = await api.post("/api/auth/login.php", payload);
  if (!data.success) throw new Error(data.message || "Login failed");
  return data.data as { user: any; token: string };
}

export async function register(payload: { email: string; username: string; password: string; avatar?: string; friend_code?: string; }) {
  const { data } = await api.post("/api/auth/register.php", payload);
  if (!data.success) throw new Error(data.message || "Register failed");
  return data.data as { user: any; token: string };
}

export async function profile() {
  const { data } = await api.get("/api/auth/profile.php");
  if (!data.success) throw new Error(data.message || "Profile failed");
  return data.data.user;
}
