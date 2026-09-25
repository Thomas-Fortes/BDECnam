// Génère des icônes PWA basiques (carré violet + "W" blanc stylisé) en PNG,
// sans dépendance externe (zlib natif). À remplacer par le vrai logo du BDE.
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "icons");

const PRIMARY = [0x6d, 0x28, 0xd9]; // #6D28D9

function crc32(buf) {
  let c;
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Dessine un carré arrondi violet avec un simple pictogramme "fête" (confettis)
// approximé par quelques pixels blancs — volontairement minimaliste.
function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const radius = Math.round(size * 0.18);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      // coins arrondis : hors-rayon dans les coins => transparent
      const cornerDist = (cx, cy) => Math.hypot(x - cx, y - cy);
      let inside = true;
      if (x < radius && y < radius) inside = cornerDist(radius, radius) <= radius;
      else if (x >= size - radius && y < radius) inside = cornerDist(size - radius, radius) <= radius;
      else if (x < radius && y >= size - radius) inside = cornerDist(radius, size - radius) <= radius;
      else if (x >= size - radius && y >= size - radius) inside = cornerDist(size - radius, size - radius) <= radius;

      if (!inside) {
        pixels[i + 3] = 0;
        continue;
      }

      pixels[i] = PRIMARY[0];
      pixels[i + 1] = PRIMARY[1];
      pixels[i + 2] = PRIMARY[2];
      pixels[i + 3] = 255;
    }
  }

  // Pictogramme simple : un rond blanc central (façon "soleil/fête")
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.22;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (Math.hypot(x - cx, y - cy) <= r) {
        const i = (y * size + x) * 4;
        pixels[i] = 255;
        pixels[i + 1] = 255;
        pixels[i + 2] = 255;
        pixels[i + 3] = 255;
      }
    }
  }

  // quelques "confettis" (petits carrés blancs) autour
  const confettis = [
    [0.2, 0.25], [0.78, 0.22], [0.25, 0.78], [0.8, 0.75], [0.5, 0.12],
  ];
  const dot = Math.max(2, Math.round(size * 0.035));
  for (const [fx, fy] of confettis) {
    const px = Math.round(size * fx);
    const py = Math.round(size * fy);
    for (let dy = -dot; dy <= dot; dy++) {
      for (let dx = -dot; dx <= dot; dx++) {
        const x = px + dx;
        const y = py + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        if (dx * dx + dy * dy > dot * dot) continue;
        const i = (y * size + x) * 4;
        pixels[i] = 255;
        pixels[i + 1] = 255;
        pixels[i + 2] = 255;
        pixels[i + 3] = 220;
      }
    }
  }

  return pixels;
}

function encodePng(size) {
  const pixels = drawIcon(size);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter type: none
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const idat = deflateSync(raw);

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512, 180]) {
  const png = encodePng(size);
  const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  writeFileSync(join(size === 180 ? join(__dirname, "..", "public") : OUT_DIR, name), png);
  console.log(`Généré ${name} (${size}x${size}, ${png.length} octets)`);
}
