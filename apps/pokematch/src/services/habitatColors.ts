import type { Habitat } from "../types/types";

export const habitatColors: Record<
  Habitat,
  { bg: string; text: string; border: string }
> = {
  Bright: { bg: "#fffde7", text: "#f57f17", border: "#f9a825" },
  Cool: { bg: "#e3f2fd", text: "#0277bd", border: "#0288d1" },
  Dark: { bg: "#ede7f6", text: "#4527a0", border: "#5e35b1" },
  Dry: { bg: "#fbe9e7", text: "#bf360c", border: "#e64a19" },
  Humid: { bg: "#e8f5e9", text: "#1b5e20", border: "#388e3c" },
  Warm: { bg: "#fff3e0", text: "#e65100", border: "#f57c00" },
};

export const habitatEmoji: Record<Habitat, string> = {
  Bright: "☀️",
  Cool: "❄️",
  Dark: "🌑",
  Dry: "🏜️",
  Humid: "🌿",
  Warm: "🔥",
};
