// Generates SVG icons and writes them to public/icons/
// Run with: node scripts/generate-icons.mjs
import { mkdirSync, writeFileSync } from "fs";

mkdirSync("public/icons", { recursive: true });

// Ink & Paper palette
const CREAM = "#F5F0E8";
const INK = "#2C2C2C";
const TERRACOTTA = "#C4705A";

function makeSvg(size, masked = false) {
  // Maskable icons need extra padding (safe zone is ~80% of the icon)
  const bgRadius = masked ? 0 : size * 0.2;

  // P sizing
  const pFontSize = size * (masked ? 0.54 : 0.68);
  const pY = size * (masked ? 0.56 : 0.56);

  // Terracotta underline (matches nav-link active style)
  const underlineWidth = size * (masked ? 0.32 : 0.4);
  const underlineHeight = Math.max(2, size * 0.022);
  const underlineX = (size - underlineWidth) / 2;
  const underlineY = size * (masked ? 0.74 : 0.76);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${bgRadius}" fill="${CREAM}"/>
  <text x="50%" y="${pY}" font-family="Georgia, 'Times New Roman', serif" font-size="${pFontSize}" font-weight="700" fill="${INK}" text-anchor="middle" dominant-baseline="middle">P</text>
  <rect x="${underlineX}" y="${underlineY}" width="${underlineWidth}" height="${underlineHeight}" rx="${underlineHeight / 2}" fill="${TERRACOTTA}"/>
</svg>`;
}

writeFileSync("public/icons/icon-192.svg", makeSvg(192));
writeFileSync("public/icons/icon-512.svg", makeSvg(512));
writeFileSync("public/icons/icon-maskable-512.svg", makeSvg(512, true));
writeFileSync("public/favicon.svg", makeSvg(32));

console.log("Icons written to public/icons/ and public/favicon.svg");
