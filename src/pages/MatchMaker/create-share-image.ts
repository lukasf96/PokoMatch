import { getPokemonSpriteUrl } from "../../services/pokemon-sprites";
import type { Habitat, Pokemon } from "../../types/types";

const HABITAT_COLORS: Record<Habitat, { background: string; accent: string }> = {
  Bright: { background: "#fff6cc", accent: "#e6a700" },
  Cool: { background: "#d9f5f6", accent: "#078b9c" },
  Dark: { background: "#f0ddf4", accent: "#7b3992" },
  Dry: { background: "#fde3d6", accent: "#d85c2b" },
  Humid: { background: "#dcefff", accent: "#2689d7" },
  Warm: { background: "#ffe7ca", accent: "#d97019" },
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

/** Creates a native share card without sending group data to any server. */
export async function createGroupShareImage(
  group: Pokemon[],
  habitat: Habitat,
  shareUrl: string,
): Promise<Blob> {
  const width = 1200;
  const height = 630;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser cannot create a share image.");

  const palette = HABITAT_COLORS[habitat];
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fffbf4");
  gradient.addColorStop(1, palette.background);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = `${palette.accent}20`;
  ctx.beginPath();
  ctx.arc(1080, -20, 280, 0, Math.PI * 2);
  ctx.arc(80, 670, 260, 0, Math.PI * 2);
  ctx.fill();

  const logo = await loadImage("/logo/logo.png");
  if (logo) {
    const logoHeight = 58;
    ctx.drawImage(logo, 68, 30, (logo.width / logo.height) * logoHeight, logoHeight);
  } else {
    ctx.fillStyle = "#25221d";
    ctx.font = "800 40px system-ui, sans-serif";
    ctx.fillText("PokoMatch", 68, 78);
  }
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillStyle = "#5e594f";
  ctx.fillText("Pokopia habitat group", 69, 112);

  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.roundRect(68, 148, 1064, 48, 24);
  ctx.fill();
  ctx.font = "800 22px system-ui, sans-serif";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(`${habitat} habitat · ready to build together`, 600, 180);
  ctx.textAlign = "left";

  const gap = 20;
  const cardWidth = (1064 - gap * (group.length - 1)) / group.length;
  const images = await Promise.all(group.map((pokemon) => loadImage(getPokemonSpriteUrl(pokemon.id) ?? "")));
  group.forEach((pokemon, index) => {
    const x = 68 + index * (cardWidth + gap);
    const y = 220;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.roundRect(x, y, cardWidth, 250, 22);
    ctx.fill();
    ctx.strokeStyle = `${palette.accent}66`;
    ctx.lineWidth = 3;
    ctx.stroke();
    const image = images[index];
    if (image) ctx.drawImage(image, x + cardWidth / 2 - 64, y + 22, 128, 128);
    ctx.fillStyle = "#25221d";
    ctx.font = "800 25px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(pokemon.name, x + cardWidth / 2, y + 182);
    ctx.font = "600 17px system-ui, sans-serif";
    ctx.fillStyle = palette.accent;
    ctx.fillText(`${pokemon.idealHabitat} habitat`, x + cardWidth / 2, y + 215);
    ctx.textAlign = "left";
  });

  ctx.fillStyle = "#25221d";
  ctx.font = "800 25px system-ui, sans-serif";
  ctx.fillText("Open, remix, and plan your own group", 68, 540);
  ctx.font = "600 20px system-ui, sans-serif";
  ctx.fillStyle = "#5e594f";
  ctx.fillText(shareUrl.replace(/^https?:\/\//, ""), 68, 578);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not create the share image."))),
      "image/png",
    ),
  );
}

export function downloadGroupShareImage(blob: Blob, filename = "pokomatch-group.png"): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
