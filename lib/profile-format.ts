export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month] = dateString.split('-');
  const date = new Date(
    parseInt(year),
    Math.max(0, parseInt(month || '1') - 1)
  );
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

export function formatRange(
  start: string,
  end?: string,
  current?: boolean
): string {
  const startStr = formatDate(start);
  const endStr = current ? 'Now' : formatDate(end || '');
  return `${startStr} — ${endStr}`;
}

export function displayUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    const { hostname } = new URL(normalized);
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function normalizeExternalUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const value = url.trim();
  if (!value) return undefined;
  const hasHttpScheme = /^https?:\/\//i.test(value);
  if (
    (/^[a-z][a-z\d+.-]*:/i.test(value) && !hasHttpScheme) ||
    (value.includes('://') && !hasHttpScheme)
  ) {
    return undefined;
  }

  try {
    const normalized = hasHttpScheme ? value : `https://${value}`;
    const parsed = new URL(normalized);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.hostname
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}
