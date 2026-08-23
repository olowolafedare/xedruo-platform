import React from "react";
import { BadgeCheck, MapPin, Headphones, Users, Radio, Mail, Phone, MessageCircle, User, Globe } from "lucide-react";

const SOCIALS = [
  { key: "instagram_url", label: "Instagram", color: "text-pink-500" },
  { key: "tiktok_url", label: "TikTok", color: "text-white" },
  { key: "facebook_url", label: "Facebook", color: "text-blue-500" },
  { key: "twitter_url", label: "X", color: "text-white" },
  { key: "youtube_url", label: "YouTube", color: "text-red-500" },
  { key: "threads_url", label: "Threads", color: "text-white" },
  { key: "snapchat_url", label: "Snapchat", color: "text-yellow-400" },
  { key: "telegram_url", label: "Telegram", color: "text-sky-400" },
  { key: "twitch_url", label: "Twitch", color: "text-purple-400" },
  { key: "linkedin_url", label: "LinkedIn", color: "text-blue-400" },
  { key: "pinterest_url", label: "Pinterest", color: "text-red-400" },
  { key: "spotify_url", label: "Spotify", color: "text-green-500" },
  { key: "apple_music_url", label: "Apple Music", color: "text-white" },
  { key: "audiomack_url", label: "Audiomack", color: "text-orange-500" },
  { key: "soundcloud_url", label: "SoundCloud", color: "text-orange-400" },
  { key: "boomplay_url", label: "Boomplay", color: "text-emerald-400" },
  { key: "deezer_url", label: "Deezer", color: "text-blue-300" },
  { key: "bandcamp_url", label: "Bandcamp", color: "text-teal-400" },
  { key: "mixcloud_url", label: "Mixcloud", color: "text-indigo-300" },
  { key: "website_url", label: "Website", color: "text-primary" },
];

export default function ArtistHeader({ artist }) {
  const location = [artist.city, artist.country].filter(Boolean).join(", ") || artist.location;
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Banner */}
      <div className="h-40 sm:h-56 bg-gradient-to-r from-primary/30 via-primary/10 to-secondary relative">
        {artist.banner_url && <img src={artist.banner_url} alt="" className="w-full h-full object-cover" />}
      </div>

      <div className="px-5 sm:px-8 pb-6 -mt-12 sm:-mt-16">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-card bg-primary/20 grid place-items-center text-primary text-4xl font-bold overflow-hidden shrink-0">
            {artist.avatar_url ? <img src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover" /> : artist.name?.[0]}
          </div>

          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-display font-bold">{artist.name}</h1>
              {artist.verified && <BadgeCheck className="w-6 h-6 text-blue-500 shrink-0" />}
            </div>
            {artist.stage_name && artist.stage_name !== artist.name && (
              <p className="text-muted-foreground text-sm">aka {artist.stage_name}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
              {artist.genre && <span className="text-primary font-medium">{artist.genre}</span>}
              {location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{location}</span>}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-3 sm:gap-5 pb-1">
            <Stat icon={Headphones} label="Streams" value={artist.total_streams || 0} />
            <Stat icon={Users} label="Followers" value={artist.followers || 0} />
            <Stat icon={Radio} label="Monthly" value={artist.monthly_listeners || 0} />
          </div>
        </div>

        {artist.bio && <p className="mt-5 text-sm leading-relaxed text-muted-foreground max-w-3xl">{artist.bio}</p>}

        {/* Socials */}
        <div className="mt-5 flex flex-wrap gap-2">
          {SOCIALS.filter(s => artist[s.key]).map(s => (
            <a key={s.key} href={artist[s.key]} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs hover:bg-primary hover:text-primary-foreground transition-colors">
              <Globe className={`w-3.5 h-3.5 ${s.color}`} /> {s.label}
            </a>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {artist.manager_name && <Contact icon={User} label="Manager" value={artist.manager_name} />}
          {artist.booking_email && <Contact icon={Mail} label="Booking Email" value={artist.booking_email} />}
          {artist.phone && <Contact icon={Phone} label="Phone" value={artist.phone} />}
          {artist.whatsapp && <Contact icon={MessageCircle} label="WhatsApp" value={artist.whatsapp} />}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold">{Number(value).toLocaleString()}</div>
      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Icon className="w-3 h-3" />{label}</div>
    </div>
  );
}

function Contact({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-0.5"><Icon className="w-3.5 h-3.5" />{label}</div>
      <div className="text-sm font-medium truncate">{value}</div>
    </div>
  );
}