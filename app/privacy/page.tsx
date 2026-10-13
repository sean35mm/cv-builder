import { LegalPage } from '@/components/landing/legal-page';

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="Last updated: July 16, 2026">
      <section>
        <h2>Introduction</h2>
        <p>
          At OpenCV.app, we take your privacy seriously. This Privacy Policy
          explains how we collect, use, disclose, and safeguard your information
          when you use our CV building and hosting service.
        </p>
      </section>

      <section>
        <h2>Information We Collect</h2>

        <h3>Account Information</h3>
        <p>When you create an account, we collect:</p>
        <ul>
          <li>Email address</li>
          <li>Username</li>
          <li>Password (encrypted)</li>
          <li>Authentication tokens</li>
        </ul>

        <h3>Profile Information</h3>
        <p>
          You choose what information to include in your CV, which may include:
        </p>
        <ul>
          <li>Personal information (name, contact details, location)</li>
          <li>Professional summary and bio</li>
          <li>Work experience and employment history</li>
          <li>Education and certifications</li>
          <li>Skills and competencies</li>
          <li>Projects, awards, and exhibitions</li>
          <li>Social media links</li>
        </ul>

        <h3>Usage Information</h3>
        <p>We automatically collect:</p>
        <ul>
          <li>Consent-based profile views and PDF download counts</li>
          <li>Coarse device category and trusted two-letter country code</li>
          <li>
            Referrer hostname and bounded UTM campaign values without query
            parameters
          </li>
        </ul>
      </section>

      <section>
        <h2>AI Writing</h2>
        <p>
          AI writing is disabled by default. When enabled and you explicitly
          request a draft, the configured provider receives only the visible
          profile text fields you selected and the job description. We omit
          contact details, email, social identifiers, media, private metadata,
          and imported source files. OpenCV does not persist the prompt or
          draft; you must review and explicitly apply or copy it.
        </p>
      </section>

      <section>
        <h2>How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide, maintain, and improve our service</li>
          <li>Create and manage your account</li>
          <li>Display your public profile when you choose to make it public</li>
          <li>Communicate with you about service updates and support</li>
          <li>Ensure security and prevent fraud</li>
          <li>Comply with legal obligations</li>
          <li>Analyze usage patterns to improve user experience</li>
        </ul>
      </section>

      <section>
        <h2>Information Sharing and Disclosure</h2>

        <h3>Public Profiles</h3>
        <p>
          Public and Unlisted profiles are accessible to anyone on the internet
          through their username URL. Their enabled public features include
          contact, PDF export, approved testimonials, visible project images,
          and analytics.
        </p>

        <h3>Unlisted Profiles</h3>
        <p>
          Unlisted profiles are not access-controlled or confidential. We
          exclude them from the in-app directory and ask search engines not to
          index them, but robots directives are advisory. Search engines and
          other third parties may retain content that was shared or cached.
        </p>

        <h3>Passcode Profiles</h3>
        <p>
          Passcode mode reduces casual access and keeps profiles out of the
          directory and search indexing. It cannot prevent an authorized
          recipient from resharing, downloading, or capturing profile content.
          Testimonial recommendation links are separate capability links and are
          not protected by the profile passcode.
        </p>

        <h3>Service Providers</h3>
        <p>
          We may share information with third-party service providers who help
          us operate our service, including:
        </p>
        <ul>
          <li>Hosting and infrastructure providers (Vercel, Convex)</li>
          <li>Authentication services</li>
          <li>Analytics providers</li>
        </ul>

        <h3>Legal Requirements</h3>
        <p>
          We may disclose your information if required by law, legal process, or
          to protect the rights, property, or safety of OpenCV.app, our users,
          or others.
        </p>

        <h3>Business Transfers</h3>
        <p>
          In the event of a merger, acquisition, or sale of assets, your
          information may be transferred to the acquiring entity.
        </p>
      </section>

      <section>
        <h2>Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to
          protect your information, including:
        </p>
        <ul>
          <li>Encryption of data in transit and at rest</li>
          <li>Secure authentication mechanisms</li>
          <li>Regular security assessments</li>
          <li>Access controls and monitoring</li>
        </ul>
        <p>
          However, no method of transmission over the internet is 100% secure.
          We cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>Your Rights and Choices</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access and update your profile information at any time</li>
          <li>
            Control your profile's access mode (Private, Passcode, Unlisted, or
            Public)
          </li>
          <li>Delete your account and associated data</li>
          <li>Request a copy of your data</li>
          <li>Opt out of non-essential communications</li>
        </ul>
      </section>

      <section>
        <h2>Data Retention</h2>
        <p>
          We retain your information for as long as your account is active or as
          needed to provide services. Raw profile analytics are deleted after 90
          days in bounded batches and do not store IP addresses. When you delete
          your account, we will delete or anonymize your data, except where we
          are required to retain it for legal or legitimate business purposes.
        </p>
      </section>

      <section>
        <h2>Cookies and Tracking</h2>
        <p>
          We use cookies and similar technologies to maintain your session,
          remember your preferences, and analyze usage patterns. You can control
          cookies through your browser settings, though this may affect
          functionality.
        </p>
      </section>

      <section>
        <h2>Children&apos;s Privacy</h2>
        <p>
          Our service is not intended for users under 13 years of age. We do not
          knowingly collect information from children under 13. If we become
          aware of such collection, we will delete the information promptly.
        </p>
      </section>

      <section>
        <h2>International Data Transfers</h2>
        <p>
          Your information may be transferred to and processed in countries
          other than your country of residence. We ensure appropriate safeguards
          are in place to protect your data in compliance with applicable laws.
        </p>
      </section>

      <section>
        <h2>Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of significant changes by posting a notice on our service or
          updating the "Last updated" date. Your continued use after changes
          indicates acceptance of the updated policy.
        </p>
      </section>

      <section>
        <h2>Contact Us</h2>
        <p>
          If you have questions or concerns about this Privacy Policy or our
          data practices, please contact us through our support channels.
        </p>
      </section>
    </LegalPage>
  );
}
