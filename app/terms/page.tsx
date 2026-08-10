import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrandLockup } from '@/components/platform/brand-lockup';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6 md:pb-28 md:pt-10">
        <div className="flex items-center justify-between gap-4">
          <BrandLockup />
        </div>

        <header className="border-b border-border pb-10 pt-16 sm:pb-14 sm:pt-24">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Using OpenCV
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-[-0.02em] text-foreground sm:text-6xl">
            Terms of Service
          </h1>
          <p className="mt-5 text-base text-muted-foreground">
            Last updated: November 5, 2025
          </p>
        </header>

        <article className="divide-y divide-border [&>section]:py-8 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0 [&_h2]:font-display">
          <section>
            <h2 className="mb-4 text-2xl font-semibold tracking-[-0.02em] text-foreground">
              Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using OpenCV.app, you accept and agree to be
              bound by these Terms of Service. If you do not agree to these
              terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Description of Service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              OpenCV.app provides a platform for creating, editing, and hosting
              professional CV and resume profiles. The service allows users to
              create Private, Unlisted, or Public profiles with unique
              usernames.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              User Accounts
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Maintaining the confidentiality of your account credentials
              </li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>
                Ensuring your username does not infringe on others' rights
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              User Content
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You retain all rights to the content you create and upload. By
              using our service, you grant us:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                A license to store, display, and transmit your content as
                necessary to provide the service
              </li>
              <li>
                The right to make your content publicly accessible if you choose
                to make your profile public
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You are solely responsible for the accuracy and legality of the
              content you post. You must not post content that is illegal,
              offensive, or infringes on others' rights. Optional AI writing
              output may be inaccurate and is untrusted draft text; you are
              responsible for reviewing it before applying, copying, exporting,
              or sending it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Prohibited Uses
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the service for any illegal purpose</li>
              <li>Post false, misleading, or fraudulent information</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>
                Attempt to gain unauthorized access to the service or other
                users' accounts
              </li>
              <li>Scrape, harvest, or collect user data without permission</li>
              <li>Transmit viruses, malware, or other harmful code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Public, Unlisted, and Passcode Profiles
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Public and Unlisted profiles are accessible to anyone on the
              internet through their username URL. Contact, PDF export, approved
              testimonials, visible project images, and analytics remain
              enabled. Public profiles are eligible for the in-app directory and
              search indexing. Unlisted profiles are not access-controlled or
              confidential; they are excluded from the directory and ask search
              engines not to index them, but robots directives are advisory and
              third parties may retain shared or cached content. You can change
              your profile's access mode at any time. We are not responsible for
              how third parties use information from a Public or Unlisted
              profile. Passcode mode reduces access but cannot prevent
              authorized recipients from resharing, downloading, or capturing
              content. Testimonial recommendation links remain separate from
              profile passcode access.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Intellectual Property
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The OpenCV.app platform, including its design, code, and
              functionality, is owned by us and protected by intellectual
              property laws. You may not copy, modify, or distribute our
              platform without permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Service Modifications and Termination
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify or discontinue the service at any
              time, with or without notice. We may suspend or terminate your
              account if you violate these terms or engage in prohibited
              activities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Disclaimer of Warranties
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The service is provided "as is" without warranties of any kind,
              either express or implied. We do not guarantee that the service
              will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              To the fullest extent permitted by law, we shall not be liable for
              any indirect, incidental, special, consequential, or punitive
              damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Changes to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these terms from time to time. We will notify users
              of significant changes by posting a notice on the service or
              updating the "Last updated" date. Your continued use of the
              service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Contact
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms of Service, please contact
              us through our support channels.
            </p>
          </section>
        </article>
        <Link
          href="/"
          className="fixed bottom-5 right-5 inline-flex min-h-11 items-center gap-2 rounded bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:bottom-8 sm:right-8"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
      </main>
    </div>
  );
}
