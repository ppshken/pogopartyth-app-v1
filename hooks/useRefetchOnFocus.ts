// hooks/useRefetchOnFocus.ts
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

export function useRefetchOnFocus(fn: () => void, deps: any[] = []) {
  useFocusEffect(
    useCallback(() => {
      fn();            // เรียกตอนหน้า “ได้โฟกัส”
      return undefined; // ถ้าอยากยกเลิก/cleanup ให้ return ฟังก์ชันได้
    }, deps)
  );
}
