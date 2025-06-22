import { useState } from 'react';
import { FaHome, FaUser } from 'react-icons/fa';

export default function RoleSelectionModal({ show, onHide, onRoleSelect, userData }) {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = async (role) => {
    setSelectedRole(role);
    setLoading(true);
    
    try {
      await onRoleSelect(role, userData);
    } catch (error) {
      console.error('Error setting role:', error);
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Choose Your Role
          </h2>
          <p className="text-gray-600 mb-6">
            Welcome to RentRight! Please select how you'll be using our platform.
          </p>

          <div className="space-y-4">
            {/* Tenant Option */}
            <button
              onClick={() => handleRoleSelect('tenant')}
              disabled={loading}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                selectedRole === 'tenant'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-full mr-4 ${
                  selectedRole === 'tenant' ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  <FaUser className={`text-xl ${
                    selectedRole === 'tenant' ? 'text-primary-600' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">I'm Looking to Rent</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Browse properties, apply for rentals, and manage your applications
                  </p>
                </div>
              </div>
            </button>

            {/* Landlord Option */}
            <button
              onClick={() => handleRoleSelect('landlord')}
              disabled={loading}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                selectedRole === 'landlord'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-full mr-4 ${
                  selectedRole === 'landlord' ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  <FaHome className={`text-xl ${
                    selectedRole === 'landlord' ? 'text-primary-600' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">I'm a Property Owner</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    List properties, manage applications, and find quality tenants
                  </p>
                </div>
              </div>
            </button>
          </div>

          {loading && (
            <div className="mt-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Setting up your account...</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onHide}
              disabled={loading}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 