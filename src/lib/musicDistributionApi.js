// Server-side distribution API contract. Pay & Play is intentionally excluded.
export const EXTERNAL_DSP_TARGETS = [
  'spotify','apple_music','tidal','youtube_music','amazon_music','boomplay',
  'audiomack','deezer','soundcloud','pandora','anghami'
];

/**
 * Normalize a published Xedruo Distribution release into the payload expected
 * by an external distribution/API provider. Credentials must remain server-side.
 */
export function toDistributionApiPayload(release={}) {
  return {
    title: release.title,
    artist: release.artist,
    featured_artist: release.featured_artist || null,
    genre: release.genre || null,
    language: release.language || null,
    release_date: release.release_date || null,
    artwork_url: release.artwork_url || null,
    audio_url: release.audio_url || null,
    lyrics: release.lyrics || null,
    territories: release.territories || ['worldwide'],
    targets: (release.distribution_targets || EXTERNAL_DSP_TARGETS).filter(x => x !== 'pay_and_play'),
    source: 'xedruo_music_distribution',
    play_sync: true,
  };
}

export function isPublishableRelease(release={}) {
  return release.status === 'live' && release.takedown_status !== 'requested' && release.takedown_status !== 'completed';
}
