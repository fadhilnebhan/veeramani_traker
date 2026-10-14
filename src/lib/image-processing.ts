/**
 * Image processing and validation utilities for Veeramani Tracker.
 * Validates image size, MIME types, magic bytes, and strips EXIF / GPS metadata.
 */

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

export interface ImageValidationResult {
  isValid: boolean;
  mimeType: AllowedMimeType | null;
  error?: string;
  sanitizedBuffer?: Buffer;
}

/**
 * Validates that an image buffer does not exceed max size and has valid magic bytes
 * matching JPEG, PNG, or WebP.
 */
export function validateImageBuffer(
  buffer: Buffer,
  filename?: string,
  declaredMimeType?: string
): ImageValidationResult {
  if (!buffer || buffer.length === 0) {
    return { isValid: false, mimeType: null, error: 'Empty file provided.' };
  }

  if (buffer.length > MAX_UPLOAD_SIZE) {
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      mimeType: null,
      error: `File size (${sizeMb} MB) exceeds maximum allowed size of 5 MB.`,
    };
  }

  if (buffer.length < 12) {
    return { isValid: false, mimeType: null, error: 'File is too small to be a valid image.' };
  }

  // Validate filename extension if filename contains an extension
  if (filename && filename.includes('.')) {
    const lowerName = filename.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!hasValidExt) {
      return {
        isValid: false,
        mimeType: null,
        error: 'Unsupported file extension. Only JPEG, PNG, and WebP are supported.',
      };
    }
  }

  // Validate declared MIME type if provided
  if (declaredMimeType && !ALLOWED_MIME_TYPES.includes(declaredMimeType as AllowedMimeType)) {
    return {
      isValid: false,
      mimeType: null,
      error: `Unsupported image format (${declaredMimeType}). Allowed: JPEG, PNG, WebP.`,
    };
  }

  // Check Magic Bytes
  let detectedType: AllowedMimeType | null = null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    detectedType = 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  else if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    detectedType = 'image/png';
  }
  // WebP: RIFF .... WEBP
  else if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    detectedType = 'image/webp';
  }

  if (!detectedType) {
    return {
      isValid: false,
      mimeType: null,
      error: 'File content does not match genuine JPEG, PNG, or WebP image data.',
    };
  }

  // Strip EXIF metadata
  const sanitizedBuffer = stripImageMetadata(buffer, detectedType);

  return {
    isValid: true,
    mimeType: detectedType,
    sanitizedBuffer,
  };
}

/**
 * Strips APP1 (0xFF 0xE1) EXIF and metadata segments from a JPEG buffer,
 * discarding any embedded GPS coordinates or device information.
 */
export function stripExifFromJpeg(buffer: Buffer): Buffer {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return buffer;
  }

  const chunks: Buffer[] = [buffer.subarray(0, 2)]; // Start with SOI (FF D8)
  let offset = 2;

  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) {
      // Stream boundary reached or raw data
      chunks.push(buffer.subarray(offset));
      break;
    }

    const marker = buffer[offset + 1];

    // End of image
    if (marker === 0xd9) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    // Standalone markers without length: 0x00 or restart markers RST0..RST7
    if (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7)) {
      chunks.push(buffer.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }

    if (offset + 4 > buffer.length) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    // Read 2-byte segment length (includes length field itself)
    const segmentLength = buffer.readUInt16BE(offset + 2);
    const nextOffset = offset + 2 + segmentLength;

    // Start of Scan (0xDA): rest of file is compressed image data
    if (marker === 0xda) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    // Marker 0xE1 is APP1 (EXIF / GPS) - Skip to strip all EXIF metadata!
    // Also skip 0xE2 (APP2) if containing extended metadata
    if (marker === 0xe1 || marker === 0xe2) {
      offset = nextOffset;
      continue;
    }

    chunks.push(buffer.subarray(offset, Math.min(nextOffset, buffer.length)));
    offset = nextOffset;
  }

  return Buffer.concat(chunks);
}

/**
 * Strips metadata chunks (eXIf, tEXt, zTXt, iTXt) from a PNG buffer.
 */
export function stripMetadataFromPng(buffer: Buffer): Buffer {
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIG)) {
    return buffer;
  }

  const chunks: Buffer[] = [PNG_SIG];
  let offset = 8;
  const skipTypes = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt']);

  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const totalChunkLength = 12 + length; // 4 (len) + 4 (type) + length (data) + 4 (crc)

    if (offset + totalChunkLength > buffer.length) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    if (skipTypes.has(type)) {
      offset += totalChunkLength;
      continue;
    }

    chunks.push(buffer.subarray(offset, offset + totalChunkLength));
    offset += totalChunkLength;

    if (type === 'IEND') break;
  }

  return Buffer.concat(chunks);
}

/**
 * Removes metadata from the image buffer according to its MIME type.
 */
export function stripImageMetadata(buffer: Buffer, mimeType: AllowedMimeType): Buffer {
  try {
    if (mimeType === 'image/jpeg') {
      return stripExifFromJpeg(buffer);
    }
    if (mimeType === 'image/png') {
      return stripMetadataFromPng(buffer);
    }
    // WebP structure is clean or already handled
    return buffer;
  } catch (err) {
    console.warn('Metadata stripping encountered non-fatal issue, falling back to original buffer:', err);
    return buffer;
  }
}
