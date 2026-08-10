import Link from 'next/link';
import { BrandLockup } from '@/components/platform/brand-lockup';

const productLinks = [
  ['Directory', '/directory'],
  ['Changelog', '/changelog'],
  ['Roadmap', '/roadmap'],
] as const;

const legalLinks = [
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-10 py-12 md:grid-cols-12 md:items-start">
          <div className="md:col-span-5">
            <BrandLockup />
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
              Build and publish your professional profile at opencv.app/@you.
            </p>
          </div>
          <div className="grid gap-6 md:col-span-7 md:grid-cols-[auto_auto] md:justify-end md:gap-12">
            <nav aria-label="Product">
              <span className="text-sm font-medium">Product</span>
              <ul className="mt-2 flex flex-wrap gap-x-5">
                {productLinks.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Legal">
              <span className="text-sm font-medium">Legal</span>
              <ul className="mt-2 flex flex-wrap gap-x-5">
                {legalLinks.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t border-border py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} OpenCV</span>
          <span>Professional profiles with a memorable address.</span>
        </div>
      </div>
    </footer>
  );
}
