'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  X,
  Camera,
  ImageIcon,
  MapPin,
  Trash2,
  Check,
  Radio,
  Info
} from 'lucide-react';
import { containsForbiddenKeywords, isWithinCoverageBounds, getHumanReadableAreaLabel } from '@/lib/validation';
import { MAX_UPLOAD_SIZE, ALLOWED_MIME_TYPES } from '@/lib/image-processing';
import confetti from 'canvas-confetti';

interface ReportPanelProps {
  onSuccess?: (entry: any) => void;
  onClose?: () => void;
  isFloating?: boolean;
}

interface LocationData {
  latitude: number;
  longitude: number;
  areaLabel: string;
}

interface AttachedPhoto {
  file: File;
  previewUrl: string;
  filename: string;
  sizeBytes: number;
  uploadedUrl?: string;
  mediaPath?: string;
}

export function ReportPanel({ onSuccess, onClose, isFloating = false }: ReportPanelProps) {
  // 1. Main Note field (Required)
  const [note, setNote] = useState('');

  // 2. Photo Upload state (Optional)
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [attachedPhoto, setAttachedPhoto] = useState<AttachedPhoto | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  // Hidden file inputs for Camera vs Gallery
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // 3. Browser Location state (Optional)
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  // 4. Form Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publishedEntry, setPublishedEntry] = useState<any | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (attachedPhoto?.previewUrl && attachedPhoto.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(attachedPhoto.previewUrl);
      }
    };
  }, [attachedPhoto]);

  // Strip EXIF metadata client-side by re-encoding on an offscreen canvas
  const processImageFile = async (file: File): Promise<{ cleanFile: File; previewUrl: string }> => {
    return new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          // Cap dimensions at 1600px for mobile performance & privacy
          const MAX_DIM = 1600;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const targetMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const cleanFile = new File([blob], file.name, { type: targetMime });
                  const previewUrl = canvas.toDataURL(targetMime, 0.85);
                  URL.revokeObjectURL(objectUrl);
                  resolve({ cleanFile, previewUrl });
                  return;
                }
                resolve({ cleanFile: file, previewUrl: objectUrl });
              },
              targetMime,
              0.88
            );
            return;
          }
        } catch (canvasErr) {
          console.warn('Canvas EXIF strip fallback:', canvasErr);
        }
        resolve({ cleanFile: file, previewUrl: objectUrl });
      };

      img.onerror = () => {
        resolve({ cleanFile: file, previewUrl: objectUrl });
      };

      img.src = objectUrl;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Reset file input value so selecting the same file again works
    e.target.value = '';

    // Validate size
    if (file.size > MAX_UPLOAD_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setPhotoUploadError(`Image (${sizeMb} MB) exceeds maximum allowed 5 MB.`);
      return;
    }

    // Validate type
    const isAllowed = ALLOWED_MIME_TYPES.some(
      (type) => file.type.toLowerCase() === type.toLowerCase()
    );
    if (!isAllowed && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      setPhotoUploadError('Please select a valid image (JPEG, PNG, or WebP).');
      return;
    }

    // Clean previous preview
    if (attachedPhoto?.previewUrl && attachedPhoto.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(attachedPhoto.previewUrl);
    }

    // Process and strip metadata
    const { cleanFile, previewUrl } = await processImageFile(file);

    setAttachedPhoto({
      file: cleanFile,
      previewUrl,
      filename: file.name,
      sizeBytes: cleanFile.size,
    });
    setPhotoMenuOpen(false);
  };

  const handleRemovePhoto = () => {
    if (attachedPhoto?.previewUrl && attachedPhoto.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(attachedPhoto.previewUrl);
    }
    setAttachedPhoto(null);
    setPhotoUploadError(null);
    setPhotoMenuOpen(false);
  };

  // Optional Geolocation Request
  const handleRequestLocation = () => {
    setLocationMessage(null);

    if (locationDenied) {
      setLocationMessage('Location permission previously denied. You can continue reporting without location.');
      return;
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationMessage('Geolocation is not supported in this browser environment. You can continue without location.');
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (!isWithinCoverageBounds(lat, lng)) {
          setLocationLoading(false);
          setLocationData(null);
          setLocationMessage(
            `Detected location (${lat.toFixed(2)}°, ${lng.toFixed(2)}°) is outside the supported Tamil Nadu coverage area (8.0°–14.5° N, 76.0°–81.0° E). Coordinates will not be attached, but you can still submit your note.`
          );
          return;
        }

        const areaLabel = getHumanReadableAreaLabel(lat, lng);

        setLocationData({
          latitude: lat,
          longitude: lng,
          areaLabel,
        });
        setLocationLoading(false);
        setLocationMessage(null);
      },
      (error) => {
        setLocationLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationDenied(true);
          setLocationMessage('Location permission denied. You can still report without location.');
        } else if (error.code === error.TIMEOUT) {
          setLocationMessage('Location request timed out. You can retry or submit without location.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationMessage('Location unavailable on your device. You can submit without location.');
        } else {
          setLocationMessage('Unable to obtain device coordinates. You can submit without location.');
        }
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
        maximumAge: 60000,
      }
    );
  };

  const handleRemoveLocation = () => {
    setLocationData(null);
    setLocationMessage(null);
  };

  // Report Submission Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validate Note (Required)
    const trimmed = note.trim();
    if (!trimmed) {
      setErrorMessage('Please write a short note before submitting.');
      return;
    }
    if (trimmed.length < 3) {
      setErrorMessage('Note must be at least 3 characters.');
      return;
    }
    if (trimmed.length > 500) {
      setErrorMessage('Note cannot exceed 500 characters.');
      return;
    }

    // 2. Anti-Stalking Policy Validation
    if (containsForbiddenKeywords(trimmed)) {
      setErrorMessage(
        'Submissions must only be fictional parody lore or announced public appearances. Private whereabouts, hotel rooms, residences, and tracking keywords are strictly forbidden.'
      );
      return;
    }

    setSubmitting(true);

    try {
      let uploadedMediaPath: string | null = null;
      let uploadedImageUrl: string | null = null;

      // 3. Upload Photo if attached
      if (attachedPhoto) {
        setPhotoUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', attachedPhoto.file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();
        setPhotoUploading(false);

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Photo upload failed. Please retry.');
        }

        uploadedMediaPath = uploadData.media_path || uploadData.url;
        uploadedImageUrl = uploadData.url || uploadData.media_path;
      }

      // 4. Submit Report payload to backend
      const payload: Record<string, any> = {
        note: trimmed,
        is_fictional_confirmed: true,
      };

      if (uploadedMediaPath) {
        payload.media_path = uploadedMediaPath;
        payload.image_url = uploadedImageUrl;
      }

      if (locationData) {
        payload.latitude = locationData.latitude;
        payload.longitude = locationData.longitude;
        payload.district = locationData.areaLabel;
        payload.area_label = locationData.areaLabel;
        payload.landmark_name = locationData.areaLabel;
      }

      const res = await fetch('/api/tracker-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report. Please retry.');
      }

      const entry = data.entry || data.signal;
      setPublishedEntry({
        ...entry,
        is_demo_mode: data.is_demo_mode ?? true,
        persistence_notice: data.persistence_notice,
        storage_type: data.storage_type,
        published: data.published,
      });

      // Clear form inputs only after server confirms success
      setNote('');
      setAttachedPhoto(null);
      setLocationData(null);
      setPhotoMenuOpen(false);

      onSuccess?.(entry);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#F5C542', '#438567', '#FFF8E8'],
        });
      } catch {
        // ignore confetti errors
      }
    } catch (err: any) {
      // Inputs (note, photo, location) are preserved on failure!
      setErrorMessage(err.message || 'Submission failed. Please check details and retry.');
    } finally {
      setSubmitting(false);
      setPhotoUploading(false);
    }
  };

  const handleReset = () => {
    setPublishedEntry(null);
    setErrorMessage(null);
    setNote('');
    setAttachedPhoto(null);
    setLocationData(null);
    setPhotoMenuOpen(false);
  };

  return (
    <div
      className={`relative w-full rounded-2xl bg-[#1E1D33] border border-[#32304F] shadow-2xl p-4 sm:p-5 text-[#FFF8E8] ${
        isFloating ? 'max-w-md' : 'max-w-md mx-auto'
      }`}
    >
      {/* Floating Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-[#A5A2AD] hover:text-[#FFF8E8] hover:bg-[#32304F] transition-colors cursor-pointer"
          aria-label="Close report panel"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-[#F5C542]/15 border border-[#F5C542]/30 flex items-center justify-center text-[#F5C542]">
          <Radio className="w-4 h-4 text-[#F5C542]" />
        </div>
        <div>
          <h2 className="font-display font-black text-base sm:text-lg text-[#FFF8E8] leading-tight">
            Report a Signal
          </h2>
          <span className="text-[10px] text-[#A5A2AD] font-mono block">
            Fictional parody signal or announced public appearance
          </span>
        </div>
      </div>

      {publishedEntry ? (
        /* Publication Success Feedback */
        <div className="p-4 rounded-xl bg-[#151424] border border-[#438567]/50 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-10 h-10 rounded-full bg-[#438567]/20 border border-[#438567] flex items-center justify-center text-[#79d4a8] mx-auto">
            <CheckCircle2 className="w-6 h-6 text-[#438567]" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#FFF8E8]">
              {publishedEntry.status === 'approved' ? 'Pin Published to Map!' : 'Report Submitted (Pending Review)'}
            </h3>
            <p className="text-xs text-[#A5A2AD] mt-1 leading-relaxed">
              {publishedEntry.status === 'approved'
                ? 'Trusted announcement verified. Your pin is live on the tracker map.'
                : 'Parody signal recorded and queued for moderator verification. It is not publicly live on the map yet.'}
            </p>
          </div>

          {/* Honest Demo Mode / Persistent Storage Indicator */}
          {publishedEntry.is_demo_mode ? (
            <div className="p-2 rounded-lg bg-[#F5C542]/10 border border-[#F5C542]/30 text-[11px] text-[#F5C542] text-left flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>Demo Mode (In-Memory):</strong> Supabase credentials are not configured. This report is held in memory for this session only and will reset when the server restarts.
              </span>
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-[#438567]/10 border border-[#438567]/30 text-[11px] text-[#79d4a8] text-left flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span><strong>Persistently Saved:</strong> Stored securely in database.</span>
            </div>
          )}

          <div className="p-2.5 rounded-lg bg-[#1E1D33] border border-[#32304F] text-[11px] text-left text-[#C5C2CE] font-mono space-y-1.5">
            <div className="truncate">
              <strong className="text-[#F5C542]">Signal:</strong> {publishedEntry.title || publishedEntry.note}
            </div>
            <div>
              <strong className="text-[#F5C542]">Area:</strong> {publishedEntry.district || publishedEntry.city || 'Tamil Nadu'}
            </div>
            {publishedEntry.media_path && (
              <div className="flex items-center gap-1.5 text-[#79d4a8]">
                <Check className="w-3 h-3" />
                <span>Photo attached and verified (EXIF stripped)</span>
              </div>
            )}
            <div>
              <strong className="text-[#F5C542]">Map Status:</strong>{' '}
              <span className={`uppercase font-bold ${publishedEntry.status === 'approved' ? 'text-[#79d4a8]' : 'text-[#F5C542]'}`}>
                {publishedEntry.status === 'approved' ? 'Live on Map' : 'Pending Review (Not Live)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleReset}
              className="flex-1 py-2 px-3 bg-[#222038] hover:bg-[#32304F] text-xs font-semibold text-[#FFF8E8] rounded-xl transition-colors cursor-pointer"
            >
              Report Another
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="py-2 px-4 bg-[#F5C542] hover:bg-[#D4A325] text-xs font-bold text-[#19182B] rounded-xl transition-colors cursor-pointer"
              >
                View Map
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Report Form */
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Main Required Field: Write a short note... */}
          <div className="space-y-1">
            <textarea
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Write a short note..."
              className={`w-full px-3 py-2.5 bg-[#151424] border rounded-xl text-xs sm:text-sm text-[#FFF8E8] placeholder:text-[#A5A2AD]/60 focus:outline-none transition-colors resize-none leading-relaxed ${
                errorMessage ? 'border-[#F16F59] focus:border-[#F16F59]' : 'border-[#32304F] focus:border-[#F5C542]'
              }`}
            />
            <div className="flex items-center justify-between text-[10px] text-[#A5A2AD]">
              <span>City / venue notes & announcements</span>
              <span className={note.length > 450 ? 'text-[#F16F59]' : ''}>{note.length}/500</span>
            </div>
          </div>

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            aria-label="Take Photo with camera"
          />
          <input
            type="file"
            ref={galleryInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            aria-label="Choose image from gallery"
          />

          {/* PHOTO SECTION: [ + Add Photo (Optional) ] */}
          <div>
            {!attachedPhoto ? (
              <div className="space-y-1.5">
                {!photoMenuOpen ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoMenuOpen(true);
                      setPhotoUploadError(null);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#151424] hover:bg-[#222038] border border-[#32304F] hover:border-[#F5C542]/50 text-xs text-[#FFF8E8] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#F5C542]" />
                    <span className="font-semibold">+ Add Photo (Optional)</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#151424] border border-[#F5C542]/40 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px] text-[#A5A2AD]">
                      <span>Select image source (JPEG, PNG, WebP up to 5 MB):</span>
                      <button
                        type="button"
                        onClick={() => setPhotoMenuOpen(false)}
                        className="text-[#A5A2AD] hover:text-[#FFF8E8] p-0.5"
                        aria-label="Cancel photo selection"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="py-2 px-2.5 bg-[#222038] hover:bg-[#32304F] text-[#FFF8E8] border border-[#32304F] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#F5C542]" />
                        <span>Take Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="py-2 px-2.5 bg-[#222038] hover:bg-[#32304F] text-[#FFF8E8] border border-[#32304F] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-[#F5C542]" />
                        <span>Choose from Gallery</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Attached Photo Thumbnail & Remove Button */
              <div className="p-2 rounded-xl bg-[#151424] border border-[#438567]/50 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#1E1D33] border border-[#32304F] shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={attachedPhoto.previewUrl}
                      alt="Upload preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#FFF8E8] truncate">
                      {attachedPhoto.filename}
                    </p>
                    <span className="text-[10px] text-[#79d4a8] flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      Photo attached ({(attachedPhoto.sizeBytes / 1024).toFixed(0)} KB) • EXIF stripped
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-2.5 py-1.5 bg-[#7D263D]/30 hover:bg-[#7D263D]/60 text-[#ff9d8c] border border-[#7D263D]/50 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="Remove Photo"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </div>
            )}

            {photoUploadError && (
              <p className="text-[11px] text-[#F16F59] mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>{photoUploadError}</span>
              </p>
            )}
          </div>

          {/* LOCATION SECTION: [ 📍 Add Location (Optional) ] */}
          <div>
            {!locationData ? (
              <div className="space-y-1">
                <button
                  type="button"
                  disabled={locationLoading}
                  onClick={handleRequestLocation}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#151424] hover:bg-[#222038] border border-[#32304F] hover:border-[#F5C542]/50 text-xs text-[#FFF8E8] flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {locationLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F5C542]" />
                      <span className="font-semibold">Detecting sector...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-[#F5C542]" />
                      <span className="font-semibold">📍 Add Location (Optional)</span>
                    </>
                  )}
                </button>

                {locationMessage && (
                  <div className="p-2 rounded-lg bg-[#222038] border border-[#32304F] text-[11px] text-[#A5A2AD] flex items-start gap-1.5">
                    <Info className="w-3 h-3 text-[#F5C542] shrink-0 mt-0.5" />
                    <span>{locationMessage}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Location Added Success Indicator & Remove Location */
              <div className="p-2 rounded-xl bg-[#151424] border border-[#438567]/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-[#79d4a8] min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-[#F5C542] shrink-0" />
                  <span className="font-semibold truncate">
                    Location: <strong className="text-[#FFF8E8]">{locationData.areaLabel}</strong>{' '}
                    <span className="text-[10px] text-[#A5A2AD]">
                      ({locationData.latitude.toFixed(2)}°, {locationData.longitude.toFixed(2)}°)
                    </span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveLocation}
                  className="px-2 py-1 bg-[#222038] hover:bg-[#32304F] text-[#A5A2AD] hover:text-[#FFF8E8] text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Remove Location"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Inline Error Message with Retry */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-[#F16F59]/15 border border-[#F16F59] text-xs text-[#ff9d8c] flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5 text-[11px] leading-tight">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="submit"
                className="px-2 py-0.5 bg-[#F16F59] text-white text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Turmeric-Yellow REPORT Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#F5C542] to-[#D4A325] hover:from-[#FCE8A1] hover:to-[#F5C542] text-[#19182B] font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(245,197,66,0.3)] transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#19182B]" />
                <span>{photoUploading ? 'Uploading Image...' : 'Submitting Report...'}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-[#19182B]" />
                <span>REPORT</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
