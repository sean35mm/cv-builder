import { GithubIcon, LinkedinIcon, Twitter } from 'lucide-react';

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
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold font-serif">OpenCV</span>
          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label={s.label}
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <a href="/terms" className="transition-colors hover:text-foreground">
            Terms
          </a>
          <a
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy
          </a>
          <span>&copy; {new Date().getFullYear()} OpenCV</span>
        </div>
      </div>
    </footer>
  );
}
