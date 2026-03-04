export function getTenantPrefixFromPathname(pathname: string): string | null {
  // Expected tenant URLs: /tenant/:tenantId/...
  const match = pathname.match(/^\/tenant\/([^/]+)(?:\/|$)/);
  if (!match) return null;
  return `/tenant/${match[1]}`;
}

export function joinTenantPath(tenantPrefix: string | null, path: string): string {
  if (!tenantPrefix) return path;
  if (!path.startsWith("/")) path = `/${path}`;
  if (path === "/") return tenantPrefix;
  return `${tenantPrefix}${path}`;
}

