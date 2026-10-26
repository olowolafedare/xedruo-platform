// Supabase password-recovery emails sent from the dashboard land on the Site URL
// (the home page) with #...&type=recovery. Move that link to /reset-password
// BEFORE the Supabase client initialises so it still picks up the session from the hash.
if (typeof window !== 'undefined') {
  const hash = window.location.hash || '';
  if (hash.includes('type=recovery') && window.location.pathname !== '/reset-password') {
    window.history.replaceState(null, '', '/reset-password' + window.location.search + hash);
  }
}
