import { NextRequest, NextResponse } from 'next/server';
import {
  validateImageBuffer,
  MAX_UPLOAD_SIZE,
} from '@/lib/image-processing';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided in upload request.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 5 MB.`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate magic bytes, mime type, and strip EXIF / GPS metadata
    const validation = validateImageBuffer(buffer, file.name, file.type);
    if (!validation.isValid || !validation.mimeType || !validation.sanitizedBuffer) {
      return NextResponse.json(
        { error: validation.error || 'Invalid image file provided.' },
        { status: 400 }
      );
    }

    const sanitizedBuffer = validation.sanitizedBuffer;
    const mimeType = validation.mimeType;
    const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/png' ? 'png' : 'webp';
    const filename = `signal-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const originalName = file.name && file.name !== 'blob' ? file.name : filename;
    const storagePath = `signals/${filename}`;

    // 1. Supabase Storage if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { error: uploadError } = await supabase.storage
          .from('tracker-media')
          .upload(storagePath, sanitizedBuffer, {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: false,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('tracker-media')
            .getPublicUrl(storagePath);

          return NextResponse.json({
            success: true,
            url: publicUrlData.publicUrl,
            media_path: storagePath,
            filename: originalName,
            size: sanitizedBuffer.length,
            mimeType,
            is_demo_fallback: false,
          });
        }
        console.warn('Supabase storage upload error, using local fallback:', uploadError.message);
      } catch (err: any) {
        console.warn('Supabase connection failed for storage upload:', err.message);
      }
    }

    // 2. Honest Local Demo Fallback
    // Return base64 data URI so thumbnail and map popup render immediately in local testing
    const base64DataUri = `data:${mimeType};base64,${sanitizedBuffer.toString('base64')}`;

    return NextResponse.json({
      success: true,
      url: base64DataUri,
      media_path: base64DataUri,
      filename: originalName,
      size: sanitizedBuffer.length,
      mimeType,
      is_demo_fallback: true,
      message: 'Image processed and cached in local demo mode (Supabase storage not configured).',
    });
  } catch (error: any) {
    console.error('Error handling upload:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error while processing image upload.' },
      { status: 500 }
    );
  }
}
