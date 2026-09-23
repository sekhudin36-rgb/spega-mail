import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawFn) {
  // RGBA buffer
  const stride = width * 4;
  const rawData = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // filter byte: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // CRC32 calculation table
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcVal = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crcVal, 8 + len);
    return buf;
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // no interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw nice icon
// Indigo/Sky gradient with mail envelope & quill/shield shape
function drawAppIcon(isMaskable) {
  return (x, y, w, h) => {
    const nx = x / w;
    const ny = y / h;
    const cx = 0.5;
    const cy = 0.5;
    const dx = nx - cx;
    const dy = ny - cy;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);

    // Rounded rectangle / squircle background
    const cornerR = isMaskable ? 0 : 0.22;
    // Check if within rounded rect
    let insideBg = true;
    if (!isMaskable) {
      const qx = Math.max(0, Math.abs(nx - 0.5) - (0.5 - cornerR));
      const qy = Math.max(0, Math.abs(ny - 0.5) - (0.5 - cornerR));
      if (Math.sqrt(qx * qx + qy * qy) > cornerR) {
        insideBg = false;
      }
    }

    if (!insideBg) {
      return [0, 0, 0, 0];
    }

    // Gradient background: deep slate to royal indigo/sky
    // #0F172A to #1E1B4B to #0284C7
    const bgR = Math.round(15 + 25 * ny + 10 * nx);
    const bgG = Math.round(23 + 40 * ny + 30 * nx);
    const bgB = Math.round(42 + 90 * ny + 80 * nx);

    // Inner icon graphics: safe zone within 0.2 to 0.8
    const scale = isMaskable ? 0.65 : 0.78;
    const sx = (nx - 0.5) / scale + 0.5;
    const sy = (ny - 0.5) / scale + 0.5;

    // Mail envelope box: bounds [0.22, 0.32] to [0.78, 0.72]
    const envLeft = 0.22;
    const envRight = 0.78;
    const envTop = 0.30;
    const envBottom = 0.70;

    let isEnvelope = false;
    let isFlap = false;
    let isAccent = false;

    // Check border of envelope
    const bw = 0.024;
    if (sx >= envLeft && sx <= envRight && sy >= envTop && sy <= envBottom) {
      // Outer border of envelope
      if (
        sx <= envLeft + bw ||
        sx >= envRight - bw ||
        sy <= envTop + bw ||
        sy >= envBottom - bw
      ) {
        isEnvelope = true;
      }

      // Envelope flap lines: from (envLeft, envTop) to (0.5, 0.52) and from (envRight, envTop) to (0.5, 0.52)
      const slope = (0.52 - envTop) / (0.5 - envLeft);
      const expectedYLeft = envTop + (sx - envLeft) * slope;
      const expectedYRight = envTop + (envRight - sx) * slope;

      if (sx <= 0.5 && Math.abs(sy - expectedYLeft) < bw * 0.7 && sy >= envTop && sy <= 0.52) {
        isFlap = true;
      }
      if (sx > 0.5 && Math.abs(sy - expectedYRight) < bw * 0.7 && sy >= envTop && sy <= 0.52) {
        isFlap = true;
      }

      // Bottom folds: from (envLeft, envBottom) to (0.42, 0.48) and (envRight, envBottom) to (0.58, 0.48)
      const bSlope = (envBottom - 0.50) / (0.5 - envLeft);
      const bYLeft = envBottom - (sx - envLeft) * bSlope;
      const bYRight = envBottom - (envRight - sx) * bSlope;
      if (sx <= 0.42 && Math.abs(sy - bYLeft) < bw * 0.55 && sy >= 0.50) {
        isFlap = true;
      }
      if (sx >= 0.58 && Math.abs(sy - bYRight) < bw * 0.55 && sy >= 0.50) {
        isFlap = true;
      }
    }

    // Top official stamp / star emblem above envelope [0.44 to 0.56, 0.16 to 0.28]
    const edx = sx - 0.5;
    const edy = sy - 0.22;
    if (edx * edx + edy * edy < 0.045 * 0.045) {
      isAccent = true;
    }

    if (isAccent) {
      return [251, 191, 36, 255]; // Amber 400
    }

    if (isFlap) {
      return [56, 189, 248, 255]; // Sky 400
    }

    if (isEnvelope) {
      return [129, 140, 248, 255]; // Indigo 400
    }

    // Slight subtle glow inside envelope
    if (sx > envLeft && sx < envRight && sy > envTop && sy < envBottom) {
      return [bgR + 18, bgG + 22, bgB + 35, 255];
    }

    return [bgR, bgG, bgB, 255];
  };
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating 192x192 PNG...');
const png192 = createPng(192, 192, drawAppIcon(false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

console.log('Generating 512x512 PNG...');
const png512 = createPng(512, 512, drawAppIcon(false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

console.log('Generating maskable 512x512 PNG...');
const pngMaskable = createPng(512, 512, drawAppIcon(true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);

console.log('Generating apple-touch-icon.png (180x180)...');
const appleIcon = createPng(180, 180, drawAppIcon(false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

console.log('All PWA icons generated successfully.');
