import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.PROPERTIES);
      setProperties(response.data);
    } catch (error) {
      setError('Error fetching properties');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const landlordBenefits = [
    {
      title: "Guaranteed Rent Payments",
      description: "Enjoy peace of mind with guaranteed rental income — even if your tenant delays or defaults on payment.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "End-to-End Property Management",
      description: "From listing and lease signing to repairs and evictions, you get the platform to manage the full rental lifecycle.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: "Pre-Screened, Scored Tenants",
      description: "Save time and reduce risk with AI-powered tenant scoring based on verified documents and financial profiles.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  const tenantBenefits = [
    {
      title: "Fair & Fast Application Process",
      description: "Apply once and get matched with suitable properties using your personalized tenant score.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: "Boost Your Credit Score",
      description: "On-time rent payments tracked through our platform can help improve your credit profile (via credit bureau integration).",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      title: "Direct Communication & Support",
      description: "Easily connect with landlords and get help with maintenance or legal matters through our built-in support system.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="relative min-h-screen">
        {/* Full-screen background image */}
        <div className="absolute inset-0">
          <img
            src="/images/hero-property2.png"
            alt="Modern property"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        
        {/* Content overlay */}
        <div className="relative">
          <div className="container mx-auto px-6 lg:px-8 py-24 sm:py-32">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 max-w-2xl">
              <h1 className="text-[3.5rem] font-bold leading-[1.1] tracking-tight text-gray-900">
                Rent Smarter. Live Easier.
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Like a real estate agent, but for your rental property.
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
              RentRight connects landlords and tenants with guaranteed payments, AI-powered screening, and full-service rental management — all in one platform.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Link
                  to="/register"
                  className="rounded-md bg-primary-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  Get Started
                </Link>
                
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Split Benefits Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Why Choose RentRight?
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
            Experience the future of rental management with our comprehensive platform designed for both landlords and tenants.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:grid-rows-1">
          {/* Landlord Section */}
          <div className="group relative h-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-primary-400 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50 rounded-3xl p-10 shadow-xl border border-primary-100 hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
              <div className="absolute top-0 right-0 -mt-4 -mr-4">
                <div className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  For Landlords
                </div>
              </div>
              
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl shadow-lg mb-6">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
                  Landlord Solutions
                </h3>
                <p className="text-lg text-gray-600">
                  Streamline your property management and maximize returns
                </p>
              </div>
              
              <div className="space-y-8 flex-1">
                {landlordBenefits.map((benefit, index) => (
                  <div key={benefit.title} className="group/item flex items-start gap-6 p-6 rounded-2xl bg-white/60 hover:bg-white/80 transition-all duration-300 hover:shadow-lg border border-primary-100/50">
                    <div className="flex-shrink-0">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                        {benefit.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2 group-hover/item:text-primary-700 transition-colors duration-300">
                        {benefit.title}
                      </h4>
                      <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 text-center">
                <Link
                  to="/landlord-benefits"
                  className="inline-flex items-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  Explore Landlord Features
                  <svg className="ml-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Tenant Section */}
          <div className="group relative h-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-gray-600 to-gray-400 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-3xl p-10 shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
              <div className="absolute top-0 right-0 -mt-4 -mr-4">
                <div className="bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  For Tenants
                </div>
              </div>
              
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-500 rounded-2xl shadow-lg mb-6">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
                  Tenant Benefits
                </h3>
                <p className="text-lg text-gray-600">
                  Find your perfect home with ease and convenience
                </p>
              </div>
              
              <div className="space-y-8 flex-1">
                {tenantBenefits.map((benefit, index) => (
                  <div key={benefit.title} className="group/item flex items-start gap-6 p-6 rounded-2xl bg-white/60 hover:bg-white/80 transition-all duration-300 hover:shadow-lg border border-gray-200/50">
                    <div className="flex-shrink-0">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                        {benefit.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2 group-hover/item:text-gray-700 transition-colors duration-300">
                        {benefit.title}
                      </h4>
                      <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 text-center">
                <Link
                  to="/tenant-benefits"
                  className="inline-flex items-center rounded-xl bg-gradient-to-r from-gray-600 to-gray-500 px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                >
                  Explore Tenant Benefits
                  <svg className="ml-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 