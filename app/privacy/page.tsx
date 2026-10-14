import type { Metadata } from 'next';
import { LegalPage } from '@/components/landing/legal-page';

// Kept out of the repo: set SUPPORT_EMAIL in the environment.
const supportEmail = process.env.SUPPORT_EMAIL;

export const metadata: Metadata = {
  title: 'Privacy Policy',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="Last updated: October 14, 2026">
      <section>
        <h2>Introduction</h2>
        <p>
          This policy explains what OpenCV.app collects when you build and host
          a profile with us, how we use it, and how you can remove it.
        </p>
      </section>

      <section>
        <h2>Information We Collect</h2>

        <h3>Account Information</h3>
        <ul>
          <li>Your email address</li>
          <li>One-time sign-in codes we email you, which expire after use</li>
          <li>
            A hashed password, only for accounts created before email codes
          </li>
          <li>Session tokens that keep you signed in</li>
        </ul>

        <h3>Profile Information</h3>
        <p>You choose what goes on your profile, which may include:</p>
        <ul>
          <li>Your username, name, headline, location, and contact links</li>
          <li>A bio, work experience, education, and certifications</li>
          <li>Skills, languages, projects, awards, and exhibitions</li>
          <li>Testimonials you approve</li>
          <li>A profile photo and any project images you upload</li>
        </ul>

        <h3>Testimonials</h3>
        <p>
          When someone writes a testimonial from a request link, we store their
          name, email, optional title and company, how they know the profile
          owner, and what they wrote. The owner sees all of it; their profile
          shows everything except the email, and only after the owner approves
          it. Request links expire after 7 days and work once.
        </p>

        <h3>Profile Analytics</h3>
        <p>
          When a visitor opens a profile and agrees to analytics, we record the
          view along with the referring site&apos;s hostname, any campaign (UTM)
          tags in the link, a device category (mobile, tablet, or desktop), and
          a two-letter country code. If they decline, we record nothing. We also
          count PDF downloads. We never store IP addresses.
        </p>

        <h3>Site Analytics</h3>
        <p>
          On OpenCV.app&apos;s own pages, such as the home page, sign-in, and
          these policies, we use Vercel Web Analytics to count visits, the
          referring site, and the visitor&apos;s country and device type. It
          doesn&apos;t use cookies or store IP addresses. It doesn&apos;t run on
          profiles.
        </p>
      </section>

      <section>
        <h2>How We Use Your Information</h2>
        <ul>
          <li>To run your account and sign you in</li>
          <li>
            To show your profile to the people you choose to share it with
          </li>
          <li>To send sign-in codes and, rarely, important service notices</li>
          <li>To keep the service secure and prevent abuse</li>
          <li>To meet legal obligations</li>
        </ul>
        <p>We don&apos;t sell your information or use it for advertising.</p>
      </section>

      <section>
        <h2>Who Can See Your Profile</h2>
        <p>You control this with your profile&apos;s access setting:</p>
        <ul>
          <li>
            <strong>Private:</strong> only you, while signed in.
          </li>
          <li>
            <strong>Passcode:</strong> anyone with the link and passcode. We ask
            search engines not to index it.
          </li>
          <li>
            <strong>Unlisted:</strong> anyone with the link. We ask search
            engines not to index it.
          </li>
          <li>
            <strong>Public:</strong> anyone. Search engines may index it.
          </li>
        </ul>
        <p>
          Asking search engines not to index a page is a request, not a
          guarantee. Anyone who can see your profile can also download, copy, or
          reshare it, and third parties may keep copies we can&apos;t remove.
        </p>
      </section>

      <section>
        <h2>Service Providers</h2>
        <p>We rely on a few providers to run OpenCV.app:</p>
        <ul>
          <li>Vercel, which hosts the website and counts site visits</li>
          <li>Convex, which stores your account, profile, and uploads</li>
          <li>Resend, which delivers sign-in emails</li>
        </ul>
        <p>
          We may also disclose information when the law requires it, or to a
          buyer if OpenCV.app is ever sold or merged, under this policy.
        </p>
      </section>

      <section>
        <h2>Data Security</h2>
        <p>
          Data is encrypted in transit, and our providers encrypt it at rest.
          Only you can edit your profile. Every request for a private or
          passcode profile is checked on our servers. No system is perfectly
          secure, so we can&apos;t guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>Your Choices</h2>
        <ul>
          <li>Edit or remove anything on your profile at any time</li>
          <li>Change who can see your profile at any time</li>
          <li>Delete your account from the account menu in the editor</li>
          <li>Ask us for a copy of your data</li>
        </ul>
      </section>

      <section>
        <h2>Data Retention</h2>
        <p>
          We keep your account, profile, and profile analytics while your
          account exists. When you delete your account, we delete your profile,
          testimonials, uploaded images, analytics, and sign-in data. Deletion
          starts right away and runs in the background. We keep information
          longer only when the law requires it.
        </p>
      </section>

      <section>
        <h2>Cookies and Local Storage</h2>
        <p>
          We use cookies and your browser&apos;s local storage to keep you
          signed in, remember your light or dark theme, and remember a
          visitor&apos;s analytics choice. We don&apos;t use advertising cookies
          or third-party trackers.
        </p>
      </section>

      <section>
        <h2>Children&apos;s Privacy</h2>
        <p>
          OpenCV.app isn&apos;t meant for anyone under 13, and we don&apos;t
          knowingly collect their information. If we learn that we have, we
          delete it.
        </p>
      </section>

      <section>
        <h2>International Data Transfers</h2>
        <p>
          Our providers may store and process your information outside your
          country.
        </p>
      </section>

      <section>
        <h2>Changes to This Policy</h2>
        <p>
          When we change this policy, we update the date at the top and post a
          notice on the site for significant changes.
        </p>
      </section>

      <section>
        <h2>Contact Us</h2>
        <p>
          Questions about this policy, or want a copy of your data? Email{' '}
          {supportEmail ? (
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          ) : (
            <a href="https://github.com/sean35mm/cv-builder/issues">
              open an issue on GitHub
            </a>
          )}
          .
        </p>
      </section>
    </LegalPage>
  );
}
