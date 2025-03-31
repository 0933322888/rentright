import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function TenantBenefits() {
  const benefitsRef = useRef([]);

  const benefits = [
    {
      id: 1,
      title: "Smart Property Search",
      description: "Find your perfect home with our advanced search tools. Filter properties by location, price, amenities, and more. Our platform provides detailed listings with high-quality photos, virtual tours, and comprehensive property information to help you make informed decisions.",
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      image: "/images/benefits/property-search.jpg",
      features: [
        "Advanced search filters and map view",
        "Virtual tours and high-quality photos",
        "Detailed property descriptions",
        "Save favorite properties",
        "Price and availability alerts"
      ]
    },
    {
      id: 2,
      title: "Seamless Application Process",
      description: "Apply for multiple properties with a single profile. Our streamlined application process saves you time and effort. Submit documents, complete background checks, and track your application status all in one place.",
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      image: "/images/benefits/application-process.jpg",
      features: [
        "One-time profile creation",
        "Secure document upload",
        "Automated background checks",
        "Real-time application status",
        "Multi-property applications"
      ]
    },
    {
      id: 3,
      title: "Secure Rent Payments",
      description: "Manage your rent payments securely and conveniently. Set up automatic payments, split rent with roommates, and maintain a complete payment history. Our platform ensures your financial transactions are protected.",
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      image: "/images/benefits/secure-payments.jpg",
      features: [
        "Multiple payment methods",
        "Automatic rent reminders",
        "Split rent with roommates",
        "Payment history tracking",
        "Late fee prevention"
      ]
    },
    {
      id: 4,
      title: "Maintenance Management",
      description: "Submit and track maintenance requests with ease. Our platform allows you to report issues, attach photos, and communicate directly with property managers. Stay updated on the status of your requests in real-time.",
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      image: "/images/benefits/maintenance.jpg",
      features: [
        "Easy issue reporting",
        "Photo and video attachments",
        "Real-time status updates",
        "Direct communication channel",
        "Maintenance history log"
      ]
    },
    {
      id: 5,
      title: "Digital Lease Management",
      description: "Handle all your lease-related tasks digitally. From signing your lease to accessing important documents, our platform provides a secure and organized way to manage your rental agreement and related paperwork.",
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      image: "/images/benefits/lease-management.jpg",
      features: [
        "Digital lease signing",
        "Document storage and access",
        "Renewal reminders",
        "Move-in/out checklists",
        "Policy and rules access"
      ]
    }
  ];

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);

    const handleScroll = () => {
      benefitsRef.current.forEach((section) => {
        if (!section) return;
        
        const rect = section.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.75 && rect.bottom >= 0;
        
        if (isVisible) {
          section.classList.add('opacity-100', 'translate-y-0');
          section.classList.remove('opacity-0', 'translate-y-10');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Find Your Perfect Home
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Discover how RentRight makes your rental journey easier, from finding the perfect property
              to managing your tenancy with ease.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/properties"
                className="rounded-md bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Browse Properties
              </Link>
              <Link to="/register" className="text-base font-semibold leading-6 text-gray-900">
                Create Account →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Sections */}
      <div className="relative">
        {benefits.map((benefit, index) => (
          <div
            key={benefit.id}
            ref={(el) => (benefitsRef.current[index] = el)}
            className="py-16 sm:py-24 flex items-center transition-all duration-1000 opacity-0 translate-y-10"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className={`space-y-6 ${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
                        {benefit.icon}
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                      {benefit.title}
                    </h2>
                  </div>
                  <p className="text-lg text-gray-600">
                    {benefit.description}
                  </p>
                  <ul className="space-y-3">
                    {benefit.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <svg className="h-6 w-6 flex-none text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`relative ${index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-2xl bg-gray-100">
                    <img
                      src={benefit.image}
                      alt={benefit.title}
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="bg-blue-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to Find Your New Home?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Join thousands of happy tenants who found their perfect home through RentRight.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/register"
                className="rounded-md bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Create Free Account
              </Link>
              <Link to="/properties" className="text-base font-semibold leading-6 text-gray-900">
                View Properties →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 