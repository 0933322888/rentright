import { Fragment, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import '../styles/navbar.css';

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
        { name: 'My Properties', href: '/my-properties' },
        { name: 'Contact', href: '/contact' },
      ];
    }

    // Tenant navigation
    const tenantItems = [
      { name: 'Dashboard', href: '/dashboard' },
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
    <Disclosure as="nav" className="bg-white shadow w-full">
      {({ open }) => (
        <>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link to={user?.role === 'landlord' ? '/my-properties' : '/'} className="text-xl font-bold text-primary-600 navbar-link">
                    RentRight
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={classNames(
                        location.pathname === item.href
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                        'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium navbar-link'
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
                      <Menu.Button className="flex items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                        <span className="sr-only">Open user menu</span>
                        <div className="flex items-center">
                          <span className="mr-2 text-gray-700">{user.name}</span>
                          {user.profilePicture ? (
                            <img
                              src={`${import.meta.env.VITE_API_URL}${user.profilePicture}`}
                              alt="Profile"
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
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
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/profile"
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block px-4 py-2 text-sm text-gray-700 navbar-link menu-item'
                              )}
                            >
                              Profile
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block w-full px-4 py-2 text-left text-sm text-gray-700 navbar-link menu-item'
                              )}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex space-x-4">
                    <Link
                      to="/login"
                      className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium navbar-link"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="bg-primary-600 text-white hover:bg-primary-500 px-3 py-2 rounded-md text-sm font-medium navbar-link"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    location.pathname === item.href
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700',
                    'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            {user ? (
              <div className="border-t border-gray-200 pb-3 pt-4">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    {user.profilePicture ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${user.profilePicture}`}
                        alt="Profile"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user.name}</div>
                    <div className="text-sm font-medium text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 navbar-link menu-item"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 navbar-link menu-item"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-200 pb-3 pt-4">
                <div className="space-y-1">
                  <Link
                    to="/login"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 navbar-link"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 navbar-link"
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