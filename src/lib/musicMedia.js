import { supabase } from '@/api/xedruoClient';

export async function uploadMusicAudio({ file, trackId }) {
  if (!file || !trackId) throw new Error('Audio file and track ID are required');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session?.access_token) throw new Error('Please sign in again');

  const response = await fetch('/api/media', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      trackId,
      fileName: file.name,
      contentType: file.type || 'audio/mpeg',
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Could not prepare media upload');

  const upload = await fetch(payload.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'audio/mpeg' },
    body: file,
  });
  if (!upload.ok) throw new Error(`R2 upload failed (${upload.status})`);

  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('music_media_objects').insert({
    owner_user_id: userData.user.id,
    track_id: trackId,
    media_type: 'audio_master',
    storage_provider: 'r2',
    storage_bucket: payload.bucket,
    object_key: payload.key,
    cdn_provider: payload.cdnUrl ? 'bunny' : null,
    cdn_url: payload.cdnUrl,
    mime_type: file.type || 'audio/mpeg',
    size_bytes: file.size,
    visibility: 'private',
    status: 'uploaded',
  }).select().single();

  if (error) throw error;
  return data;
}

export function getMusicStreamUrl(media) {
  if (media?.cdn_url) return media.cdn_url;
  throw new Error('Media is uploaded but no CDN URL is configured yet');
}
