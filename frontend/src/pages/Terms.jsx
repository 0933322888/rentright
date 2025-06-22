import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Terms and Conditions
            </h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using RentRight ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                RentRight is a property rental platform that connects landlords and tenants. The Service provides tools for property listing, application management, lease agreements, and communication between parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <div className="text-gray-700 mb-4 space-y-2">
                <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times.</p>
                <p>You are responsible for safeguarding the password and for all activities that occur under your account.</p>
                <p>You agree not to disclose your password to any third party.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Landlord Responsibilities</h2>
              <div className="text-gray-700 mb-4 space-y-2">
                <p>Landlords must provide accurate and truthful information about their properties.</p>
                <p>All property listings must comply with local, state, and federal laws.</p>
                <p>Landlords are responsible for maintaining their properties in safe and habitable conditions.</p>
                <p>Landlords must respond to tenant inquiries and applications in a timely manner.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Tenant Responsibilities</h2>
              <div className="text-gray-700 mb-4 space-y-2">
                <p>Tenants must provide accurate and truthful information in their applications.</p>
                <p>Tenants are responsible for paying rent and utilities as agreed upon in their lease.</p>
                <p>Tenants must maintain the property in good condition and report maintenance issues promptly.</p>
                <p>Tenants must comply with all terms of their lease agreement.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                We are committed to protecting your privacy. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Prohibited Uses</h2>
              <div className="text-gray-700 mb-4 space-y-2">
                <p>You may not use the Service for any unlawful purpose or to solicit others to perform unlawful acts.</p>
                <p>You may not violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances.</p>
                <p>You may not infringe upon or violate our intellectual property rights or the intellectual property rights of others.</p>
                <p>You may not harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate based on gender, sexual orientation, religion, ethnicity, race, age, national origin, or disability.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                In no event shall RentRight, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Dispute Resolution</h2>
              <p className="text-gray-700 mb-4">
                Any disputes arising from the use of this Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@rentright.com<br />
                  <strong>Phone:</strong> 1-800-RENT-RIGHT<br />
                  <strong>Address:</strong> 123 Main Street, Suite 100, City, State 12345
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <Link 
              to="/register" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 