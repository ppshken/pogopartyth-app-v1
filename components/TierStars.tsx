// components/TierStars.tsx
import React from "react";
import { Text } from "react-native";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function tierToStars(tier: string | number | null | undefined, fallback = 5) {
  if (typeof tier === "number") return clamp(tier, 1, 6);
  const key = String(tier ?? "")
    .toLowerCase()
    .replace(/\s|-/g, ""); // "Tier 5" -> "tier5", "Mega Legendary" -> "megalegendary"

  const MAP: Record<string, number> = {
    "1": 1, "t1": 1, "tier1": 1,
    "2": 2, "t2": 2, "tier2": 2,
    "3": 3, "t3": 3, "tier3": 3,
    "4": 4, "t4": 4, "tier4": 4,
    "5": 5, "t5": 5, "tier5": 5,
    // คีย์ยอดนิยม
    legendary: 5,
    mega: 5,
    megalegendary: 6,
    primal: 6,
    shadow: 6,
    elite: 6,
  };

  return clamp(MAP[key] ?? fallback, 1, 6);
}

export function TierStars({
  pokemon_tier,
  color = "#F59E0B",
  size = 14,
  max = 6,
}: {
  pokemon_tier: string | number;
  color?: string;
  size?: number;
  max?: number;
}) {
  const count = Math.min(tierToStars(pokemon_tier), max);
  return (
    <Text
      style={{
        color,
        fontSize: size,
        fontWeight: "800",
        letterSpacing: 1,
        includeFontPadding: false,
      }}
    >
      {"★".repeat(count)}
    </Text>
  );
}
