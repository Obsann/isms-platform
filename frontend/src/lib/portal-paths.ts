export const PORTAL_ROOTS = ['super-admin', 'tenant-admin', 'teller', 'member'] as const;

export type PortalRoot = (typeof PORTAL_ROOTS)[number];

export function portalRootFromPath(pathname: string): `/${PortalRoot}` | null {
  const root = pathname.split('/').filter(Boolean)[0];
  return (PORTAL_ROOTS as readonly string[]).includes(root)
    ? (`/${root}` as `/${PortalRoot}`)
    : null;
}

export function portalDashboardHref(pathname: string): string | null {
  const root = portalRootFromPath(pathname);
  return root ? `${root}/dashboard` : null;
}

/** Exact path, nested path, or in-page hash (for /task7-verify). */
export function isNavActive(pathname: string, href: string, hash = ''): boolean {
  const hashIndex = href.indexOf('#');
  if (hashIndex >= 0) {
    const path = href.slice(0, hashIndex) || pathname;
    const itemHash = href.slice(hashIndex);
    return pathname === path && (hash === itemHash || (!hash && itemHash === '#overview'));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
