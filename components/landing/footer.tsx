import Link from 'next/link';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/theme-toggle';

const LINKS = [
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
  ['GitHub', 'https://github.com/sean35mm/cv-builder'],
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-8 sm:px-8">
        <div className="flex items-center gap-4">
          <Brand />
          <span className="text-[13px] text-subtle">
            © {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex items-center gap-5">
          <nav aria-label="Footer">
            <ul className="flex items-center gap-5 text-[13px]">
              {LINKS.map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
