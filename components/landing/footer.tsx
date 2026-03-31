import { GithubIcon, LinkedinIcon, Twitter } from 'lucide-react';
import Link from 'next/link';

const socials = [
  {
    label: 'Twitter',
    href: 'https://x.com/doughydev',
    icon: Twitter,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/sean35mm/cv-builder',
    icon: GithubIcon,
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/seanhgil',
    icon: LinkedinIcon,
  },
];

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <span className="text-lg font-semibold font-serif">OpenCV</span>
          <span className="text-xs text-muted-foreground">
            Your career, beautifully presented.
          </span>
          <div className="mt-3 flex items-center gap-4">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="-m-1.5 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={s.label}
              >
                <s.icon className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link
            href="/changelog"
            className="transition-colors hover:text-foreground"
          >
            Changelog
          </Link>
          <Link
            href="/roadmap"
            className="transition-colors hover:text-foreground"
          >
            Roadmap
          </Link>
          <Link
            href="/terms"
            className="transition-colors hover:text-foreground"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy
          </Link>
          <span>&copy; {new Date().getFullYear()} OpenCV</span>
        </div>
      </div>
    </footer>
  );
}
