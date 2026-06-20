import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-black text-gray-300 font-sans px-6 py-12 md:py-20">
            <div className="max-w-3xl mx-auto">
                {/* Logo / Header */}
                <div className="border-b border-gray-800 pb-8 mb-8 flex justify-between items-center">
                    <span className="text-2xl font-bold tracking-tight text-white">
                        Cine<span className="text-[#E50914]">Swipe</span>
                    </span>
                    <Link href="/" className="text-sm text-gray-500 hover:text-white transition">
                        Back to Home
                    </Link>
                </div>

                {/* Title */}
                <h1 className="text-4xl font-extrabold text-white mb-4">Privacy Policy</h1>
                <p className="text-sm text-gray-500 mb-8">Last updated: June 6, 2026</p>

                {/* Content */}
                <div className="space-y-6 leading-relaxed">
                    <p>
                        At CineSwipe, we are committed to protecting your privacy. This Privacy Policy describes how we collect, use, and share information about you when you use our mobile application and related services.
                    </p>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white mt-6">1. Information We Collect</h2>
                        <p>
                            We collect information you provide directly to us when you create an account, log in, or interact with our services. This includes:
                        </p>
                        <ul className="list-disc list-inside pl-4 space-y-1">
                            <li><strong>Account Data:</strong> Name, email address, password.</li>
                            <li><strong>Usage Data:</strong> Likes, watchlist, watch history, and progress.</li>
                            <li><strong>Payment Data:</strong> When you purchase a subscription, transactions are processed by Razorpay. We do not store your raw payment details (such as credit card numbers) on our servers; they are processed securely by Razorpay.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white mt-6">2. How We Use Your Information</h2>
                        <p>We use the collected data to provide, maintain, and improve our services, including to:</p>
                        <ul className="list-disc list-inside pl-4 space-y-1">
                            <li>Authenticate your account and grant access to CineSwipe Premium content.</li>
                            <li>Save your watch progress so you can resume video playback from where you left off.</li>
                            <li>Optimize the recommendations and personalize your video feed.</li>
                            <li>Send password reset emails via Resend.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white mt-6">3. Data Sharing and Third Parties</h2>
                        <p>
                            We do not sell your personal data. We share information only with trusted third-party service providers who assist us in operating our platform:
                        </p>
                        <ul className="list-disc list-inside pl-4 space-y-1">
                            <li><strong>Supabase:</strong> For database hosting, authentication, and file storage.</li>
                            <li><strong>Razorpay:</strong> For secure payment gateway operations.</li>
                            <li><strong>Resend:</strong> For dispatching transactional emails (e.g. password resets).</li>
                            <li><strong>Sentry:</strong> For real-time application crash reporting and diagnostics.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white mt-6">4. Your Rights (Account Deletion)</h2>
                        <p>
                            You have the right to access, update, or delete your personal information. Under GDPR and app store guidelines, we provide a complete account deletion option:
                        </p>
                        <p>
                            To permanently delete your account, navigate to the **Settings** screen inside the CineSwipe mobile app, scroll down to the **Danger Zone**, click **Delete Account**, and enter your password. Once confirmed, all your profile details, watch history, likes, and subscription records will be immediately and permanently removed from our databases.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white mt-6">5. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. If we make changes, we will notify you by updating the "Last updated" date at the top of this policy.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white mt-6">6. Contact Us</h2>
                        <p>
                            If you have any questions or concerns about this Privacy Policy, please contact us at: <span className="text-[#E50914]">support@cineswipe.com</span>.
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-800 mt-12 pt-8 text-center text-xs text-gray-600">
                    &copy; 2026 CineSwipe. All rights reserved.
                </div>
            </div>
        </div>
    );
}
