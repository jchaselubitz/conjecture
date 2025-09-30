import Link from 'next/link';

import SiteNav from '@/components/navigation/site_nav';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2D1810] mb-4">Terms of Service</h1>
          <p className="text-[#4A4A4A]">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Agreement to Terms</h2>
              <p className="text-[#4A4A4A] leading-relaxed">
                By accessing and using Conjecture, you agree to be bound by these Terms of Service
                and all applicable laws and regulations. If you do not agree with any of these
                terms, you are prohibited from using or accessing this site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Platform Purpose</h2>
              <p className="text-[#4A4A4A] leading-relaxed">
                Conjecture is a platform designed for civilized debate and intellectual discourse.
                Our mission is to provide a space where thoughtful individuals can share ideas,
                engage in meaningful discussions, and explore diverse perspectives in a respectful
                environment.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">User Responsibilities</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium text-[#2D1810] mb-2">
                    Respectful Communication
                  </h3>
                  <p className="text-[#4A4A4A] leading-relaxed">
                    All users must engage in respectful, civil discourse. Personal attacks,
                    harassment, hate speech, or any form of abusive behavior is strictly prohibited.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-[#2D1810] mb-2">Original Content</h3>
                  <p className="text-[#4A4A4A] leading-relaxed">
                    Users are responsible for ensuring their content is original or properly
                    attributed. Plagiarism and copyright infringement are not tolerated.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-[#2D1810] mb-2">Accurate Information</h3>
                  <p className="text-[#4A4A4A] leading-relaxed">
                    While we encourage diverse perspectives and opinions, users should strive to
                    provide accurate information and distinguish between facts and opinions.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Prohibited Content</h2>
              <p className="text-[#4A4A4A] leading-relaxed mb-4">
                The following types of content are prohibited on our platform:
              </p>
              <div className="space-y-2">
                <p className="text-[#4A4A4A] leading-relaxed">
                  • Hate speech, discrimination, or harassment of any kind
                </p>
                <p className="text-[#4A4A4A] leading-relaxed">
                  • Spam, advertising, or promotional content
                </p>
                <p className="text-[#4A4A4A] leading-relaxed">
                  • Illegal content or content that promotes illegal activities
                </p>
                <p className="text-[#4A4A4A] leading-relaxed">
                  • Misinformation or intentionally false information
                </p>
                <p className="text-[#4A4A4A] leading-relaxed">
                  • Content that violates intellectual property rights
                </p>
                <p className="text-[#4A4A4A] leading-relaxed">
                  • Explicit or inappropriate content
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Content Moderation</h2>
              <p className="text-[#4A4A4A] leading-relaxed">
                We reserve the right to moderate content and remove posts or comments that violate
                our community guidelines. We may also suspend or terminate accounts that repeatedly
                violate these terms. Our moderation decisions are final.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Intellectual Property</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium text-[#2D1810] mb-2">Your Content</h3>
                  <p className="text-[#4A4A4A] leading-relaxed">
                    You retain ownership of the content you create and post on our platform. By
                    posting content, you grant us a license to display, distribute, and promote your
                    content as part of our platform.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-[#2D1810] mb-2">Platform Content</h3>
                  <p className="text-[#4A4A4A] leading-relaxed">
                    The Conjecture platform, including its design, functionality, and original
                    content, is protected by intellectual property laws and remains our property.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Privacy</h2>
              <p className="text-[#4A4A4A] leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy to understand how
                we collect, use, and protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Account Termination</h2>
              <p className="text-[#4A4A4A] leading-relaxed">
                You may terminate your account at any time by contacting us. We may also terminate
                your account if you violate these terms. Upon termination, your access to the
                platform will be revoked, though your content may remain visible according to our
                data retention policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Disclaimers</h2>
              <p className="text-[#4A4A4A] leading-relaxed">
                {`Conjecture is provided "as is" without warranties of any kind. We do not guarantee
                the accuracy, completeness, or reliability of user-generated content. Users are
                responsible for their own content and interactions on the platform.`}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">
                Limitation of Liability
              </h2>
              <p className="text-[#4A4A4A] leading-relaxed">
                To the maximum extent permitted by law, Conjecture shall not be liable for any
                indirect, incidental, special, or consequential damages arising from your use of the
                platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Changes to Terms</h2>
              <p className="text-[#4A4A4A] leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of
                significant changes through our platform. Continued use of the service after changes
                constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Governing Law</h2>
              <p className="text-[#4A4A4A] leading-relaxed">
                These terms are governed by applicable laws and any disputes will be resolved
                through appropriate legal channels.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Contact Information</h2>
              <p className="text-[#4A4A4A] leading-relaxed">
                If you have questions about these terms or need to report violations, please contact
                us through our platform or email us directly.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/"
            className="inline-flex items-center text-[#C26033] hover:text-[#A74D29] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
