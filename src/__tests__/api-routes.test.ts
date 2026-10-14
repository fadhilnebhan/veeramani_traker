import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as handleTrackerPost } from '@/app/api/tracker-entries/route';
import { POST as handleUploadPost } from '@/app/api/upload/route';
import { dataStore } from '@/lib/data-store';

describe('API Routes Integration (/api/tracker-entries & /api/upload)', () => {
  beforeEach(() => {
    dataStore.resetToDefault();
  });

  // Helper to create a NextRequest
  function makeJsonRequest(url: string, body: any): NextRequest {
    return new NextRequest(new URL(url, 'http://localhost:3000'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: JSON.stringify(body),
    });
  }

  it('submits a note-only parody report successfully', async () => {
    const req = makeJsonRequest('http://localhost:3000/api/tracker-entries', {
      note: 'Retro radio resonance heard near tea stall in Salem',
      is_fictional_confirmed: true,
    });

    const res = await handleTrackerPost(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.entry).toBeDefined();
    expect(data.entry.note).toBe('Retro radio resonance heard near tea stall in Salem');
    expect(data.entry.media_path).toBeNull();
    expect(data.entry.latitude).toBeDefined();
    expect(data.entry.longitude).toBeDefined();
  });

  it('submits a report with optional photo (media_path / image_url)', async () => {
    const req = makeJsonRequest('http://localhost:3000/api/tracker-entries', {
      note: 'Parody cinema poster observed near Madurai junction',
      media_path: 'signals/poster-sample.jpg',
      image_url: 'https://example.com/signals/poster-sample.jpg',
      is_fictional_confirmed: true,
    });

    const res = await handleTrackerPost(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.entry.media_path).toBe('signals/poster-sample.jpg');
    expect(data.entry.image_url).toBe('signals/poster-sample.jpg');
  });

  it('submits a report with optional location coordinates', async () => {
    const req = makeJsonRequest('http://localhost:3000/api/tracker-entries', {
      note: 'High-frequency pop lore ping in Coimbatore',
      latitude: 11.0168,
      longitude: 76.9558,
      is_fictional_confirmed: true,
    });

    const res = await handleTrackerPost(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.entry.latitude).toBeCloseTo(11.02, 1);
    expect(data.entry.longitude).toBeCloseTo(76.96, 1);
    expect(data.entry.district).toContain('Coimbatore');
    expect(data.is_demo_mode).toBe(true);
    expect(data.storage_type).toBe('in_memory_demo');
    expect(data.persistence_notice).toContain('demo mode');
  });

  it('rejects out-of-bounds coordinates with 400 and does NOT silently substitute Chennai', async () => {
    const req = makeJsonRequest('http://localhost:3000/api/tracker-entries', {
      note: 'Parody signal attempted from London',
      latitude: 51.5074,
      longitude: -0.1278,
      is_fictional_confirmed: true,
    });

    const res = await handleTrackerPost(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('outside the supported Tamil Nadu coverage area');
    expect(data.error).toContain('Preset substitutions are not permitted');
  });

  it('submits a report with BOTH optional photo and location', async () => {
    const req = makeJsonRequest('http://localhost:3000/api/tracker-entries', {
      note: 'Festive cutout spotted with musical echo in Tiruchirappalli',
      latitude: 10.7905,
      longitude: 78.7047,
      media_path: 'signals/trichy-signal.png',
      image_url: 'https://example.com/signals/trichy-signal.png',
      is_fictional_confirmed: true,
    });

    const res = await handleTrackerPost(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.entry.media_path).toBe('signals/trichy-signal.png');
    expect(data.entry.latitude).toBeCloseTo(10.79, 1);
    expect(data.entry.longitude).toBeCloseTo(78.70, 1);
  });

  it('publishes trusted source announcements immediately to map', async () => {
    const req = makeJsonRequest('http://localhost:3000/api/tracker-entries', {
      note: 'Chennai Music Academy cultural keynote announced https://thehindu.com/entertainment/art/music-season',
      is_fictional_confirmed: true,
    });

    const res = await handleTrackerPost(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.published).toBe(true);
    expect(data.entry.status).toBe('approved');
  });

  it('strictly rejects reports containing forbidden stalking keywords', async () => {
    const req = makeJsonRequest('http://localhost:3000/api/tracker-entries', {
      note: 'Following him to his private residence apartment address',
      is_fictional_confirmed: true,
    });

    const res = await handleTrackerPost(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Submissions must only be fictional parody lore');
  });

  it('rejects uploads with no file provided', async () => {
    const formData = new FormData();
    const req = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await handleUploadPost(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('No file provided');
  });

  it('handles image upload and returns demo fallback when storage unconfigured', async () => {
    // Construct a minimal valid JPEG buffer
    const jpegBuffer = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]),
      Buffer.from([0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0xaa, 0xbb]),
      Buffer.from([0xff, 0xd9]),
    ]);

    const file = new File([jpegBuffer], 'sample-signal.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file, 'sample-signal.jpg');

    const req = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await handleUploadPost(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.url).toBeDefined();
    expect(data.filename).toMatch(/\.jpg$/);
    expect(data.is_demo_fallback).toBe(true);
  });
});
