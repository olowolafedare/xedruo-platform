const providers = {
  xedruo: { name: "Xedruo Distribution", env: "XEDRUO_DISTRIBUTION_API_URL" },
  tunecore: { name: "TuneCore", env: "TUNECORE_API_URL" },
  onerpm: { name: "ONErpm", env: "ONERPM_API_URL" },
};

export function listMusicProviders() {
  return Object.entries(providers).map(([id, value]) => ({ id, name: value.name, configured: Boolean(import.meta.env?.[`VITE_${value.env}`]) }));
}

export async function musicApi(path, options = {}) {
  const base = import.meta.env.VITE_XEDRUO_MUSIC_API_URL || "/api/xedruo-music";
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error(`Xedruo Music API error: ${response.status}`);
  return response.json();
}

export const musicEndpoints = {
  profile: "/profile",
  catalog: "/catalog",
  search: "/search",
  stream: "/stream",
  bookings: "/bookings",
  tickets: "/tickets",
  support: "/support",
  store: "/store",
  releases: "/releases",
};
