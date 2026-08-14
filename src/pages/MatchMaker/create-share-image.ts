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
): Promise<Blob> {
  const width = 2400;
  const height = 1260;
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
  ctx.arc(2160, -40, 560, 0, Math.PI * 2);
  ctx.arc(160, 1340, 520, 0, Math.PI * 2);
  ctx.fill();

  const logo = await loadImage("/logo/logo.png");
  if (logo) {
    const logoHeight = 88;
    ctx.drawImage(logo, 100, 68, (logo.width / logo.height) * logoHeight, logoHeight);
  } else {
    ctx.fillStyle = "#25221d";
    ctx.font = "800 60px system-ui, sans-serif";
    ctx.fillText("PokoMatch", 100, 135);
  }

  const cardX = 100;
  const cardY = 220;
  const cardWidth = 2200;
  const headerHeight = 112;
  const cardHeight = 760;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 32);
  ctx.fill();
  ctx.strokeStyle = `${palette.accent}99`;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = palette.background;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardWidth, headerHeight, [32, 32, 0, 0]);
  ctx.fill();
  ctx.fillStyle = "#25221d";
  ctx.font = "800 34px system-ui, sans-serif";
  ctx.fillText("Group 1", cardX + 42, cardY + 68);
  ctx.font = "700 25px system-ui, sans-serif";
  ctx.fillStyle = palette.accent;
  ctx.fillText(`${habitat} habitat`, cardX + 210, cardY + 67);

  const gap = 20;
  const memberWidth = (cardWidth - gap * (group.length - 1)) / group.length;
  const memberY = cardY + headerHeight;
  const memberHeight = cardHeight - headerHeight;
  const images = await Promise.all(group.map((pokemon) => loadImage(getPokemonSpriteUrl(pokemon.id) ?? "")));
  group.forEach((pokemon, index) => {
    const x = cardX + index * (memberWidth + gap);
    const image = images[index];
    if (image) ctx.drawImage(image, x + memberWidth / 2 - 130, memberY + 82, 260, 260);
    ctx.fillStyle = "#25221d";
    ctx.font = "800 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(pokemon.name, x + memberWidth / 2, memberY + 405);
    ctx.font = "700 23px system-ui, sans-serif";
    ctx.fillStyle = palette.accent;
    ctx.fillText(pokemon.specialties.join(" · "), x + memberWidth / 2, memberY + 452);
    ctx.font = "600 21px system-ui, sans-serif";
    ctx.fillStyle = "#5e594f";
    ctx.fillText(pokemon.idealHabitat, x + memberWidth / 2, memberY + 500);
    ctx.textAlign = "left";
    if (index < group.length - 1) {
      ctx.strokeStyle = "#e6e1d8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + memberWidth + gap / 2, memberY + 40);
      ctx.lineTo(x + memberWidth + gap / 2, memberY + memberHeight - 40);
      ctx.stroke();
    }
  });

  ctx.fillStyle = "#25221d";
  ctx.font = "700 30px system-ui, sans-serif";
  ctx.fillText("Habitat planned with PokoMatch.com", 100, 1110);
  ctx.font = "500 23px system-ui, sans-serif";
  ctx.fillStyle = "#5e594f";
  ctx.fillText("A free Pokopia habitat planner", 100, 1150);

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
