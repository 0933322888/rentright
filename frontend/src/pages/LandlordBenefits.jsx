import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function LandlordBenefits() {
  const benefitsRef = useRef([]);

  const benefits = [
    {
      id: 1,
      title: "Smart Property Management",
      description: "Take control of your rental properties with our comprehensive management tools. From automated rent collection and maintenance tracking to tenant screening and digital lease signing, our platform streamlines every aspect of property management. Save valuable time and reduce administrative overhead with our intuitive dashboard.",
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      image: "/images/benefits/smart-management.jpg",
      features: [
        "Automated rent collection and late fee calculation",
        "Digital lease signing and document management",
        "Maintenance request tracking and vendor management",
        "Tenant screening and application processing",
        "Financial reporting and analytics"
      ]
    },
    {
      id: 2,
      title: "Financial Optimization",
      description: "Maximize your rental income with data-driven insights and financial tools. Our platform provides market analysis, competitive pricing recommendations, and comprehensive financial tracking to help you make informed decisions and optimize your returns.",
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      image: "/images/benefits/financial-optimization.jpg",
      features: [
        "Market rent analysis and pricing recommendations",
        "Expense tracking and categorization",
        "Tax preparation assistance",
        "ROI calculations and forecasting",
        "Cash flow monitoring"
      ]
    },
    {
      id: 3,
      title: "Legal Compliance & Protection",
      description: "Stay compliant with local rental laws and protect your investments. Our platform keeps you updated on legal requirements, provides standardized legal documents, and helps you maintain proper documentation for all your properties.",
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
      image: "/images/benefits/legal-compliance.jpg",
      features: [
        "State-specific lease agreements",
        "Legal document templates and generation",
        "Compliance checklist and reminders",
        "Eviction process guidance",
        "Record keeping and documentation"
      ]
    },
    {
      id: 4,
      title: "Tenant Communication Hub",
      description: "Build better relationships with your tenants through our centralized communication platform. Handle maintenance requests, announcements, and document sharing efficiently while maintaining a professional record of all interactions.",
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      image: "/images/benefits/communication-hub.jpg",
      features: [
        "In-app messaging system",
        "Maintenance request management",
        "Automated notifications and reminders",
        "Document sharing and e-signing",
        "Announcement broadcasts"
      ]
    },
    {
      id: 5,
      title: "Marketing & Listing Tools",
      description: "Fill vacancies faster with our powerful marketing and listing tools. Create professional property listings, schedule viewings, and manage applications all in one place. Reach qualified tenants through our platform and partner networks.",
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      image: "/images/benefits/marketing-tools.jpg",
      features: [
        "Professional listing creation tools",
        "Virtual tour integration",
        "Automated showing scheduler",
        "Application management system",
        "Multi-platform listing syndication"
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
      <div className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Why Choose RentRight?
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Discover how our comprehensive platform empowers landlords to manage properties efficiently, 
              maximize returns, and grow their rental business.
            </p>
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
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white">
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
                        <svg className="h-6 w-6 flex-none text-primary-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <div className="bg-primary-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to try new experience of being a landlord?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Join us and we will be your lifelong partner. 
            </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/register"
                className="rounded-md bg-primary-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Get Started
              </Link>
              <Link to="/contact" className="text-base font-semibold leading-6 text-gray-900">
                Questions? Contact Us →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 