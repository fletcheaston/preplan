// Generates SVG icons and writes them to public/icons/
// Run with: node scripts/generate-icons.mjs
import { mkdirSync, writeFileSync } from "fs";

mkdirSync("public/icons", { recursive: true });

function makeSvg(size, masked = false) {
  const bg = masked ? "#173a40" : "#173a40";
  const padding = masked ? size * 0.15 : size * 0.1;
  const inner = size - padding * 2;

  // Simple "P" letter mark on dark teal background
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${masked ? 0 : size * 0.2}" fill="#173a40"/>
  <text x="50%" y="54%" font-family="Georgia, serif" font-size="${inner * 0.65}" font-weight="bold" fill="#d7ece8" text-anchor="middle" dominant-baseline="middle">P</text>
</svg>`;
}

writeFileSync("public/icons/icon-192.svg", makeSvg(192));
writeFileSync("public/icons/icon-512.svg", makeSvg(512));
writeFileSync("public/icons/icon-maskable-512.svg", makeSvg(512, true));
console.log("Icons written to public/icons/");
