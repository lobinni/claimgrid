#!/usr/bin/env node
/**
 * ClaimGrid icon builder.
 *
 * The text-based SVG master is the source of truth. It is intentionally kept
 * inside the repository so every icon artifact can be rebuilt from a clean
 * checkout with one command.
 *
 * Generated artifacts:
 *   apps/web/public/favicon.ico       48/32/16 multi-size favicon
 *   apps/web/public/favicon.png       48×48 PNG favicon
 *   apps/web/public/icons/icon-512.png
 *   apps/web/public/icons/icon-192.png
 *   apps/web/public/icons/maskable-512.png
 *   apps/web/public/icons/favicon-48.png
 *   apps/web/public/icons/favicon-32.png
 *   apps/web/public/icons/favicon-16.png
 *   apps/web/public/site.webmanifest  PWA manifest
 *
 * Usage:
 *   npm run generate:icon
 */

import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const WEB_PUBLIC = path.join(ROOT, "apps/web/public");
const BRAND_DIR = path.join(WEB_PUBLIC, "brand");
const ICONS_DIR = path.join(WEB_PUBLIC, "icons");
const MASTER_SVG = path.join(BRAND_DIR, "icon-master.svg");
const MASTER_PNG = path.join(BRAND_DIR, "icon-master.png");

const INK = "#171713";
const MINT = "#d9e9ce";

let MASTER = null;

async function pickMaster() {
  for (const candidate of [MASTER_SVG, MASTER_PNG]) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next source.
    }
  }

  throw new Error(
    "No master artwork found at apps/web/public/brand/icon-master.svg (or .png)",
  );
}

/** Render the master at size px, RGBA, on the brand ink square. */
async function render(size) {
  return sharp(MASTER, { density: 512 })
    .resize(size, size, {
      fit: "contain",
      background: INK,
      kernel: "lanczos3",
    })
    .ensureAlpha()
    .png()
    .toBuffer();
}

/** Build a classic multi-size ICO with PNG payloads. */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type
  header.writeUInt16LE(entries.length, 4);

  const directories = [];
  let offset = 6 + entries.length * 16;

  for (const { size, data } of entries) {
    const directory = Buffer.alloc(16);
    directory.writeUInt8(size >= 256 ? 0 : size, 0);
    directory.writeUInt8(size >= 256 ? 0 : size, 1);
    directory.writeUInt8(0, 2); // palette
    directory.writeUInt8(0, 3); // reserved
    directory.writeUInt16LE(1, 4); // planes
    directory.writeUInt16LE(32, 6); // bits per pixel
    directory.writeUInt32LE(data.length, 8);
    directory.writeUInt32LE(offset, 12);
    directories.push(directory);
    offset += data.length;
  }

  return Buffer.concat([
    header,
    ...directories,
    ...entries.map((entry) => entry.data),
  ]);
}

async function main() {
  MASTER = await pickMaster();
  console.log(`master: ${path.relative(ROOT, MASTER)}`);

  await mkdir(BRAND_DIR, { recursive: true });
  await mkdir(ICONS_DIR, { recursive: true });

  const targets = [
    { file: path.join(WEB_PUBLIC, "favicon.png"), size: 48 },
    { file: path.join(WEB_PUBLIC, "apple-icon.png"), size: 180 },
    { file: path.join(ICONS_DIR, "icon-512.png"), size: 512 },
    { file: path.join(ICONS_DIR, "icon-192.png"), size: 192 },
    { file: path.join(ICONS_DIR, "favicon-48.png"), size: 48 },
    { file: path.join(ICONS_DIR, "favicon-32.png"), size: 32 },
    { file: path.join(ICONS_DIR, "favicon-16.png"), size: 16 },
  ];

  for (const { file, size } of targets) {
    await writeFile(file, await render(size));
    console.log(`wrote ${path.relative(ROOT, file)} (${size}×${size})`);
  }

  const maskableSize = 512;
  const inner = Math.round(maskableSize * 0.8);
  const maskable = await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: INK,
    },
  })
    .composite([{ input: await render(inner) }])
    .png()
    .toBuffer();

  await writeFile(path.join(ICONS_DIR, "maskable-512.png"), maskable);
  console.log("wrote apps/web/public/icons/maskable-512.png (512×512, 80% safe zone)");

  const ico = buildIco([
    { size: 48, data: await render(48) },
    { size: 32, data: await render(32) },
    { size: 16, data: await render(16) },
  ]);

  await writeFile(path.join(WEB_PUBLIC, "favicon.ico"), ico);
  console.log("wrote apps/web/public/favicon.ico (48+32+16)");

  const manifest = {
    name: "ClaimGrid",
    short_name: "ClaimGrid",
    description: "On-chain coverage with validator-backed decisions.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: INK,
    theme_color: MINT,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };

  await writeFile(
    path.join(WEB_PUBLIC, "site.webmanifest"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log("wrote apps/web/public/site.webmanifest");

  console.log("\nIcon set complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
