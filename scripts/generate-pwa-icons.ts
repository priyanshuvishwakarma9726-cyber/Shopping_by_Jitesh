import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

/**
 * Generate Minimalist PNG files with solid brand background (#0F172A) & Gold brand accents
 */
function createPurePng(size: number, isMaskable = false): Buffer {
  // We construct an uncompressed PNG with IHDR, IDAT, IEND chunks
  const width = size;
  const height = size;

  // Obsidian Slate #0F172A -> R:15, G:23, B:42
  const bgR = 15;
  const bgG = 23;
  const bgB = 42;

  // Warm Gold #D97706 -> R:217, G:119, B:6
  const goldR = 217;
  const goldG = 119;
  const goldB = 6;

  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const borderMargin = isMaskable ? Math.floor(size * 0.15) : 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      // Draw centered gold box or logo shape
      const isInGoldArea =
        x >= borderMargin + Math.floor(width * 0.3) &&
        x <= width - borderMargin - Math.floor(width * 0.3) &&
        y >= borderMargin + Math.floor(height * 0.3) &&
        y <= height - borderMargin - Math.floor(height * 0.3);

      if (isInGoldArea) {
        rawData[offset++] = goldR;
        rawData[offset++] = goldG;
        rawData[offset++] = goldB;
        rawData[offset++] = 255;
      } else {
        rawData[offset++] = bgR;
        rawData[offset++] = bgG;
        rawData[offset++] = bgB;
        rawData[offset++] = 255;
      }
    }
  }

  // Zlib deflate raw data
  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT Chunk
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type: string, data: Buffer): Buffer {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);

  const crc32 = calculateCrc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc32, 8 + len);
  return buf;
}

function calculateCrc32(buf: Buffer): number {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    for (let j = 0; j < 8; j++) {
      if ((crc ^ byte) & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ -1) >>> 0;
}

const publicDir = path.resolve(process.cwd(), 'public');

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createPurePng(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createPurePng(512));
fs.writeFileSync(path.join(publicDir, 'apple-icon.png'), createPurePng(180));
fs.writeFileSync(path.join(publicDir, 'icon-512-maskable.png'), createPurePng(512, true));

console.log('PWA Brand PNG Icons generated successfully in public/');
