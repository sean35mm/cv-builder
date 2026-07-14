const MAX_RATE_LIMIT_KEY_INPUT_LENGTH = 512;

export async function stableRateLimitKey(
  namespace: string,
  value: string
): Promise<string> {
  if (
    !namespace ||
    namespace.length > 64 ||
    !value ||
    value.length > MAX_RATE_LIMIT_KEY_INPUT_LENGTH
  ) {
    throw new Error('Rate limit key is invalid');
  }

  const input = new TextEncoder().encode(`${namespace}:${value}`);
  const digest = await crypto.subtle.digest('SHA-256', input);
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  return `${namespace}:${hash}`;
}
