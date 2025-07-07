export default function About() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            About Our Rental Service
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            We connect landlords with tenants, making the rental process simple and efficient. Our platform provides a seamless experience for both property owners and renters.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <svg
                  className="h-6 w-6 flex-none text-primary-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Guaranteed Income Protection
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">
                  Landlords receive guaranteed income protection of up to 12 months in case tenants default on their rent payments, ensuring financial security.
                </p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <svg
                  className="h-6 w-6 flex-none text-primary-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.93 1.31a41.401 41.401 0 0110.14 0C16.194 1.45 17 2.414 17 3.517V18.25a.75.75 0 01-1.075.676l-2.8-1.344-2.8 1.344a.75.75 0 01-.65 0l-2.8-1.344-2.8 1.344A.75.75 0 013 18.25V3.517c0-1.103.806-2.068 1.93-2.207z"
                    clipRule="evenodd"
                  />
                </svg>
                Legal Assistance
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">
                  We provide comprehensive legal assistance and support for landlords dealing with eviction cases and other legal matters.
                </p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <svg
                  className="h-6 w-6 flex-none text-primary-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z"
                    clipRule="evenodd"
                  />
                </svg>
                Easy Property Management
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">
                  Landlords can easily list their properties, manage applications, and communicate with potential tenants all in one place.
                </p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <svg
                  className="h-6 w-6 flex-none text-primary-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                    clipRule="evenodd"
                  />
                </svg>
                Secure Platform
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">
                  We prioritize security and privacy, ensuring that all transactions and communications are protected and confidential.
                </p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <svg
                  className="h-6 w-6 flex-none text-primary-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                    clipRule="evenodd"
                  />
                </svg>
                Streamlined Process
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">
                  Our platform streamlines the rental process, making it easier for tenants to find and apply for properties that match their needs.
                </p>
              </dd>
            </div>
          </dl>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
            <div className="flex flex-col">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                For Landlords
              </dt>
              <dd className="mt-2 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">
                  List your properties, manage applications, and communicate with potential tenants all in one place. Our platform helps you find the perfect tenant for your property.
                </p>
                <p className="mt-6">
                  <a href="/register" className="text-sm font-semibold leading-6 text-primary-600">
                    Become a Landlord <span aria-hidden="true">→</span>
                  </a>
                </p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                For Tenants
              </dt>
              <dd className="mt-2 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">
                  Browse through our extensive collection of properties, apply for rentals, and communicate with landlords directly. Find your perfect home with ease.
                </p>
                <p className="mt-6">
                  <a href="/register" className="text-sm font-semibold leading-6 text-primary-600">
                    Find Your Home <span aria-hidden="true">→</span>
                  </a>
                </p>
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 