import Link from 'next/link';

import SiteNav from '@/components/navigation/site_nav';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2D1810] mb-4">Privacy Policy</h1>
          <p className="text-[#4A4A4A]">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">
                Our Commitment to Privacy
              </h2>
              <p className="text-[#4A4A4A] leading-relaxed">
                At Conjecture, we believe in protecting your privacy while providing a meaningful
                platform for intellectual discourse. This privacy policy explains how we collect,
                use, and protect your information when you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium text-[#2D1810] mb-2">Account Information</h3>
                  <p className="text-[#4A4A4A] leading-relaxed">
                    When you create an account, we collect your email address and any profile
                    information you choose to provide, such as your name and bio. This information
                    is used solely to create and maintain your profile on our platform.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-[#2D1810] mb-2">Content You Create</h3>
                  <p className="text-[#4A4A4A] leading-relaxed">
                    We store the essays, comments, and other content you create on our platform.
                    This content is displayed publicly as part of our discussion platform, unless
                    you choose to make it private.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-[#2D1810] mb-2">
                    Usage Analytics (Privacy-Preserving)
                  </h3>
                  <p className="text-[#4A4A4A] leading-relaxed">
                    {`We use privacy-preserving analytics to understand how our platform is used. This
                    includes basic metrics like page views and feature usage, but does not include
                    tracking of individual user behavior or personal data collection beyond what's
                    necessary for the platform to function.`}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">
                How We Use Your Information
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium text-[#2D1810] mb-2">
                    Platform Functionality
                  </h3>
                  <p className="text-[#4A4A4A] leading-relaxed">
                    We use your information to provide our core services: creating and maintaining
                    your user profile, displaying your content on the platform, and facilitating
                    discussions between users.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-[#2D1810] mb-2">Direct Communication</h3>
                  <p className="text-[#4A4A4A] leading-relaxed">
                    We may use your email address to send you important notifications about your
                    account, responses to your content, or updates about our platform. We do not
                    send marketing emails or share your contact information with third parties.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-[#2D1810] mb-2">Platform Improvement</h3>
                  <p className="text-[#4A4A4A] leading-relaxed">
                    We use aggregated, anonymous analytics to understand how our platform is used
                    and to improve the user experience. This data is not linked to individual users.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Third-Party Sharing</h2>
              <p className="text-[#4A4A4A] leading-relaxed">
                We do not sell, rent, or share your personal information with third parties. Your
                data remains on our secure servers and is only accessible to our team for the
                purposes outlined in this privacy policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Data Security</h2>
              <p className="text-[#4A4A4A] leading-relaxed">
                We implement appropriate security measures to protect your personal information
                against unauthorized access, alteration, disclosure, or destruction. This includes
                encryption, secure servers, and regular security updates.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Your Rights</h2>
              <div className="space-y-3">
                <p className="text-[#4A4A4A] leading-relaxed">
                  • <strong>Access:</strong> You can view and update your profile information at any
                  time
                </p>
                <p className="text-[#4A4A4A] leading-relaxed">
                  • <strong>Delete:</strong> You can request deletion of your account and associated
                  data
                </p>
                <p className="text-[#4A4A4A] leading-relaxed">
                  • <strong>Control:</strong> You can edit or delete your content at any time
                </p>
                <p className="text-[#4A4A4A] leading-relaxed">
                  • <strong>Communication:</strong> You can unsubscribe from emails at any time
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Contact Us</h2>
              <p className="text-[#4A4A4A] leading-relaxed">
                If you have any questions about this privacy policy or how we handle your data,
                please contact us through our platform or email us directly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#2D1810] mb-4">Changes to This Policy</h2>
              <p className="text-[#4A4A4A] leading-relaxed">
                We may update this privacy policy from time to time. We will notify users of any
                significant changes through our platform or via email. Continued use of our service
                after changes constitutes acceptance of the updated policy.
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
