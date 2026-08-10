import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrandLockup } from '@/components/platform/brand-lockup';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6 md:pb-28 md:pt-10">
        <div className="flex items-center justify-between gap-4">
          <BrandLockup />
        </div>

        <header className="border-b border-border pb-10 pt-16 sm:pb-14 sm:pt-24">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Privacy at OpenCV
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-[-0.02em] text-foreground sm:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-5 text-base text-muted-foreground">
            Last updated: July 16, 2026
          </p>
        </header>

        <article className="divide-y divide-border [&>section]:py-8 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0 [&_h2]:font-display">
          <section>
            <h2 className="mb-4 text-2xl font-semibold tracking-[-0.02em] text-foreground">
              Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              At OpenCV.app, we take your privacy seriously. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your
              information when you use our CV building and hosting service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Information We Collect
            </h2>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              Account Information
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Email address</li>
              <li>Username</li>
              <li>Password (encrypted)</li>
              <li>Authentication tokens</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              Profile Information
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You choose what information to include in your CV, which may
              include:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Personal information (name, contact details, location)</li>
              <li>Professional summary and bio</li>
              <li>Work experience and employment history</li>
              <li>Education and certifications</li>
              <li>Skills and competencies</li>
              <li>Projects, awards, and exhibitions</li>
              <li>Social media links</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              Usage Information
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We automatically collect:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Consent-based profile views and PDF download counts</li>
              <li>
                Coarse device category and trusted two-letter country code
              </li>
              <li>
                Referrer hostname and bounded UTM campaign values without query
                parameters
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              AI Writing
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              AI writing is disabled by default. When enabled and you explicitly
              request a draft, the configured provider receives only the visible
              profile text fields you selected and the job description. We omit
              contact details, email, social identifiers, media, private
              metadata, and imported source files. OpenCV does not persist the
              prompt or draft; you must review and explicitly apply or copy it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              How We Use Your Information
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide, maintain, and improve our service</li>
              <li>Create and manage your account</li>
              <li>
                Display your public profile when you choose to make it public
              </li>
              <li>Communicate with you about service updates and support</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations</li>
              <li>Analyze usage patterns to improve user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Information Sharing and Disclosure
            </h2>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              Public Profiles
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Public and Unlisted profiles are accessible to anyone on the
              internet through their username URL. Their enabled public features
              include contact, PDF export, approved testimonials, visible
              project images, and analytics.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              Unlisted Profiles
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Unlisted profiles are not access-controlled or confidential. We
              exclude them from the in-app directory and ask search engines not
              to index them, but robots directives are advisory. Search engines
              and other third parties may retain content that was shared or
              cached.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              Passcode Profiles
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Passcode mode reduces casual access and keeps profiles out of the
              directory and search indexing. It cannot prevent an authorized
              recipient from resharing, downloading, or capturing profile
              content. Testimonial recommendation links are separate capability
              links and are not protected by the profile passcode.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              Service Providers
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              We may share information with third-party service providers who
              help us operate our service, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Hosting and infrastructure providers (Vercel, Convex)</li>
              <li>Authentication services</li>
              <li>Analytics providers</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              Legal Requirements
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              We may disclose your information if required by law, legal
              process, or to protect the rights, property, or safety of
              OpenCV.app, our users, or others.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              Business Transfers
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              In the event of a merger, acquisition, or sale of assets, your
              information may be transferred to the acquiring entity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Data Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to
              protect your information, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication mechanisms</li>
              <li>Regular security assessments</li>
              <li>Access controls and monitoring</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              However, no method of transmission over the internet is 100%
              secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Your Rights and Choices
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access and update your profile information at any time</li>
              <li>
                Control your profile's access mode (Private, Passcode, Unlisted,
                or Public)
              </li>
              <li>Delete your account and associated data</li>
              <li>Request a copy of your data</li>
              <li>Opt out of non-essential communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Data Retention
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your information for as long as your account is active
              or as needed to provide services. Raw profile analytics are
              deleted after 90 days in bounded batches and do not store IP
              addresses. When you delete your account, we will delete or
              anonymize your data, except where we are required to retain it for
              legal or legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Cookies and Tracking
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to maintain your session,
              remember your preferences, and analyze usage patterns. You can
              control cookies through your browser settings, though this may
              affect functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Children&apos;s Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our service is not intended for users under 13 years of age. We do
              not knowingly collect information from children under 13. If we
              become aware of such collection, we will delete the information
              promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              International Data Transfers
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries
              other than your country of residence. We ensure appropriate
              safeguards are in place to protect your data in compliance with
              applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Changes to This Privacy Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of significant changes by posting a notice on our
              service or updating the "Last updated" date. Your continued use
              after changes indicates acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions or concerns about this Privacy Policy or our
              data practices, please contact us through our support channels.
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
