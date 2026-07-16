/** Builds a /login URL that remembers where to send the user back to after signing in. */
export function loginUrlWithRedirect(pathname: string, search?: string): string {
  const target = `${pathname}${search || ""}`;
  return `/login?redirect=${encodeURIComponent(target)}`;
}

/**
 * Only ever redirect back to a same-origin relative path — never trust the query value
 * blindly, or a crafted `?redirect=//evil.com` link could send users off-site after login.
 */
export function safeRedirectPath(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) {
    return value;
  }
  return "/dashboard";
}
