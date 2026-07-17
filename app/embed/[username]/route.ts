import { fetchQuery } from 'convex/nextjs';
import { NextRequest } from 'next/server';
import { api } from '@/convex/_generated/api';
import { resolveRequestHostBinding } from '@/lib/custom-domains/server-resolver';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'private, no-store, max-age=0',
  'Content-Security-Policy':
    "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors https: http:; base-uri 'none'; form-action 'none'",
  'Content-Type': 'text/html; charset=utf-8',
  Pragma: 'no-cache',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const binding = await resolveRequestHostBinding(request);
  if (
    binding.kind === 'denied' ||
    (binding.kind === 'custom' && binding.username !== username)
  ) {
    return new Response('Not found', { status: 404, headers });
  }
  const locale = request.nextUrl.searchParams.get('locale') ?? undefined;
  const theme = request.nextUrl.searchParams.get('theme');
  const dark = theme === 'dark';
  const profile = await fetchQuery(api.embed.getProfile, {
    username,
    locale,
  }).catch(() => null);
  if (!profile) return new Response('Not found', { status: 404, headers });
  const skills = profile.skills
    .map((skill: string) => `<li>${escapeHtml(skill)}</li>`)
    .join('');
  const experience = profile.experience
    .map(
      (item: { role: string; company: string; description?: string }) =>
        `<li><strong>${escapeHtml(item.role)}</strong> — ${escapeHtml(item.company)}${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}</li>`
    )
    .join('');
  const html = `<!doctype html><html lang="${escapeHtml(profile.locale)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(profile.name)}</title><style>:root{color-scheme:${dark ? 'dark' : 'light'};font-family:ui-sans-serif,system-ui,sans-serif}body{margin:0;padding:1rem;background:${dark ? '#111827' : '#fff'};color:${dark ? '#f9fafb' : '#111827'}}main{max-width:48rem;margin:auto}h1{margin:.1rem 0;font-size:1.5rem}h2{font-size:1rem;margin-top:1.2rem}p,li{font-size:.9rem;line-height:1.5}ul{padding-left:1.25rem}.skills{display:flex;flex-wrap:wrap;gap:.35rem;list-style:none;padding:0}.skills li{border:1px solid #8886;border-radius:999px;padding:.2rem .55rem}</style></head><body><main><header><h1>${escapeHtml(profile.name)}</h1>${profile.title ? `<p>${escapeHtml(profile.title)}</p>` : ''}${profile.bio ? `<p>${escapeHtml(profile.bio)}</p>` : ''}</header>${skills ? `<section><h2>Skills</h2><ul class="skills">${skills}</ul></section>` : ''}${experience ? `<section><h2>Experience</h2><ul>${experience}</ul></section>` : ''}</main></body></html>`;
  return new Response(html, { headers });
}
