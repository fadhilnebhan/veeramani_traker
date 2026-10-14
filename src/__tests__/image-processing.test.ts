import { describe, it, expect } from 'vitest';
import {
  validateImageBuffer,
  stripExifFromJpeg,
  stripMetadataFromPng,
  MAX_UPLOAD_SIZE,
} from '@/lib/image-processing';

describe('Image Processing & EXIF Security Validation', () => {
  // Helper to create valid JPEG buffer with optional APP1 EXIF segment
  function createMockJpegBuffer(includeExif = false): Buffer {
    const soi = Buffer.from([0xff, 0xd8]);
    const jfifHeader = Buffer.from([0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]);
    let exifSegment = Buffer.alloc(0);

    if (includeExif) {
      // APP1 marker 0xFF 0xE1 with 16-byte dummy EXIF GPS content
      const exifData = Buffer.from('Exif\0\0GPS_LAT_13_LNG_80');
      const len = exifData.length + 2;
      const lenBuf = Buffer.alloc(2);
      lenBuf.writeUInt16BE(len, 0);
      exifSegment = Buffer.concat([Buffer.from([0xff, 0xe1]), lenBuf, exifData]);
    }

    const sos = Buffer.from([0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00]);
    const imageData = Buffer.from([0x12, 0x34, 0x56, 0x78]);
    const eoi = Buffer.from([0xff, 0xd9]);

    return Buffer.concat([soi, jfifHeader, exifSegment, sos, imageData, eoi]);
  }

  // Helper to create valid PNG buffer with optional metadata chunk
  function createMockPngBuffer(includeExif = false): Buffer {
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    // Minimal IHDR chunk: 13 bytes data + 4 type + 4 len + 4 crc
    const ihdr = Buffer.from([
      0x00, 0x00, 0x00, 0x0d, // len
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00,
      0x90, 0x77, 0x53, 0xde, // CRC
    ]);

    let metaChunk = Buffer.alloc(0);
    if (includeExif) {
      // tEXt chunk
      const textData = Buffer.from('Comment\0SecretGPSCoordinates');
      const lenBuf = Buffer.alloc(4);
      lenBuf.writeUInt32BE(textData.length, 0);
      const typeBuf = Buffer.from('tEXt');
      const crcBuf = Buffer.alloc(4); // dummy crc
      metaChunk = Buffer.concat([lenBuf, typeBuf, textData, crcBuf]);
    }

    // IEND chunk
    const iend = Buffer.from([
      0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4e, 0x44,
      0xae, 0x42, 0x60, 0x82,
    ]);

    return Buffer.concat([sig, ihdr, metaChunk, iend]);
  }

  // Helper to create valid WebP buffer
  function createMockWebpBuffer(): Buffer {
    const riff = Buffer.from('RIFF');
    const size = Buffer.alloc(4);
    size.writeUInt32LE(20, 0);
    const webp = Buffer.from('WEBP');
    const vp8 = Buffer.from('VP8 ');
    const vp8Size = Buffer.alloc(4);
    vp8Size.writeUInt32LE(8, 0);
    const dummyData = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);

    return Buffer.concat([riff, size, webp, vp8, vp8Size, dummyData]);
  }

  it('validates a genuine JPEG buffer with correct magic bytes', () => {
    const jpeg = createMockJpegBuffer();
    const result = validateImageBuffer(jpeg, 'poster.jpg', 'image/jpeg');
    expect(result.isValid).toBe(true);
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.sanitizedBuffer).toBeDefined();
  });

  it('validates a genuine PNG buffer with correct magic bytes', () => {
    const png = createMockPngBuffer();
    const result = validateImageBuffer(png, 'screenshot.png', 'image/png');
    expect(result.isValid).toBe(true);
    expect(result.mimeType).toBe('image/png');
    expect(result.sanitizedBuffer).toBeDefined();
  });

  it('validates a genuine WebP buffer with correct magic bytes', () => {
    const webp = createMockWebpBuffer();
    const result = validateImageBuffer(webp, 'illustration.webp', 'image/webp');
    expect(result.isValid).toBe(true);
    expect(result.mimeType).toBe('image/webp');
  });

  it('rejects files larger than the 5 MB limit', () => {
    const largeBuffer = Buffer.alloc(MAX_UPLOAD_SIZE + 1024);
    // Add JPEG magic bytes to oversized buffer
    largeBuffer[0] = 0xff;
    largeBuffer[1] = 0xd8;
    largeBuffer[2] = 0xff;

    const result = validateImageBuffer(largeBuffer, 'large_photo.jpg');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('exceeds maximum allowed size of 5 MB');
  });

  it('rejects buffers smaller than minimum signature length', () => {
    const tinyBuffer = Buffer.from([0xff, 0xd8]);
    const result = validateImageBuffer(tinyBuffer, 'tiny.jpg');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('too small');
  });

  it('rejects files with forged extensions but invalid magic bytes', () => {
    const fakeJpeg = Buffer.from('<html><body>Not an image</body></html>');
    const result = validateImageBuffer(fakeJpeg, 'malicious.jpg', 'image/jpeg');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('File content does not match genuine JPEG, PNG, or WebP');
  });

  it('rejects unsupported file extensions', () => {
    const validJpeg = createMockJpegBuffer();
    const result = validateImageBuffer(validJpeg, 'script.exe');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Unsupported file extension');
  });

  it('strips APP1 EXIF segment containing GPS tags from JPEG buffers', () => {
    const jpegWithExif = createMockJpegBuffer(true);
    expect(jpegWithExif.includes(Buffer.from('Exif'))).toBe(true);
    expect(jpegWithExif.includes(Buffer.from('GPS_LAT_13_LNG_80'))).toBe(true);

    const stripped = stripExifFromJpeg(jpegWithExif);
    // GPS and EXIF string should be completely purged from the stripped buffer!
    expect(stripped.includes(Buffer.from('GPS_LAT_13_LNG_80'))).toBe(false);
    expect(stripped.includes(Buffer.from('Exif'))).toBe(false);

    // Stripped buffer must still be a valid JPEG (starts with SOI, ends with EOI)
    expect(stripped[0]).toBe(0xff);
    expect(stripped[1]).toBe(0xd8);
    expect(stripped[stripped.length - 2]).toBe(0xff);
    expect(stripped[stripped.length - 1]).toBe(0xd9);
  });

  it('strips metadata text chunks from PNG buffers', () => {
    const pngWithMeta = createMockPngBuffer(true);
    expect(pngWithMeta.includes(Buffer.from('SecretGPSCoordinates'))).toBe(true);

    const stripped = stripMetadataFromPng(pngWithMeta);
    expect(stripped.includes(Buffer.from('SecretGPSCoordinates'))).toBe(false);

    // PNG signature preserved
    expect(stripped.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  });
});
