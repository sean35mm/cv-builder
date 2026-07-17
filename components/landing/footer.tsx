import Link from 'next/link';
import { BrandLockup } from '@/components/platform/brand-lockup';

const links = [
  ['Directory', '/directory'],
  ['Changelog', '/changelog'],
  ['Roadmap', '/roadmap'],
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
] as const;

export function Footer() {
  return (
    <footer className="border-t">
      <div className="platform-page py-10">
        <div className="platform-grid items-end gap-y-8">
          <div className="col-span-12 md:col-span-5">
            <BrandLockup />
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">A public record for work that keeps changing.</p>
          </div>
          <nav className="col-span-12 md:col-span-7" aria-label="Footer">
            <ul className="grid grid-cols-2 border-t sm:grid-cols-5">
              {links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="flex min-h-11 items-center border-b text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground sm:justify-end">{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">© {new Date().getFullYear()} OpenCV · Open source</p>
      </div>
    </footer>
  );
}
