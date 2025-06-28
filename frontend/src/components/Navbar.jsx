import { Fragment, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import '../styles/navbar.css';
import logo from '../assets/RR_logo.png';
import { getProfilePictureUrl } from '../utils/imageUtils';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [hasApprovedApplication, setHasApprovedApplication] = useState(
    localStorage.getItem('hasApprovedApplication') === 'true'
  );

  useEffect(() => {
    const checkApprovedApplication = async () => {
      if (user?.role === 'tenant') {
        try {
          const response = await axios.get(API_ENDPOINTS.APPLICATIONS, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          const hasApproved = response.data.some(app => app.status === 'approved');
          setHasApprovedApplication(hasApproved);
          localStorage.setItem('hasApprovedApplication', hasApproved);
        } catch (error) {
          console.error('Error checking approved applications:', error);
        }
      } else {
        // Reset the state when user is not a tenant
        setHasApprovedApplication(false);
        localStorage.removeItem('hasApprovedApplication');
      }
    };

    // Only check when user changes or on initial load
    if (user) {
      checkApprovedApplication();
    }
  }, [user]);

  // Define navigation items based on user role
  const getNavigationItems = () => {
    if (!user) {
      return [
        { name: 'Home', href: '/' },
        { name: 'Properties', href: '/properties' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
      ];
    }

    if (user.role === 'admin') {
      return [
        { name: 'Properties', href: '/admin/properties' },
        { name: 'Landlords', href: '/admin/landlords' },
        { name: 'Tenants', href: '/admin/tenants' },
        { name: 'Applications', href: '/admin/applications' },
      ];
    }

    if (user.role === 'landlord') {
      return [
        { name: 'Dashboard', href: '/landlord-dashboard' },
        { name: 'My Properties', href: '/my-properties' },
        { name: 'Contact', href: '/contact' },

      ];
    }

    // Tenant navigation
    const tenantItems = [
      { name: 'Dashboard', href: '/tenant-dashboard' },
      { name: 'My Lease', href: '/my-lease', show: hasApprovedApplication },
      { name: 'Properties', href: '/properties' },
      { name: 'My Applications', href: '/applications' }
    ].filter(item => !item.hasOwnProperty('show') || item.show);

    return tenantItems;
  };

  const navigationItems = getNavigationItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Disclosure as="nav" className="bg-gradient-to-r from-white to-gray-50 shadow-lg border-b border-gray-100 w-full sticky top-0 z-50">
      {({ open }) => (
        <>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 justify-between items-center">
              <div className="flex items-center">
                <div className="flex flex-shrink-0 items-center">
                  <img src={logo} alt="RentRight Logo" className="w-10 h-8 object-contain" />
                  <Link 
                    to="/" 
                    className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent hover:from-primary-700 hover:to-primary-800 transition-all duration-300 navbar-link flex items-center"
                  >
                    RentRight
                  </Link>
                </div>
                <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={classNames(
                        location.pathname === item.href
                          ? 'bg-primary-50 text-primary-700 border-primary-500 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent',
                        'inline-flex items-center border-b-2 px-4 py-2 text-base font-semibold rounded-lg transition-all duration-200 hover:shadow-md navbar-link'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                {user ? (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex items-center rounded-full bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 px-4 py-2">
                        <span className="sr-only">Open user menu</span>
                        <div className="flex items-center">
                          <span className="mr-3 text-gray-700 font-medium">{user.name} ({user.role.charAt(0).toUpperCase() + user.role.slice(1)})</span>
                          {user.profilePicture ? (
                            <img
                              src={getProfilePictureUrl(user.profilePicture)}
                              alt="Profile"
                              className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-3 w-72 origin-top-right rounded-xl bg-white py-2 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user.name} ({user.role.charAt(0).toUpperCase() + user.role.slice(1)})</p>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/profile"
                              className={classNames(
                                active ? 'bg-primary-50 text-primary-700' : 'text-gray-700',
                                'block px-4 py-3 text-base font-medium navbar-link menu-item hover:bg-primary-50 transition-colors duration-150'
                              )}
                            >
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Profile
                              </div>
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={classNames(
                                active ? 'bg-red-50 text-red-700' : 'text-gray-700',
                                'block w-full px-4 py-3 text-left text-base font-medium navbar-link menu-item hover:bg-red-50 transition-colors duration-150'
                              )}
                            >
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign out
                              </div>
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex space-x-3">
                    <Link
                      to="/login"
                      className="text-gray-600 hover:text-gray-900 px-4 py-2 text-base font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 navbar-link"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 px-6 py-2 rounded-lg text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 navbar-link"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden bg-white border-t border-gray-100">
            <div className="space-y-1 pb-3 pt-2 px-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    location.pathname === item.href
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900',
                    'block border-l-4 py-3 pl-4 pr-4 text-lg font-semibold rounded-r-lg transition-all duration-200'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            {user ? (
              <div className="border-t border-gray-200 pb-4 pt-4 px-4">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    {user.profilePicture ? (
                      <img
                        src={getProfilePictureUrl(user.profilePicture)}
                        alt="Profile"
                        className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-xl shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-base font-semibold text-gray-900">{user.name} ({user.role.charAt(0).toUpperCase() + user.role.slice(1)})</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-3 text-lg font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors duration-150 navbar-link menu-item"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-left text-lg font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors duration-150 navbar-link menu-item"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-200 pb-4 pt-4 px-4">
                <div className="space-y-2">
                  <Link
                    to="/login"
                    className="block px-4 py-3 text-lg font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors duration-150 navbar-link"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-3 text-lg font-semibold bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 navbar-link text-center"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
} 