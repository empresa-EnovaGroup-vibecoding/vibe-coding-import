import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../public");

async function generateIcon(inputSvg, outputPng, size) {
  const svgBuffer = readFileSync(resolve(publicDir, inputSvg));
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(resolve(publicDir, outputPng));
  console.log(`Generated ${outputPng} (${size}x${size})`);
}

async function main() {
  await generateIcon("icon-192.svg", "icon-192.png", 192);
  await generateIcon("icon-512.svg", "icon-512.png", 512);
  await generateIcon("icon-maskable.svg", "icon-maskable.png", 512);
  // Apple touch icon (180x180 is standard)
  await generateIcon("icon-512.svg", "apple-touch-icon.png", 180);
  console.log("All icons generated!");
}

main().catch(console.error);
