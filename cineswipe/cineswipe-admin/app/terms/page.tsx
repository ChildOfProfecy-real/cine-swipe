import Link from 'next/link';

export default function TermsOfService() {
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
                <h1 className="text-4xl font-extrabold text-white mb-4">Terms of Service</h1>
                <p className="text-sm text-gray-500 mb-8">Last updated: June 6, 2026</p>

                {/* Content */}
                <div className="space-y-6 leading-relaxed">
                    <p>
                        Welcome to CineSwipe! These Terms of Service ("Terms") govern your use of the CineSwipe mobile application and related services. By accessing or using our services, you agree to be bound by these Terms.
                    </p>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white mt-6">1. Acceptance of Terms</h2>
                        <p>
                            By creating an account, subscribing, or using the CineSwipe application, you signify that you have read, understood, and agreed to be bound by these Terms, as well as our Privacy Policy.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white mt-6">2. Eligibility and Registration</h2>
                        <p>
                            You must be at least 13 years old to use CineSwipe. You agree to provide accurate information when registering an account, and you are responsible for maintaining the confidentiality of your password and credentials.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white mt-6">3. Subscriptions and Payments (Razorpay)</h2>
                        <p>
                            CineSwipe offers a Freemium model. Free tier users are limited to 7 clips per movie. You can upgrade to CineSwipe Premium for ₹50/month to unlock unlimited video clips.
                        </p>
                        <ul className="list-disc list-inside pl-4 space-y-1">
                            <li><strong>Billing:</strong> Premium is billed as a recurring monthly subscription through Razorpay. Payments are processed in Indian Rupees (INR).</li>
                            <li><strong>Cancellation:</strong> You can cancel your subscription at any time. When cancelled, your access to CineSwipe Premium remains active until the end of your current billing period, after which it reverts to the Free tier.</li>
                            <li><strong>Refunds:</strong> Subscriptions are non-refundable except where required by local laws or Razorpay transaction terms.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white mt-6">4. Intellectual Property and Acceptable Use</h2>
                        <p>
                            All video clips, metadata, thumbnails, layouts, and logos on CineSwipe are the intellectual property of CineSwipe or its content partners.
                        </p>
                        <p>
                            You agree not to scrape, download, distribute, reproduce, or modify the video clips or any other contents of the CineSwipe application without explicit written consent.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white mt-6">5. Limitation of Liability</h2>
                        <p>
                            CineSwipe is provided "as is" and "as available". We do not warrant that the application will be completely error-free, uninterrupted, or that the video player will function on all devices. In no event shall CineSwipe or its developers be liable for any indirect or consequential damages arising from app use.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white mt-6">6. Governing Law</h2>
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white mt-6">7. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms of Service, please contact us at: <span className="text-[#E50914]">support@cineswipe.com</span>.
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
