// Generates standard PNG icons for GNIOT Lost & Found AI PWA without external binary dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// PNG CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(width, height, isMaskable = false) {
  // Color palette:
  // Deep Aubergine: #30152F -> rgb(48, 21, 47)
  // Marigold Gold: #D9A441 -> rgb(217, 164, 65)
  // Ice Silver: #E8EDF2 -> rgb(232, 237, 242)
  // Accent Glow: #F3C363 -> rgb(243, 195, 99)

  const raw = Buffer.alloc((width * 4 + 1) * height);
  const cx = width / 2;
  const cy = height / 2;
  const radius = width / 2;
  
  // Safe scale for maskable icon: keep inside 80% circle
  const scale = isMaskable ? 0.72 : 0.88;
  const outerR = radius * scale;
  const innerR = outerR * 0.78;
  const ringR = outerR * 0.95;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Base background: Deep Aubergine
      let r = 48, g = 21, b = 47, a = 255;

      // Subtle gradient on background
      const grad = (y / height) * 15;
      r = Math.min(255, r + grad);
      g = Math.min(255, g + grad * 0.5);
      b = Math.min(255, b + grad);

      // Outer golden border ring
      if (Math.abs(dist - ringR) <= width * 0.02) {
        r = 217; g = 164; b = 65; a = 255; // Gold
      } else if (Math.abs(dist - outerR * 0.6) <= width * 0.015) {
        // Radar ring 1
        r = 217; g = 164; b = 65; a = 180;
      } else if (Math.abs(dist - outerR * 0.35) <= width * 0.012) {
        // Radar ring 2
        r = 243; g = 195; b = 99; a = 140;
      }

      // Draw stylized "G" emblem in the center
      const gx = dx / (width * 0.28 * scale);
      const gy = dy / (height * 0.28 * scale);
      const gDist = Math.sqrt(gx * gx + gy * gy);

      // Outer circle of "G" with opening on right
      const isGCircle = gDist >= 0.65 && gDist <= 1.05;
      const angle = Math.atan2(gy, gx); // -PI to PI
      const isRightGap = angle > -0.35 && angle < 0.25;

      // Center crossbar of "G"
      const isBar = gy >= -0.15 && gy <= 0.15 && gx >= 0.0 && gx <= 0.9;
      // Right vertical lip of "G"
      const isLip = gx >= 0.75 && gx <= 1.05 && gy >= 0.0 && gy <= 0.65;

      if ((isGCircle && !isRightGap) || isBar || isLip) {
        // Gold emblem fill
        r = 217; g = 164; b = 65; a = 255;
      }

      // 4-pointed sparkle stars on top right
      const sx = (dx - outerR * 0.65) / (width * 0.08);
      const sy = (dy + outerR * 0.65) / (width * 0.08);
      if (Math.abs(sx) + Math.abs(sy) <= 0.7) {
        r = 243; g = 195; b = 99; a = 240; // Gold Sparkle
      }

      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT
  const compressed = zlib.deflateSync(raw, { level: 9 });

  // IEND
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', iend)
  ]);
}

const publicDir = path.resolve(__dirname, '../public');

console.log('Generating PWA icons in:', publicDir);

const icons = [
  { file: 'pwa-192x192.png', size: 192, maskable: false },
  { file: 'pwa-512x512.png', size: 512, maskable: false },
  { file: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false }
];

icons.forEach(({ file, size, maskable }) => {
  const filePath = path.join(publicDir, file);
  const buf = createPng(size, size, maskable);
  fs.writeFileSync(filePath, buf);
  console.log(`✓ Generated ${file} (${size}x${size}, ${buf.length} bytes)`);
});

console.log('All PWA icons generated successfully.');
