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
