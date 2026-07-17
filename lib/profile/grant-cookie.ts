export const encodeGrantCookie = (username: string, token: string): string =>
  `${username.toLowerCase()}.${token}`;

export const parseGrantCookie = (
  value: string | undefined
): { username: string; token: string } | null => {
  if (!value) return null;
  const match = value.match(/^([a-z0-9_-]{3,30})\.([A-Za-z0-9_-]{43})$/);
  return match ? { username: match[1], token: match[2] } : null;
};

export const grantTokenForUsername = (
  value: string | undefined,
  username: string
): string | undefined => {
  const parsed = parseGrantCookie(value);
  return parsed?.username === username.toLowerCase() ? parsed.token : undefined;
};

export const grantCookieOptions = (expiresAt: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  expires: new Date(expiresAt),
});
