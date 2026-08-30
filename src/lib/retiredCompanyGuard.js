const RETIRED_COMPANY_SLUGS = new Set(['agruo', 'capital', 'energy', 'education']);

const isRetiredPath = (pathname = window.location.pathname) => {
  const parts = pathname.split('/').filter(Boolean).map((part) => part.toLowerCase());
  return parts.some((part) => RETIRED_COMPANY_SLUGS.has(part));
};

const removeRetiredLinks = () => {
  document.querySelectorAll('a[href]').forEach((anchor) => {
    try {
      const url = new URL(anchor.getAttribute('href'), window.location.origin);
      const parts = url.pathname.split('/').filter(Boolean).map((part) => part.toLowerCase());
      if (parts.some((part) => RETIRED_COMPANY_SLUGS.has(part))) anchor.remove();
    } catch {
      // Ignore malformed/non-navigation hrefs.
    }
  });
};

export function startRetiredCompanyGuard() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};

  if (isRetiredPath()) {
    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  removeRetiredLinks();
  const observer = new MutationObserver(removeRetiredLinks);
  observer.observe(document.body, { childList: true, subtree: true });

  return () => observer.disconnect();
}
